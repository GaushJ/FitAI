from pydantic import BaseModel, Field

from services.nutrition_targets import ActivityLevel, Goal, Sex

# Bounds: Mifflin-St Jeor was derived on adults (19-78 y); deficits/surpluses aren't
# appropriate for minors, so the calculator is adults-only.
AGE_RANGE = {"ge": 18, "le": 100}
HEIGHT_CM_RANGE = {"ge": 120, "le": 230}
WEIGHT_KG_RANGE = {"ge": 30, "le": 300}


class TargetInputsSchema(BaseModel):
    sex: Sex
    age: int = Field(**AGE_RANGE)
    height_cm: float = Field(**HEIGHT_CM_RANGE)
    weight_kg: float = Field(**WEIGHT_KG_RANGE)
    activity_level: ActivityLevel
    goal: Goal


class TargetPlanSchema(BaseModel):
    bmr: int
    tdee: int
    bmi: float
    goal: Goal
    calories: int
    protein: int
    carbs: int
    fat: int
    calorie_adjustment: int
    warnings: list[str]
