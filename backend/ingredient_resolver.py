"""
Single-ingredient resolver service.

Resolution priority (strict — no silent fallbacks):
  1. Brand preferences table  →  if a preferred brand is saved for this ingredient,
     look up (name + preferred_brand) in ingredient_cache.  Hit → done, no LLM.
  2. Caller-supplied brand    →  look up (name + caller_brand) in cache.
  3. No brand at all          →  look up name-only in cache.
  4. Cache miss on all of the above → LLM resolution, result saved to cache.
"""
import os
from typing import Optional, Dict
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class MacroParsingResponse(BaseModel):
    calories_per_100g: float = Field(..., description="Calories per 100g")
    protein_per_100g:  float = Field(..., description="Protein g per 100g")
    carbs_per_100g:    float = Field(..., description="Carbs g per 100g")
    fat_per_100g:      float = Field(..., description="Fat g per 100g")


_FALLBACK_MACROS: Dict[str, float] = {
    "calories_per_100g": 100.0,
    "protein_per_100g":  5.0,
    "carbs_per_100g":    10.0,
    "fat_per_100g":      2.0,
}


async def resolve_single_ingredient(
    name: str,
    brand: Optional[str],
    weight_g: float,
    db: AsyncSession = None,
) -> dict:
    name_lower  = name.strip().lower()
    brand_lower = brand.strip().lower() if brand else None

    # ── Step 1: Check brand preferences ──────────────────────────────────────
    preferred_brand = await _get_preferred_brand(name_lower, db)

    if preferred_brand:
        cached = await _query_cache_exact(name_lower, preferred_brand, db)
        if cached:
            print(f"[IngredientResolver] Cache hit via brand preference: {preferred_brand} {name_lower}")
            return _build_ingredient(name, preferred_brand, weight_g, cached)

        print(f"[IngredientResolver] Brand preference '{preferred_brand}' not cached — fetching via LLM")
        per_100g = await _fetch_from_llm(name_lower, preferred_brand)
        await _save_cache(name_lower, preferred_brand, per_100g, db)
        return _build_ingredient(name, preferred_brand, weight_g, per_100g)

    # ── Step 2: No preference — use caller-supplied brand or name-only ────────
    if brand_lower:
        cached = await _query_cache_exact(name_lower, brand_lower, db)
        if cached:
            print(f"[IngredientResolver] Cache hit (caller brand): {brand_lower} {name_lower}")
            return _build_ingredient(name, brand_lower, weight_g, cached)
    else:
        cached = await _query_cache_no_brand(name_lower, db)
        if cached:
            print(f"[IngredientResolver] Cache hit (no brand): {name_lower}")
            return _build_ingredient(name, None, weight_g, cached)

    # ── Step 3: Cache miss — fetch from LLM ───────────────────────────────────
    resolved_brand = brand_lower
    print(f"[IngredientResolver] Cache miss — fetching via LLM: {resolved_brand or ''} {name_lower}")
    per_100g = await _fetch_from_llm(name_lower, resolved_brand)
    await _save_cache(name_lower, resolved_brand, per_100g, db)
    return _build_ingredient(name, resolved_brand, weight_g, per_100g)


# ── Async DB helpers ──────────────────────────────────────────────────────────

async def _get_preferred_brand(name: str, db: Optional[AsyncSession]) -> Optional[str]:
    if db is None:
        from db_sync import get_preferred_brand
        return get_preferred_brand(name)
    from database import BrandPreference
    res = await db.execute(
        select(BrandPreference).where(BrandPreference.ingredient_name == name)
    )
    pref = res.scalar_one_or_none()
    return pref.preferred_brand if pref else None


async def _query_cache_exact(name: str, brand: str, db: Optional[AsyncSession]) -> Optional[Dict[str, float]]:
    if db is None:
        from db_sync import query_local_cache
        return query_local_cache(name, brand)
    from database import IngredientCache
    res = await db.execute(
        select(IngredientCache).where(
            IngredientCache.name  == name,
            IngredientCache.brand == brand,
        )
    )
    row = res.scalar_one_or_none()
    return _cache_row_to_macros(row) if row else None


