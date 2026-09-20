"""Unit tests for the deterministic target calculator (no DB, no AI).

Reference values are worked out by hand from the published formulas so a change
to a constant shows up here as a deliberate, reviewable diff.
"""
import pytest

from services.nutrition_targets import (
    ActivityLevel,
    Goal,
    Sex,
    calculate_bmr,
    calculate_targets,
    calculate_tdee,
    calories_from_macros,
)

MALE = dict(sex=Sex.male, age=30, height_cm=180, weight_kg=80)
FEMALE = dict(sex=Sex.female, age=25, height_cm=165, weight_kg=60)


class TestMifflinStJeor:
    def test_male(self):
        # 10*80 + 6.25*180 - 5*30 + 5
        assert calculate_bmr(Sex.male, 30, 180, 80) == 1780

    def test_female(self):
        # 10*60 + 6.25*165 - 5*25 - 161
        assert calculate_bmr(Sex.female, 25, 165, 60) == pytest.approx(1345.25)


class TestTdee:
    @pytest.mark.parametrize(
        "level,factor",
        [
            (ActivityLevel.sedentary, 1.2),
            (ActivityLevel.light, 1.375),
            (ActivityLevel.moderate, 1.55),
            (ActivityLevel.very_active, 1.725),
            (ActivityLevel.extra_active, 1.9),
        ],
    )
    def test_applies_activity_factor(self, level, factor):
        assert calculate_tdee(1000, level) == pytest.approx(1000 * factor)


class TestAtwaterFactors:
    def test_four_four_nine(self):
        assert calories_from_macros(protein_g=100, carbs_g=200, fat_g=50) == 400 + 800 + 450

    def test_zero(self):
        assert calories_from_macros(0, 0, 0) == 0


class TestGoalCalories:
    def plan(self, goal, base=MALE, activity=ActivityLevel.moderate):
        return calculate_targets(activity=activity, goal=goal, **base)

    def test_maintain_is_tdee(self):
        plan = self.plan(Goal.maintain)
        assert plan.tdee == round(1780 * 1.55)  # 2759
        # Macro rounding can move the total a few kcal off TDEE, never more.
        assert abs(plan.calorie_adjustment) <= 10

    def test_weight_loss_uses_three_quarters_percent_per_week(self):
        plan = self.plan(Goal.lose_weight)
        expected_deficit = 80 * 0.0075 * 7700 / 7  # 660 kcal/day
        assert plan.calorie_adjustment == pytest.approx(-expected_deficit, abs=10)

    def test_weight_loss_deficit_is_capped_at_1000(self):
        heavy = dict(sex=Sex.male, age=30, height_cm=190, weight_kg=200)
        plan = self.plan(Goal.lose_weight, base=heavy)
        assert plan.calorie_adjustment >= -1010

    def test_recomposition_is_a_small_deficit(self):
        assert self.plan(Goal.recomposition).calorie_adjustment == pytest.approx(-150, abs=10)

    def test_build_muscle_is_ten_percent_surplus(self):
        plan = self.plan(Goal.build_muscle)
        assert plan.calorie_adjustment == pytest.approx(plan.tdee * 0.10, abs=10)

    def test_gain_weight_is_twenty_percent_surplus(self):
        plan = self.plan(Goal.gain_weight)
        assert plan.calorie_adjustment == pytest.approx(plan.tdee * 0.20, abs=10)

    def test_goals_are_ordered_by_calories(self):
        order = [Goal.lose_weight, Goal.recomposition, Goal.maintain, Goal.build_muscle, Goal.gain_weight]
        calories = [self.plan(g).calories for g in order]
        assert calories == sorted(calories)
        assert len(set(calories)) == len(calories)


class TestMacros:
    @pytest.mark.parametrize("goal", list(Goal))
    @pytest.mark.parametrize("base", [MALE, FEMALE])
    def test_calories_always_match_macros(self, goal, base):
        plan = calculate_targets(activity=ActivityLevel.moderate, goal=goal, **base)
        assert plan.calories == 4 * plan.protein_g + 4 * plan.carbs_g + 9 * plan.fat_g

    def test_protein_per_kg_follows_goal(self):
        plan = calculate_targets(activity=ActivityLevel.moderate, goal=Goal.recomposition, **MALE)
        assert plan.protein_g == round(2.2 * 80)

    def test_fat_is_about_a_quarter_of_calories(self):
        plan = calculate_targets(activity=ActivityLevel.moderate, goal=Goal.maintain, **MALE)
        assert plan.fat_g * 9 / plan.calories == pytest.approx(0.25, abs=0.02)

    def test_carbs_never_negative_and_protein_yields_to_a_minimum_carb_floor(self):
        plan = calculate_targets(
            sex=Sex.female, age=60, height_cm=150, weight_kg=140,
            activity=ActivityLevel.sedentary, goal=Goal.lose_weight,
        )
        assert plan.carbs_g >= 50

    def test_high_bmi_sizes_protein_from_capped_reference_weight(self):
        # BMI 40 person: protein should not be 2.0 g/kg of total body weight.
        plan = calculate_targets(
            sex=Sex.male, age=40, height_cm=175, weight_kg=122.5,
            activity=ActivityLevel.light, goal=Goal.lose_weight,
        )
        assert plan.protein_g < 2.0 * 122.5


class TestSafetyGuards:
    def test_calorie_floor_for_women(self):
        plan = calculate_targets(
            sex=Sex.female, age=70, height_cm=150, weight_kg=45,
            activity=ActivityLevel.sedentary, goal=Goal.recomposition,
        )
        assert plan.calories >= 1195  # 1200 floor, allowing macro rounding
        assert any("minimum" in w for w in plan.warnings)

    def test_underweight_weight_loss_becomes_maintenance(self):
        plan = calculate_targets(
            sex=Sex.female, age=25, height_cm=170, weight_kg=50,  # BMI 17.3
            activity=ActivityLevel.moderate, goal=Goal.lose_weight,
        )
        assert plan.goal is Goal.maintain
        assert abs(plan.calorie_adjustment) <= 10
        assert any("BMI" in w for w in plan.warnings)

    def test_obese_surplus_gets_a_warning_but_still_computes(self):
        plan = calculate_targets(
            sex=Sex.male, age=35, height_cm=175, weight_kg=110,  # BMI 35.9
            activity=ActivityLevel.light, goal=Goal.build_muscle,
        )
        assert plan.calorie_adjustment > 0
        assert any("surplus" in w for w in plan.warnings)

    def test_no_warnings_for_ordinary_input(self):
        plan = calculate_targets(activity=ActivityLevel.moderate, goal=Goal.maintain, **MALE)
        assert plan.warnings == []
