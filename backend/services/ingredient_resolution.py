"""Single-ingredient macro lookup used by the Brand Preferences UI
(routers/ingredients.py). Runs synchronously in a thread pool since it mixes
blocking network calls (Tavily, LLM) — see the router for the executor call."""
from services.db_sync import query_local_cache, save_to_local_cache


def resolve_ingredient_sync(name: str, brand: str, api_key: str) -> dict:
    """Cache → Tavily → LLM → generic fallback, in that order."""
    # Re-set the API key in this thread — contextvars don't cross thread
    # boundaries reliably (same reasoning as services/graph/nodes.py's _resolve_single).
    from services.llm_provider import set_request_key
    set_request_key(api_key)

    name_l = name.strip().lower()
    brand_l = brand.strip().lower() if brand else None
    label = f"{brand_l or ''} {name_l}".strip()

    # 0. Master table (ingredient_cache) — brand-specific hit, then name-only fallback
    cached = query_local_cache(name_l, brand_l)
    if not cached and brand_l:
        cached = query_local_cache(name_l, None)
    if cached:
        print(f"[resolve-ingredient] CACHE HIT '{label}'")
        return {**cached, "source": "cache"}

    print(f"[resolve-ingredient] CACHE MISS '{label}' — trying web+LLM")

    # 1. Tavily web search
    search_snippets = ""
    try:
        from langchain_tavily import TavilySearch
        ts = TavilySearch(max_results=3)
        query = f"nutritional values per 100g {label} calories protein carbs fat"
        results = ts.invoke(query)
        search_snippets = "\n".join(
            r.get("content", "") if isinstance(r, dict) else str(r)
            for r in results
        )
        print(f"[resolve-ingredient] Tavily returned {len(results)} snippets for '{label}'")
    except Exception as te:
        print(f"[resolve-ingredient] Tavily failed for '{label}': {te}")

    # 2. LLM structured parse
    if api_key:
        try:
            from pydantic import BaseModel as PBM, Field as PField

            class MacroOut(PBM):
                calories_per_100g: float = PField(..., description="Calories per 100g")
                protein_per_100g:  float = PField(..., description="Protein g per 100g")
                carbs_per_100g:    float = PField(..., description="Carbs g per 100g")
                fat_per_100g:      float = PField(..., description="Fat g per 100g")

            from services.llm_provider import get_resolution_llm
            llm = get_resolution_llm(temperature=0)
            parser = llm.with_structured_output(MacroOut)
            prompt = (
                f"Determine nutritional facts per 100g (calories kcal, protein g, carbs g, fat g) "
                f"for: '{label}'.\n"
            )
            if search_snippets:
                prompt += f"Web search context:\n{search_snippets}\n"
            prompt += "Use brand-specific data if available, otherwise use standard generic values."
            parsed = parser.invoke(prompt)
            macros_dict = {
                "calories_per_100g": float(parsed.calories_per_100g),
                "protein_per_100g":  float(parsed.protein_per_100g),
                "carbs_per_100g":    float(parsed.carbs_per_100g),
                "fat_per_100g":      float(parsed.fat_per_100g),
            }
            # Persist to the master table so future lookups of this name+brand skip Tavily
            save_to_local_cache(name_l, brand_l, macros_dict)
            return {
                **macros_dict,
                "source": "tavily+llm" if search_snippets else "llm",
            }
        except Exception as le:
            print(f"[resolve-ingredient] LLM parse failed for '{label}': {le}")

    # 3. Generic fallback (not cached — inaccurate, shouldn't poison the master table)
    print(f"[resolve-ingredient] Using generic fallback for '{label}'")
    return {
        "calories_per_100g": 100.0,
        "protein_per_100g":  5.0,
        "carbs_per_100g":    10.0,
        "fat_per_100g":      2.0,
        "source": "generic_fallback",
    }
