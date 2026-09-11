from pydantic import BaseModel


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
