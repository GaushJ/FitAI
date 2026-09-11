from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import create_access_token, hash_password, verify_password
from db.crud.users import create_user, get_user_by_username
from db.session import get_db
from schemas.auth import LoginSchema, SignupSchema

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup")
async def signup(payload: SignupSchema, db: AsyncSession = Depends(get_db)):
    """Register a new user. Returns a JWT token on success."""
    if len(payload.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if len(payload.name.strip()) < 1:
        raise HTTPException(status_code=400, detail="Name is required.")

    existing = await get_user_by_username(db, payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken. Please choose another.")

    user = await create_user(
        db,
        username=payload.username,
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
    )
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "username": user.username},
    }


@router.post("/login")
async def login(payload: LoginSchema, db: AsyncSession = Depends(get_db)):
    """Authenticate and return a JWT token."""
    user = await get_user_by_username(db, payload.username)
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "username": user.username},
    }
