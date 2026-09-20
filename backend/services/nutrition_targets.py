"""Daily calorie & macro target calculator.

Plain deterministic formulas — no AI/LLM involved. Every constant below names the
published source it comes from, so the numbers can be audited and tuned in one place.

Pipeline:  BMR  ->  TDEE  ->  goal-adjusted calories  ->  protein / fat / carbs.

Sources
-------
* BMR: Mifflin MD, St Jeor ST, et al. "A new predictive equation for resting energy
  expenditure in healthy individuals." Am J Clin Nutr 1990;51(2):241-247. Endorsed by the
  (American) Academy of Nutrition and Dietetics as the most accurate estimate for healthy adults.
* Energy per gram: Atwater general factors (USDA / FAO): protein 4, carbohydrate 4, fat 9 kcal/g.
* Weight-loss rate & floors: NHLBI Clinical Guidelines on Overweight and Obesity in Adults
  (a 500-1,000 kcal/day deficit -> ~1-2 lb/week; minimum intakes of roughly 1,200 kcal for women
  and 1,500 kcal for men outside medical supervision); Helms ER et al., J Int Soc Sports Nutr 2014
  (0.5-1 % of body weight lost per week preserves muscle).
* 7,700 kcal per kg of body weight: the classic 3,500 kcal/lb rule of thumb (Wishnofsky 1958).
  It is an approximation; real-world loss slows as weight drops.
* Protein: Jager R et al., ISSN position stand, J Int Soc Sports Nutr 2017 (1.4-2.0 g/kg);
  Morton RW et al., Br J Sports Med 2018 (gains plateau near 1.6 g/kg, upper CI ~2.2 g/kg);
  Helms 2014 (higher intakes while in a deficit); Barakat C et al., Strength Cond J 2020
  (recomposition needs high protein, ~2.2+ g/kg, plus progressive resistance training).
* Fat: Helms 2014 (15-30 % of energy); Iraki J et al., Sports 2019 (0.5-1.5 g/kg).
* Surplus: Iraki 2019 (a ~10-20 % surplus for gaining).

Known limitation: the 1.2-1.9 activity multipliers are the de-facto standard used by nearly
every TDEE calculator, but we could not trace a peer-reviewed origin for those exact values.
Treat all outputs as a starting point and adjust from real progress over 2-3 weeks.
"""
from dataclasses import dataclass, field
from enum import Enum


class Sex(str, Enum):
    male = "male"
    female = "female"


class ActivityLevel(str, Enum):
    sedentary = "sedentary"
    light = "light"
    moderate = "moderate"
    very_active = "very_active"
    extra_active = "extra_active"


class Goal(str, Enum):
    lose_weight = "lose_weight"
    maintain = "maintain"
    recomposition = "recomposition"
    build_muscle = "build_muscle"
    gain_weight = "gain_weight"


# ── Constants ────────────────────────────────────────────────────────────────

# Atwater general factors (kcal per gram).
KCAL_PER_G_PROTEIN = 4
KCAL_PER_G_CARBS = 4
KCAL_PER_G_FAT = 9

ACTIVITY_FACTORS: dict[ActivityLevel, float] = {
    ActivityLevel.sedentary: 1.2,      # desk job, little or no exercise
    ActivityLevel.light: 1.375,        # light exercise 1-3 days/week
    ActivityLevel.moderate: 1.55,      # moderate exercise 3-5 days/week
    ActivityLevel.very_active: 1.725,  # hard exercise 6-7 days/week
    ActivityLevel.extra_active: 1.9,   # very hard exercise, physical job or 2x/day training
}

KCAL_PER_KG_BODY_WEIGHT = 7700
WEEKLY_LOSS_FRACTION = 0.0075                  # 0.75 % body weight/week: middle of Helms' 0.5-1 %
MIN_DEFICIT_KCAL, MAX_DEFICIT_KCAL = 250, 1000  # NHLBI: up to 500-1,000 kcal/day
RECOMPOSITION_ADJUSTMENT_KCAL = -150           # maintenance or a very small deficit (Barakat 2020)
BUILD_MUSCLE_SURPLUS = 0.10                    # low end of Iraki's 10-20 %: limits fat gain
GAIN_WEIGHT_SURPLUS = 0.20                     # high end of Iraki's 10-20 %

MIN_CALORIES = {Sex.female: 1200, Sex.male: 1500}

PROTEIN_G_PER_KG: dict[Goal, float] = {
    Goal.lose_weight: 2.0,
    Goal.maintain: 1.6,
    Goal.recomposition: 2.2,
    Goal.build_muscle: 1.8,
    Goal.gain_weight: 1.6,
}

FAT_FRACTION_OF_CALORIES = 0.25              # inside Helms' 15-30 %
FAT_G_PER_KG_MIN, FAT_G_PER_KG_MAX = 0.5, 1.5  # Iraki 2019
MIN_CARBS_G = 50                             # protein is trimmed before carbs drop below this

# Engineering choice (not from a paper): per-kg protein targets are defined for lean-to-average
# builds, so at high adiposity we size protein/fat off the weight at BMI 30 instead of total mass.
PROTEIN_BMI_CAP = 30.0

UNDERWEIGHT_BMI = 18.5
OBESE_BMI = 30.0


