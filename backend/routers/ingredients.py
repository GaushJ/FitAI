import asyncio
import base64
import json
import os
import re
from typing import List, Optional

import anthropic
from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.models import IngredientCache, User
from db.session import get_db
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


@router.post("/ingredients/scan-labels")
async def scan_ingredient_labels(
    images: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    x_anthropic_key: Optional[str] = Header(None),
):
    """
    On-the-go label scanning: read one or more nutrition-label photos via Claude
    vision (auto-detecting each product's name/brand, unlike the brand-preferences
    label flow which requires those typed in first) and save the macros straight
    to the master ingredient cache. Unlike /api/brand-preferences/label, this never
    creates a brand_preferences row, so scanned items don't surface in the Brand
    Preferences UI — they simply become cache hits the next time that name+brand
    is mentioned in a logged meal.
    """
    api_key = x_anthropic_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=400, detail="No Anthropic API key configured. Add one under Settings → API Keys.")
    client = anthropic.Anthropic(api_key=api_key)

    saved: list = []
    failed: list = []

    for image in images:
        image_data = await image.read()
        if not image_data:
            failed.append({"filename": image.filename, "error": "Empty file."})
            continue

        image_b64 = base64.b64encode(image_data).decode()
        media_type = image.content_type or "image/jpeg"

        try:
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=512,
                messages=[{"role": "user", "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_b64}},
                    {"type": "text", "text": (
                        "This is a photo of a packaged food product — its nutrition facts label and/or "
                        "packaging. Identify the product and extract its nutrition facts, normalised to "
                        "per 100g (or per 100ml if it's a liquid measured in ml). "
                        "Reply with ONLY a raw JSON object with these keys: "
                        "name (the generic food name, lowercase, no brand in it, e.g. 'peanut butter'), "
                        "brand (the brand name, lowercase, or an empty string if you can't identify one), "
                        "unit ('g' or 'ml'), "
                        "calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g (numbers)."
                    )},
                ]}],
            )
        except Exception as e:
            failed.append({"filename": image.filename, "error": f"Claude vision call failed: {e}"})
            continue

        raw_text = response.content[0].text.strip()
        json_match = re.search(r'\{.*?\}', raw_text, re.DOTALL)
        if not json_match:
            failed.append({"filename": image.filename, "error": "Could not parse nutrition data from label."})
            continue

        try:
            data = json.loads(json_match.group())
            name = str(data.get("name", "")).strip().lower()
            brand = (str(data.get("brand", "") or "").strip().lower()) or None
            unit = "ml" if str(data.get("unit", "g")).strip().lower() == "ml" else "g"
            macros = {
                "calories_per_100g": float(data["calories_per_100g"]),
                "protein_per_100g":  float(data["protein_per_100g"]),
                "carbs_per_100g":    float(data["carbs_per_100g"]),
                "fat_per_100g":      float(data["fat_per_100g"]),
            }
            if not name:
                raise ValueError("Missing ingredient name")
        except Exception:
            failed.append({"filename": image.filename, "error": "Label extraction returned incomplete data."})
            continue

        cache_res = await db.execute(
            select(IngredientCache).where(IngredientCache.name == name, IngredientCache.brand == brand)
        )
        cache_entry = cache_res.scalar_one_or_none()
        if cache_entry:
            cache_entry.calories_per_100g = macros["calories_per_100g"]
            cache_entry.protein_per_100g  = macros["protein_per_100g"]
            cache_entry.carbs_per_100g    = macros["carbs_per_100g"]
            cache_entry.fat_per_100g      = macros["fat_per_100g"]
            cache_entry.unit              = unit
        else:
            db.add(IngredientCache(name=name, brand=brand, unit=unit, **macros))

        saved.append({"filename": image.filename, "name": name, "brand": brand or "", "unit": unit, "macros": macros})

    await db.commit()
    return {"status": "success", "saved": saved, "failed": failed}
