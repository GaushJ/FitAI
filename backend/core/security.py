"""Auth primitives: password hashing, JWT issuance/verification, and the
get_current_user dependency shared by every protected route."""
import datetime
from typing import Optional

import bcrypt as _bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import SECRET_KEY, ALGORITHM, TOKEN_EXPIRE_DAYS
from db.crud.users import get_user_by_id
from db.models import User
from db.session import get_db

http_bearer = HTTPBearer(auto_error=False)


# Use bcrypt directly — passlib 1.7.4 is incompatible with bcrypt 4.x because
# passlib's internal wrap-bug detection uses a 73-byte test string which newer
# bcrypt now rejects. Calling bcrypt directly avoids that internal check.
def hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode("utf-8")[:72], _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode())


def create_access_token(user_id: int) -> str:
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency — validate JWT and return the requesting User."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token is invalid or has expired. Please log in again.")

    user = await get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User account no longer exists.")
    return user
