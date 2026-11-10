from typing import Optional

from pydantic import BaseModel, Field

from schemas.targets import AGE_RANGE, HEIGHT_CM_RANGE, WEIGHT_KG_RANGE
from services.nutrition_targets import ActivityLevel, Goal, Sex


class SignupSchema(BaseModel):
    username: str
    password: str
    name: str


class LoginSchema(BaseModel):
    username: str
    password: str


class UserUpdateSchema(BaseModel):
    name: str
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float

    # Optional body profile; omitted/None fields leave the stored value unchanged.
    sex: Optional[Sex] = None
    age: Optional[int] = Field(default=None, **AGE_RANGE)
    height_cm: Optional[float] = Field(default=None, **HEIGHT_CM_RANGE)
    weight_kg: Optional[float] = Field(default=None, **WEIGHT_KG_RANGE)
    activity_level: Optional[ActivityLevel] = None
    goal: Optional[Goal] = None
