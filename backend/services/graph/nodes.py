"""LangGraph node functions for the meal-resolution pipeline: extraction →
resolution → calculation. Wired together in services/graph/pipeline.py."""
import os
from typing import Any, Dict, List, Optional

from schemas.graph import IngredientExtraction, MacroParsingResponse, MealExtractionResponse
from services.db_sync import (
    query_local_cache as _db_query_cache,
    save_to_local_cache as _db_save_cache,
    get_preferred_brand as _db_get_preferred_brand,
)
from services.llm_provider import get_llm, get_resolution_llm
from services.macros import totals_from_ingredients
from services.graph.state import GraphState

try:
    from langchain_tavily import TavilySearch
    _TAVILY_AVAILABLE = True
except ImportError:
    _TAVILY_AVAILABLE = False


# DB helpers for sync lookups inside graph nodes — backed by Supabase/Postgres via db_sync.
def query_local_cache(name: str, brand: Optional[str]) -> Optional[Dict[str, float]]:
    name_lower = name.strip().lower()
    brand_lower = brand.strip().lower() if brand else None

    cached = _db_query_cache(name_lower, brand_lower)
    if cached:
        return cached

    # Fallback to name match only if brand was not specified or if brand match failed
    if brand_lower:
        return _db_query_cache(name_lower, None)
    return None


def save_to_local_cache(name: str, brand: Optional[str], macros: Dict[str, float]):
    name_lower = name.strip().lower()
    brand_val = brand.strip().lower() if brand else None
    _db_save_cache(name_lower, brand_val, macros)
    print(f"Cached brand new resolved food: {brand_val or ''} {name_lower}")


def get_preferred_brand(ingredient_name: str) -> Optional[str]:
    return _db_get_preferred_brand(ingredient_name.strip().lower())


# ----------------- GRAPH NODES -----------------

def _regex_extract_ingredients(raw_text: str) -> List[IngredientExtraction]:
    """
    Rule-based fallback parser. Handles patterns like:
      '100 grams of X', '38g of Y', '250 ml of Z', '1 scoop of W', '2 medium sized banana'
    Returns a best-effort list; unrecognised items get an estimated weight of 100g.
    """
    import re

    # Unit → grams conversion
    UNIT_G: Dict[str, float] = {
        "g": 1, "gram": 1, "grams": 1,
        "kg": 1000, "kilogram": 1000, "kilograms": 1000,
        "ml": 1, "milliliter": 1, "milliliters": 1, "millilitre": 1, "millilitres": 1,
        "l": 1000, "liter": 1000, "liters": 1000, "litre": 1000, "litres": 1000,
        "oz": 28.35, "ounce": 28.35, "ounces": 28.35,
        "lb": 453.6, "pound": 453.6, "pounds": 453.6,
        "cup": 240, "cups": 240,
        "tbsp": 15, "tablespoon": 15, "tablespoons": 15,
        "tsp": 5, "teaspoon": 5, "teaspoons": 5,
        # portion estimates
        "scoop": 30, "scoops": 30,
        "piece": 100, "pieces": 100,
        "slice": 30, "slices": 30,
        "serving": 100, "servings": 100,
    }
    # Size words → weight multiplier on 100g baseline
    SIZE_G: Dict[str, float] = {
        "small": 80, "medium": 120, "large": 180,
        "big": 180, "tiny": 50,
    }
    WORD_NUM: Dict[str, float] = {
        "a": 1, "an": 1, "one": 1, "two": 2, "three": 3, "four": 4,
        "five": 5, "six": 6, "half": 0.5,
    }
    FILLER = r"(?:of\s+)?"

    results: List[IngredientExtraction] = []

    # Split on commas / "and" separators
    parts = re.split(r",\s*|\band\b", raw_text, flags=re.IGNORECASE)

    for part in parts:
        part = part.strip(" .")
        if not part:
            continue

        weight_g: float = 100.0
        name = part

        # Pattern 1: "<qty> <unit> of <name>"  e.g. "100 grams of oats"
        m = re.match(
            r"^(\d+(?:\.\d+)?)\s*(" + "|".join(re.escape(u) for u in UNIT_G) + r")\s+" + FILLER + r"(.+)$",
            part, re.IGNORECASE,
        )
        if m:
            qty, unit, name = float(m.group(1)), m.group(2).lower(), m.group(3).strip()
            weight_g = qty * UNIT_G[unit]
        else:
            # Pattern 2: "<word_num> <size> sized? <name>"  e.g. "1 medium sized banana"
            m2 = re.match(
                r"^(\d+(?:\.\d+)?|" + "|".join(WORD_NUM) + r")\s+(" + "|".join(SIZE_G) + r")\s+(?:sized?\s+)?(.+)$",
                part, re.IGNORECASE,
            )
            if m2:
                raw_qty = m2.group(1).lower()
                qty = float(raw_qty) if re.match(r"[\d.]+", raw_qty) else WORD_NUM.get(raw_qty, 1)
                size = m2.group(2).lower()
                name = m2.group(3).strip()
                weight_g = qty * SIZE_G[size]
            else:
                # Pattern 3: plain "<qty> <name>"  e.g. "2 eggs"
                m3 = re.match(
                    r"^(\d+(?:\.\d+)?|" + "|".join(WORD_NUM) + r")\s+(.+)$",
                    part, re.IGNORECASE,
                )
                if m3:
                    raw_qty = m3.group(1).lower()
                    qty = float(raw_qty) if re.match(r"[\d.]+", raw_qty) else WORD_NUM.get(raw_qty, 1)
                    name = m3.group(2).strip()
                    weight_g = qty * 100.0  # rough estimate

        # Strip trailing noise like "sized" that may linger in the name
        name = re.sub(r"\s*sized?\s*$", "", name, flags=re.IGNORECASE).strip()

        results.append(IngredientExtraction(name=name, weight_g=weight_g))

    return results


