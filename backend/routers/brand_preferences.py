"""Brand Preferences (global — no auth required)."""
import base64
import datetime
import io
import json
import os
import re
from typing import Optional

import anthropic
from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.crud.brand_preferences import (
    delete_brand_preference,
    get_brand_preferences,
    set_brand_preference,
)
from db.models import BrandPreference, IngredientCache
from db.session import get_db
from schemas.brand_preferences import (
    BrandPreferenceSchema,
    MacroUpdateSchema,
    PrefRenameSchema,
)

router = APIRouter(prefix="/api/brand-preferences", tags=["brand-preferences"])


@router.get("")
async def list_brand_preferences(db: AsyncSession = Depends(get_db)):
    prefs = await get_brand_preferences(db)
    result = []
    for p in prefs:
        # Look up cached macros for this ingredient+brand pair
        cache_res = await db.execute(
            select(IngredientCache).where(
                IngredientCache.name == p.ingredient_name,
                IngredientCache.brand == p.preferred_brand,
            ).limit(1)
        )
        cache = cache_res.scalar_one_or_none()
        entry = {
            "ingredient_name": p.ingredient_name,
            "preferred_brand": p.preferred_brand,
            "calories_per_100g": cache.calories_per_100g if cache else None,
            "protein_per_100g": cache.protein_per_100g if cache else None,
            "carbs_per_100g": cache.carbs_per_100g if cache else None,
            "fat_per_100g": cache.fat_per_100g if cache else None,
            "unit": (cache.unit if cache and cache.unit else "g"),
        }
        result.append(entry)
    return result


@router.post("")
async def upsert_brand_preference(payload: BrandPreferenceSchema, db: AsyncSession = Depends(get_db)):
    pref = await set_brand_preference(db, payload.ingredient_name, payload.preferred_brand)
    # If macro data was provided, also upsert the ingredient cache
    if any(v is not None for v in [payload.calories_per_100g, payload.protein_per_100g, payload.carbs_per_100g, payload.fat_per_100g]):
        name_l = payload.ingredient_name.strip().lower()
        brand_l = payload.preferred_brand.strip().lower()
        cache_res = await db.execute(
            select(IngredientCache).where(IngredientCache.name == name_l, IngredientCache.brand == brand_l).limit(1)
        )
        cache = cache_res.scalar_one_or_none()
        if cache:
            cache.calories_per_100g = payload.calories_per_100g or cache.calories_per_100g
            cache.protein_per_100g  = payload.protein_per_100g  or cache.protein_per_100g
            cache.carbs_per_100g    = payload.carbs_per_100g    or cache.carbs_per_100g
            cache.fat_per_100g      = payload.fat_per_100g      or cache.fat_per_100g
        else:
            db.add(IngredientCache(
                name=name_l, brand=brand_l,
                calories_per_100g=payload.calories_per_100g or 0,
                protein_per_100g=payload.protein_per_100g or 0,
                carbs_per_100g=payload.carbs_per_100g or 0,
                fat_per_100g=payload.fat_per_100g or 0,
            ))
        await db.commit()
    return {"status": "success", "ingredient_name": pref.ingredient_name, "preferred_brand": pref.preferred_brand}


@router.patch("/{ingredient_name}/macros")
async def update_preference_macros(ingredient_name: str, payload: MacroUpdateSchema, db: AsyncSession = Depends(get_db)):
    name_l = ingredient_name.strip().lower()
    pref_res = await db.execute(select(BrandPreference).where(BrandPreference.ingredient_name == name_l))
    pref = pref_res.scalar_one_or_none()
    if not pref:
        raise HTTPException(status_code=404, detail=f"No preference found for '{ingredient_name}'")
    brand_l = pref.preferred_brand
    cache_res = await db.execute(
        select(IngredientCache).where(IngredientCache.name == name_l, IngredientCache.brand == brand_l).limit(1)
    )
    cache = cache_res.scalar_one_or_none()
    if cache:
        cache.calories_per_100g = payload.calories_per_100g
        cache.protein_per_100g  = payload.protein_per_100g
        cache.carbs_per_100g    = payload.carbs_per_100g
        cache.fat_per_100g      = payload.fat_per_100g
    else:
        db.add(IngredientCache(
            name=name_l, brand=brand_l,
            calories_per_100g=payload.calories_per_100g,
            protein_per_100g=payload.protein_per_100g,
            carbs_per_100g=payload.carbs_per_100g,
            fat_per_100g=payload.fat_per_100g,
        ))
    await db.commit()
    return {"status": "updated", "ingredient_name": name_l}