async def _query_cache_no_brand(name: str, db: Optional[AsyncSession]) -> Optional[Dict[str, float]]:
    if db is None:
        from db_sync import query_local_cache
        return query_local_cache(name, None)
    from database import IngredientCache
    res = await db.execute(
        select(IngredientCache).where(
            IngredientCache.name  == name,
            IngredientCache.brand == None,  # noqa: E711
        )
    )
    row = res.scalar_one_or_none()
    return _cache_row_to_macros(row) if row else None


async def _save_cache(name: str, brand: Optional[str], macros: Dict[str, float], db: Optional[AsyncSession]) -> None:
    if db is None:
        from db_sync import save_to_local_cache
        save_to_local_cache(name, brand, macros)
        return
    from database import IngredientCache
    if brand:
        exists_res = await db.execute(
            select(IngredientCache).where(
                IngredientCache.name == name, IngredientCache.brand == brand
            )
        )
    else:
        exists_res = await db.execute(
            select(IngredientCache).where(
                IngredientCache.name == name, IngredientCache.brand == None  # noqa: E711
            )
        )
    if exists_res.scalar_one_or_none():
        return
    db.add(IngredientCache(
        name=name, brand=brand,
        calories_per_100g=macros["calories_per_100g"],
        protein_per_100g=macros["protein_per_100g"],
        carbs_per_100g=macros["carbs_per_100g"],
        fat_per_100g=macros["fat_per_100g"],
    ))
    await db.commit()


# ── Shared helpers ────────────────────────────────────────────────────────────

def _cache_row_to_macros(row) -> Dict[str, float]:
    return {
        "calories_per_100g": row.calories_per_100g,
        "protein_per_100g":  row.protein_per_100g,
        "carbs_per_100g":    row.carbs_per_100g,
        "fat_per_100g":      row.fat_per_100g,
    }


def _build_ingredient(name: str, brand: Optional[str], weight_g: float, macros: Dict[str, float]) -> dict:
    return {
        "name":               name,
        "brand":              brand,
        "weight_g":           weight_g,
        "calories_per_100g":  macros["calories_per_100g"],
        "protein_per_100g":   macros["protein_per_100g"],
        "carbs_per_100g":     macros["carbs_per_100g"],
        "fat_per_100g":       macros["fat_per_100g"],
    }


async def _fetch_from_llm(name: str, brand: Optional[str]) -> Dict[str, float]:
    search_snippets = _run_tavily_search(name, brand)
    prompt = (
        f"Determine the nutritional facts per 100g for: '{brand or ''} {name}'.\n"
        + (f"Web search findings:\n{search_snippets}\n" if search_snippets else "")
        + "Return accurate per-100g macros. If brand-specific data is unavailable, "
          "use standard generic values for the food item."
    )
    from llm_provider import get_llm
    llm = get_llm()
    structured_parser = llm.with_structured_output(MacroParsingResponse)
    try:
        parsed: MacroParsingResponse = structured_parser.invoke(prompt)
        return {
            "calories_per_100g": float(parsed.calories_per_100g),
            "protein_per_100g":  float(parsed.protein_per_100g),
            "carbs_per_100g":    float(parsed.carbs_per_100g),
            "fat_per_100g":      float(parsed.fat_per_100g),
        }
    except Exception as exc:
        print(f"[IngredientResolver] LLM resolution failed for '{name}': {exc}")
        return dict(_FALLBACK_MACROS)


def _run_tavily_search(name: str, brand: Optional[str]) -> str:
    if not os.environ.get("TAVILY_API_KEY"):
        return ""
    try:
        from langchain_community.tools.tavily_search import TavilySearchResults
        tool = TavilySearchResults(max_results=3)
        query = f"nutritional values per 100g {brand or ''} {name} calories protein carbs fat"
        results = tool.invoke({"query": query})
        return "\n".join(r.get("content", "") for r in results)
    except Exception as exc:
        print(f"[IngredientResolver] Tavily search failed: {exc}")
        return ""