# ── Result type ──────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class TargetPlan:
    bmr: int
    tdee: int
    calories: int          # always equals 4*protein + 4*carbs + 9*fat
    protein_g: int
    carbs_g: int
    fat_g: int
    calorie_adjustment: int  # calories - tdee (negative = deficit)
    bmi: float
    goal: Goal             # the goal actually applied (can differ from the one requested)
    warnings: list[str] = field(default_factory=list)


# ── Building blocks (each independently testable) ────────────────────────────

def calories_from_macros(protein_g: float, carbs_g: float, fat_g: float) -> int:
    """Energy in a macro split using Atwater's 4/4/9 factors."""
    return round(
        protein_g * KCAL_PER_G_PROTEIN + carbs_g * KCAL_PER_G_CARBS + fat_g * KCAL_PER_G_FAT
    )


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    return weight_kg / (height_cm / 100) ** 2


def calculate_bmr(sex: Sex, age: int, height_cm: float, weight_kg: float) -> float:
    """Mifflin-St Jeor resting energy expenditure, kcal/day."""
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    return base + 5 if sex is Sex.male else base - 161


def calculate_tdee(bmr: float, activity: ActivityLevel) -> float:
    return bmr * ACTIVITY_FACTORS[activity]


def _goal_calories(goal: Goal, tdee: float, weight_kg: float) -> float:
    if goal is Goal.lose_weight:
        weekly_loss_kg = weight_kg * WEEKLY_LOSS_FRACTION
        deficit = weekly_loss_kg * KCAL_PER_KG_BODY_WEIGHT / 7
        return tdee - min(max(deficit, MIN_DEFICIT_KCAL), MAX_DEFICIT_KCAL)
    if goal is Goal.recomposition:
        return tdee + RECOMPOSITION_ADJUSTMENT_KCAL
    if goal is Goal.build_muscle:
        return tdee * (1 + BUILD_MUSCLE_SURPLUS)
    if goal is Goal.gain_weight:
        return tdee * (1 + GAIN_WEIGHT_SURPLUS)
    return tdee


def _split_macros(calories: float, goal: Goal, weight_kg: float, height_cm: float) -> tuple[int, int, int]:
    """Protein from g/kg, fat from % of calories (bounded in g/kg), carbs fill the rest."""
    height_m = height_cm / 100
    reference_kg = min(weight_kg, PROTEIN_BMI_CAP * height_m**2)

    fat_g = round(
        min(
            max(calories * FAT_FRACTION_OF_CALORIES / KCAL_PER_G_FAT, FAT_G_PER_KG_MIN * reference_kg),
            FAT_G_PER_KG_MAX * reference_kg,
        )
    )
    protein_g = round(PROTEIN_G_PER_KG[goal] * reference_kg)

    # Never let protein + fat crowd carbs out entirely on a very low calorie budget.
    protein_ceiling = (calories - fat_g * KCAL_PER_G_FAT - MIN_CARBS_G * KCAL_PER_G_CARBS) / KCAL_PER_G_PROTEIN
    protein_g = max(0, min(protein_g, int(protein_ceiling)))

    carbs_g = max(0, round((calories - protein_g * KCAL_PER_G_PROTEIN - fat_g * KCAL_PER_G_FAT) / KCAL_PER_G_CARBS))
    return protein_g, carbs_g, fat_g


# ── Public entry point ───────────────────────────────────────────────────────

def calculate_targets(
    *,
    sex: Sex,
    age: int,
    height_cm: float,
    weight_kg: float,
    activity: ActivityLevel,
    goal: Goal,
) -> TargetPlan:
    warnings: list[str] = []
    bmi = calculate_bmi(weight_kg, height_cm)
    applied_goal = goal

    if goal is Goal.lose_weight and bmi < UNDERWEIGHT_BMI:
        applied_goal = Goal.maintain
        warnings.append(
            f"Your BMI is {bmi:.1f} (under {UNDERWEIGHT_BMI}), so a weight-loss deficit isn't advisable. "
            "Maintenance targets are shown instead."
        )
    if goal in (Goal.build_muscle, Goal.gain_weight) and bmi >= OBESE_BMI:
        warnings.append(
            f"Your BMI is {bmi:.1f} (30 or above). A calorie surplus is usually not advised at this weight; "
            "consider recomposition or weight loss."
        )

    bmr = calculate_bmr(sex, age, height_cm, weight_kg)
    tdee = calculate_tdee(bmr, activity)
    calories = _goal_calories(applied_goal, tdee, weight_kg)

    floor = MIN_CALORIES[sex]
    if calories < floor:
        calories = floor
        warnings.append(
            f"Calories were raised to the {floor} kcal/day minimum for safety. "
            "Talk to a doctor or dietitian before eating less than this."
        )

    protein_g, carbs_g, fat_g = _split_macros(calories, applied_goal, weight_kg, height_cm)
    final_calories = calories_from_macros(protein_g, carbs_g, fat_g)

    return TargetPlan(
        bmr=round(bmr),
        tdee=round(tdee),
        calories=final_calories,
        protein_g=protein_g,
        carbs_g=carbs_g,
        fat_g=fat_g,
        calorie_adjustment=final_calories - round(tdee),
        bmi=round(bmi, 1),
        goal=applied_goal,
        warnings=warnings,
    )