@router.patch("/{ingredient_name}/rename")
async def rename_brand_preference(ingredient_name: str, payload: PrefRenameSchema, db: AsyncSession = Depends(get_db)):
    old_name = ingredient_name.strip().lower()
    new_name = payload.new_ingredient_name.strip().lower()
    new_brand = payload.new_brand.strip().lower()

    pref_res = await db.execute(select(BrandPreference).where(BrandPreference.ingredient_name == old_name))
    pref = pref_res.scalar_one_or_none()
    if not pref:
        raise HTTPException(status_code=404, detail=f"No preference found for '{ingredient_name}'")

    old_brand = pref.preferred_brand

    # Move IngredientCache row if it exists
    cache_res = await db.execute(
        select(IngredientCache).where(IngredientCache.name == old_name, IngredientCache.brand == old_brand).limit(1)
    )
    cache = cache_res.scalar_one_or_none()
    if cache:
        cache.name  = new_name
        cache.brand = new_brand

    pref.ingredient_name  = new_name
    pref.preferred_brand  = new_brand
    await db.commit()
    return {"status": "renamed", "ingredient_name": new_name, "brand": new_brand}


@router.delete("/{ingredient_name}")
async def remove_brand_preference(ingredient_name: str, db: AsyncSession = Depends(get_db)):
    deleted = await delete_brand_preference(db, ingredient_name)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"No preference found for '{ingredient_name}'")
    return {"status": "deleted", "ingredient_name": ingredient_name}


