import asyncio
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException

from core.security import get_current_user
from db.models import User
from schemas.meals import ResolveIngredientRequest
from services.ingredient_resolution import resolve_ingredient_sync
from services.llm_provider import _api_key_ctx, set_request_key

router = APIRouter(prefix="/api", tags=["ingredients"])


@router.post("/resolve-ingredient")
async def resolve_ingredient(
    payload: ResolveIngredientRequest,
    current_user: User = Depends(get_current_user),
    x_anthropic_key: Optional[str] = Header(None),
):
    set_request_key(x_anthropic_key or "")
    api_key = _api_key_ctx.get()

    try:
        result = await asyncio.get_event_loop().run_in_executor(
            None, resolve_ingredient_sync, payload.name, payload.brand, api_key
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Resolution failed: {e}")