def extraction_node(state: GraphState) -> Dict[str, Any]:
    """
    Node 1: Extract ingredients and weights from raw_text using Claude.
    Falls back to a regex parser if the LLM call fails (e.g. no credits).
    """
    raw_text = state.get("raw_text", "")
    print(f"[Extraction Node] Parsing raw text: '{raw_text}'")

    try:
        llm = get_llm(temperature=0)
    except EnvironmentError as env_err:
        print(f"[Extraction Node] ERROR {env_err}")
        print("[Extraction Node] No LLM available — using regex fallback parser.")
        return {"extracted_ingredients": _regex_extract_ingredients(raw_text)}

    structured_llm = llm.with_structured_output(MealExtractionResponse)

    try:
        response = structured_llm.invoke(
            f"You are a nutritionist STT transcription helper. Parse this raw audio speech transcription: '{raw_text}'. "
            f"Extract all ingredients and their weights. Explicitly estimate weight in grams if unspecified (e.g. 'an apple' is ~150g, 'two eggs' is ~100g, 'a scoop of whey' is ~30g)."
        )
        print(f"[Extraction Node] Extracted: {response.ingredients}")
        return {"extracted_ingredients": response.ingredients}
    except Exception as e:
        print(f"Error in extraction node: {e}")
        print("[Extraction Node] LLM unavailable — using regex fallback parser.")
        fallback = _regex_extract_ingredients(raw_text)
        print(f"[Extraction Node] Regex fallback extracted: {fallback}")
        return {"extracted_ingredients": fallback}


def _is_credit_error(exc: Exception) -> bool:
    return "credit balance" in str(exc).lower() or "402" in str(exc) or "payment" in str(exc).lower()