@router.get("/export")
async def export_brand_preferences(db: AsyncSession = Depends(get_db)):
    """
    Export all brand preferences + their cached nutrition data as a styled .xlsx file.
    The downloaded file can be re-uploaded via /api/brand-preferences/import to bulk-restore
    preferences on a fresh deployment or share them with another device.
    """
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

    # ── Fetch all preferences + cache entries ────────────────────────────────
    prefs  = await get_brand_preferences(db)
    caches_res = await db.execute(select(IngredientCache))
    caches = caches_res.scalars().all()

    # Build lookup: (ingredient_name, brand) → cache row
    cache_map: dict = {}
    for c in caches:
        key = (c.name.lower(), (c.brand or "").lower())
        cache_map[key] = c

    # ── Build workbook ───────────────────────────────────────────────────────
    wb = Workbook()
    ws = wb.active
    ws.title = "Brand Preferences"

    # ── Colour palette
    HEADER_BG   = "4F46E5"   # indigo-600
    HEADER_FG   = "FFFFFF"
    ALT_ROW_BG  = "F1F0FF"   # very light indigo tint
    BORDER_CLR  = "C7D2FE"   # indigo-200
    NOTE_BG     = "EEF2FF"

    thin = Side(style="thin", color=BORDER_CLR)
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    # ── Instructions row ─────────────────────────────────────────────────────
    ws.merge_cells("A1:F1")
    ws["A1"] = (
        "FitVoice — Brand Preferences Export  |  "
        "Columns A–B are required for import. "
        "Edit nutritional values (C–F) and re-upload to update the ingredient cache."
    )
    ws["A1"].font      = Font(name="Arial", size=9, italic=True, color="6366F1")
    ws["A1"].fill      = PatternFill("solid", fgColor=NOTE_BG)
    ws["A1"].alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = 28

    # ── Column headers ────────────────────────────────────────────────────────
    headers = [
        ("Ingredient",       "A", 22),
        ("Brand",            "B", 22),
        ("Calories / 100g",  "C", 17),
        ("Protein / 100g",   "D", 17),
        ("Carbs / 100g",     "E", 17),
        ("Fat / 100g",       "F", 17),
    ]

    for col_idx, (label, col_letter, width) in enumerate(headers, start=1):
        cell = ws.cell(row=2, column=col_idx, value=label)
        cell.font      = Font(name="Arial", size=10, bold=True, color=HEADER_FG)
        cell.fill      = PatternFill("solid", fgColor=HEADER_BG)
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border    = border
        ws.column_dimensions[col_letter].width = width

    ws.row_dimensions[2].height = 22

    # ── Data rows ─────────────────────────────────────────────────────────────
    for row_idx, pref in enumerate(prefs, start=3):
        name_lower  = pref.ingredient_name.lower()
        brand_lower = pref.preferred_brand.lower()
        cache_entry = cache_map.get((name_lower, brand_lower)) or cache_map.get((name_lower, ""))

        row_fill = PatternFill("solid", fgColor=ALT_ROW_BG) if row_idx % 2 == 0 else PatternFill("solid", fgColor="FFFFFF")

        data = [
            pref.ingredient_name,
            pref.preferred_brand,
            round(cache_entry.calories_per_100g, 1) if cache_entry else "",
            round(cache_entry.protein_per_100g,  1) if cache_entry else "",
            round(cache_entry.carbs_per_100g,    1) if cache_entry else "",
            round(cache_entry.fat_per_100g,      1) if cache_entry else "",
        ]

        for col_idx, value in enumerate(data, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.font      = Font(name="Arial", size=10)
            cell.fill      = row_fill
            cell.alignment = Alignment(horizontal="center" if col_idx > 2 else "left", vertical="center")
            cell.border    = border

        ws.row_dimensions[row_idx].height = 18

    # ── Freeze header rows + auto-filter ─────────────────────────────────────
    ws.freeze_panes = "A3"
    ws.auto_filter.ref = f"A2:F{max(2, 1 + len(prefs))}"

    # ── Stream back as .xlsx ──────────────────────────────────────────────────
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"fitvoice_brand_preferences_{datetime.date.today().isoformat()}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/import")
async def import_brand_preferences(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Bulk-import brand preferences from an .xlsx file (same format as the export).
    Each row must have at minimum: Ingredient (col A) and Brand (col B).
    Nutritional columns C–F, if filled, update the ingredient cache as well.
    Returns a summary of rows imported vs. skipped.
    """
    from openpyxl import load_workbook

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        wb = load_workbook(filename=io.BytesIO(content), data_only=True)
    except Exception:
        raise HTTPException(status_code=422, detail="Could not parse file. Please upload a valid .xlsx file.")

    ws = wb.active
    imported = skipped = 0
    errors: list[str] = []

    for row in ws.iter_rows(min_row=3, values_only=True):  # row 1=note, row 2=header
        # Skip fully empty rows
        if not any(row):
            continue

        ingredient = str(row[0]).strip() if row[0] is not None else ""
        brand      = str(row[1]).strip() if row[1] is not None else ""

        if not ingredient or not brand:
            skipped += 1
            continue

        name_lower  = ingredient.lower()
        brand_lower = brand.lower()

        # Save brand preference
        await set_brand_preference(db, ingredient, brand)

        # If nutritional columns are provided, upsert ingredient cache
        try:
            cal  = float(row[2]) if row[2] not in (None, "") else None
            prot = float(row[3]) if row[3] not in (None, "") else None
            carb = float(row[4]) if row[4] not in (None, "") else None
            fat  = float(row[5]) if row[5] not in (None, "") else None

            if all(v is not None for v in [cal, prot, carb, fat]):
                existing = await db.execute(
                    select(IngredientCache).where(
                        IngredientCache.name  == name_lower,
                        IngredientCache.brand == brand_lower,
                    )
                )
                entry = existing.scalar_one_or_none()
                if entry:
                    entry.calories_per_100g = cal
                    entry.protein_per_100g  = prot
                    entry.carbs_per_100g    = carb
                    entry.fat_per_100g      = fat
                else:
                    db.add(IngredientCache(
                        name=name_lower, brand=brand_lower,
                        calories_per_100g=cal, protein_per_100g=prot,
                        carbs_per_100g=carb, fat_per_100g=fat,
                    ))
        except (ValueError, TypeError):
            errors.append(f"Row '{ingredient}/{brand}': invalid nutrition value — skipped cache update.")

        imported += 1

    await db.commit()
    return {
        "status": "success",
        "imported": imported,
        "skipped": skipped,
        "warnings": errors,
        "message": f"{imported} preference(s) imported{f', {skipped} skipped' if skipped else ''}.",
    }


@router.post("/label")
async def set_brand_from_label(
    ingredient_name: str = Form(...),
    preferred_brand: str = Form(...),
    image: UploadFile = File(...),
    unit: str = Form("g"),
    db: AsyncSession = Depends(get_db),
    x_anthropic_key: Optional[str] = Header(None),
):
    """Extract macros from a nutrition label photo via Claude vision and persist them."""
    image_data = await image.read()
    image_b64  = base64.b64encode(image_data).decode()
    media_type = image.content_type or "image/jpeg"
    api_key = x_anthropic_key or os.environ.get("ANTHROPIC_API_KEY", "")
    client = anthropic.Anthropic(api_key=api_key)

    unit_label = "100ml" if unit == "ml" else "100g"

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[{"role": "user", "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_b64}},
                {"type": "text", "text": (
                    f"This is a nutrition label for '{preferred_brand} {ingredient_name}'. "
                    f"Extract the nutritional values and normalise them to per {unit_label}. "
                    "Reply with ONLY a raw JSON object with these four numeric keys: "
                    "calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g."
                )},
            ]}],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude vision call failed: {e}")

    raw_text   = response.content[0].text.strip()
    json_match = re.search(r'\{.*?\}', raw_text, re.DOTALL)
    if not json_match:
        raise HTTPException(status_code=422, detail="Could not parse nutrition data from label.")

    try:
        macros   = json.loads(json_match.group())
        required = {"calories_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g"}
        if not required.issubset(macros.keys()):
            raise ValueError("Missing keys")
        macros = {k: float(macros[k]) for k in required}
    except Exception:
        raise HTTPException(status_code=422, detail="Label extraction returned incomplete data.")

    name_lower  = ingredient_name.strip().lower()
    brand_lower = preferred_brand.strip().lower()

    result = await db.execute(
        select(IngredientCache).where(IngredientCache.name == name_lower, IngredientCache.brand == brand_lower)
    )
    cache_entry = result.scalar_one_or_none()
    unit_val = "ml" if unit == "ml" else "g"
    if cache_entry:
        cache_entry.calories_per_100g = macros["calories_per_100g"]
        cache_entry.protein_per_100g  = macros["protein_per_100g"]
        cache_entry.carbs_per_100g    = macros["carbs_per_100g"]
        cache_entry.fat_per_100g      = macros["fat_per_100g"]
        cache_entry.unit              = unit_val
    else:
        db.add(IngredientCache(name=name_lower, brand=brand_lower, unit=unit_val, **macros))

    await set_brand_preference(db, ingredient_name, preferred_brand)
    await db.commit()
    return {"status": "success", "ingredient_name": name_lower, "preferred_brand": brand_lower, "macros": macros, "unit": unit, "source": "label_image"}