def _resolve_single(
    item,
    structured_parser,
    tavily_search,
    llm_available: bool,
    api_key: str = "",
) -> Dict[str, Any]:
    """Resolve one ingredient — runs in a thread pool for parallelism."""
    # Re-set the API key inside this thread (contextvars don't cross thread boundaries reliably)
    from services.llm_provider import set_request_key
    set_request_key(api_key)
    name = item.name
    brand = item.brand or ""
    weight = item.weight_g
    resolution_source = "unknown"

    # Inject preferred brand
    if not brand:
        preferred = get_preferred_brand(name)
        if preferred:
            brand = preferred
            print(f"[Resolution Node] Preferred brand '{brand}' → '{name}'")

    label = f"'{brand} {name}'" if brand else f"'{name}'"
    print(f"[Resolution Node] Resolving {label} @ {weight}g")

    # ── Step 1: Supabase cache ──────────────────────────────────────────────
    cached_macros = query_local_cache(name, brand or None)
    if cached_macros:
        print(f"[Resolution Node] ✓ CACHE HIT {label}")
        return {"name": name, "brand": brand, "weight_g": weight,
                "resolution_source": "cache", **cached_macros}

    print(f"[Resolution Node] ✗ CACHE MISS {label} — trying web+LLM")

    # ── Step 2: Tavily web search ─────────────────────────────────────────
    search_snippets = ""
    if tavily_search:
        try:
            query = f"nutritional values per 100g {brand} {name} calories protein carbs fat"
            results = tavily_search.invoke(query)
            # results is a list of dicts with at least a "content" key
            search_snippets = "\n".join(
                r.get("content", "") if isinstance(r, dict) else str(r)
                for r in results
            )
            print(f"[Resolution Node] Tavily returned {len(results)} snippets for {label}")
        except Exception as se:
            print(f"[Resolution Node] WARNING Tavily search failed for {label}: {se}")

    # ── Step 3: LLM parse ─────────────────────────────────────────────────
    macros_dict = None
    if llm_available and structured_parser:
        prompt = (
            f"Determine nutritional facts per 100g (calories kcal, protein g, carbs g, fat g) "
            f"for: {label}.\n"
        )
        if search_snippets:
            prompt += f"Web search context:\n{search_snippets}\n"
        prompt += "Use brand-specific data if available, otherwise use standard generic values."
        try:
            parsed = structured_parser.invoke(prompt)
            macros_dict = {
                "calories_per_100g": float(parsed.calories_per_100g),
                "protein_per_100g":  float(parsed.protein_per_100g),
                "carbs_per_100g":    float(parsed.carbs_per_100g),
                "fat_per_100g":      float(parsed.fat_per_100g),
            }
            save_to_local_cache(name, brand or None, macros_dict)
            resolution_source = "tavily+llm" if search_snippets else "llm"
            print(f"[Resolution Node] ✓ LLM resolved {label}: {macros_dict}")
        except Exception as e:
            print(f"[Resolution Node] ERROR LLM parse failed for {label}: {e}")

    # ── Step 4: Generic fallback ──────────────────────────────────────────
    if macros_dict is None:
        resolution_source = "generic_fallback"
        macros_dict = {"calories_per_100g": 100.0, "protein_per_100g": 5.0,
                       "carbs_per_100g": 10.0, "fat_per_100g": 2.0}
        print(f"[Resolution Node] ⚠ FALLBACK for {label} — macros will be inaccurate.")

    return {"name": name, "brand": brand, "weight_g": weight,
            "resolution_source": resolution_source, **macros_dict}


def resolution_node(state: GraphState) -> Dict[str, Any]:
    """
    Node 2: Resolve each ingredient to per-100g macros in parallel.
    Priority per ingredient: brand_preferences → Supabase cache → Tavily+LLM → generic fallback.
    """
    import concurrent.futures

    extracted_ingredients = state.get("extracted_ingredients", [])

    try:
        llm = get_resolution_llm(temperature=0)
        structured_parser = llm.with_structured_output(MacroParsingResponse)
        llm_available = True
    except EnvironmentError as env_err:
        print(f"[Resolution Node] ERROR {env_err}")
        structured_parser = None
        llm_available = False

    tavily_search = None
    if _TAVILY_AVAILABLE and os.environ.get("TAVILY_API_KEY"):
        try:
            tavily_search = TavilySearch(max_results=3)
        except Exception as te:
            print(f"[Resolution Node] WARNING Tavily init failed: {te}")

    # Read the API key from the contextvar now (main thread) and pass it explicitly
    # to each worker — threads have their own contextvar scope.
    from services.llm_provider import _api_key_ctx
    api_key = _api_key_ctx.get()

    # Resolve all ingredients concurrently (I/O-bound: network calls to Tavily + LLM)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        # Map future → original index so results can be re-sorted into input order
        future_to_idx = {
            pool.submit(_resolve_single, item, structured_parser, tavily_search, llm_available, api_key): idx
            for idx, item in enumerate(extracted_ingredients)
        }
        results_unsorted = []
        for future in concurrent.futures.as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                results_unsorted.append((idx, future.result()))
            except Exception as e:
                print(f"[Resolution Node] ERROR unexpected failure for ingredient #{idx}: {e}")

    resolved_list = [r for _, r in sorted(results_unsorted, key=lambda x: x[0])]

    print(
        f"[Resolution Node] Summary: {len(resolved_list)} ingredients — "
        + ", ".join(f"{r['name']}({r['resolution_source']})" for r in resolved_list)
    )
    return {"resolved_ingredients": resolved_list}


def calculation_node(state: GraphState) -> Dict[str, Any]:
    """Node 3: Multiply per-100g values against weight_g and sum up."""
    resolved_ingredients = state.get("resolved_ingredients", [])
    totals = totals_from_ingredients(resolved_ingredients)
    print(f"[Calculation Node] Aggregated totals: {totals}")
    return {"total_meal_macros": totals}
