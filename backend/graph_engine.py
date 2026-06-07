import os
import sqlite3
from typing import TypedDict, List, Dict, Any, Optional
from langchain_anthropic import ChatAnthropic
from langchain_community.tools.tavily_search import TavilySearchResults
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END

from schemas import MealExtractionResponse, IngredientExtraction

# Define the state shape
class GraphState(TypedDict):
    raw_text: str
    extracted_ingredients: List[IngredientExtraction]
    resolved_ingredients: List[Dict[str, Any]]
    total_meal_macros: Dict[str, float]

# Simple Pydantic schema for LLM sub-call in resolution
class MacroParsingResponse(BaseModel):
    calories_per_100g: float = Field(..., description="Calories per 100g of food")
    protein_per_100g: float = Field(..., description="Protein in grams per 100g of food")
    carbs_per_100g: float = Field(..., description="Carbohydrates in grams per 100g of food")
    fat_per_100g: float = Field(..., description="Fat in grams per 100g of food")

# DB helper for sync lookups inside graph nodes
def query_local_cache(name: str, brand: Optional[str]) -> Optional[Dict[str, float]]:
    """
    Synchronously query the SQLite database for cached ingredients.
    """
    conn = None
    try:
        conn = sqlite3.connect("meal_tracker.db")
        cursor = conn.cursor()
        
        name_lower = name.strip().lower()
        
        if brand:
            brand_lower = brand.strip().lower()
            cursor.execute(
                "SELECT calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g FROM ingredient_cache WHERE lower(name) = ? AND lower(brand) = ? LIMIT 1",
                (name_lower, brand_lower)
            )
        else:
            cursor.execute(
                "SELECT calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g FROM ingredient_cache WHERE lower(name) = ? AND brand IS NULL LIMIT 1",
                (name_lower,)
            )
            
        row = cursor.fetchone()
        if row:
            return {
                "calories_per_100g": row[0],
                "protein_per_100g": row[1],
                "carbs_per_100g": row[2],
                "fat_per_100g": row[3]
            }
            
        # Fallback to name match only if brand was not specified or if brand match failed
        cursor.execute(
            "SELECT calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g FROM ingredient_cache WHERE lower(name) = ? LIMIT 1",
            (name_lower,)
        )
        row = cursor.fetchone()
        if row:
            return {
                "calories_per_100g": row[0],
                "protein_per_100g": row[1],
                "carbs_per_100g": row[2],
                "fat_per_100g": row[3]
            }
            
    except Exception as e:
        print(f"Error querying local SQLite cache: {e}")
    finally:
        if conn:
            conn.close()
    return None

def save_to_local_cache(name: str, brand: Optional[str], macros: Dict[str, float]):
    """
    Save resolved ingredient to SQLite cache.
    """
    conn = None
    try:
        conn = sqlite3.connect("meal_tracker.db")
        cursor = conn.cursor()
        
        name_lower = name.strip().lower()
        brand_val = brand.strip().lower() if brand else None
        
        # Check if already exists to prevent duplicate insertion
        if brand_val:
            cursor.execute("SELECT id FROM ingredient_cache WHERE lower(name) = ? AND lower(brand) = ?", (name_lower, brand_val))
        else:
            cursor.execute("SELECT id FROM ingredient_cache WHERE lower(name) = ? AND brand IS NULL", (name_lower,))
            
        if cursor.fetchone():
            return
            
        cursor.execute(
            "INSERT INTO ingredient_cache (name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES (?, ?, ?, ?, ?, ?)",
            (name_lower, brand_val, macros["calories_per_100g"], macros["protein_per_100g"], macros["carbs_per_100g"], macros["fat_per_100g"])
        )
        conn.commit()
        print(f"Cached brand new resolved food: {brand_val or ''} {name_lower}")
    except Exception as e:
        print(f"Error saving to local SQLite cache: {e}")
    finally:
        if conn:
            conn.close()

def get_preferred_brand(ingredient_name: str) -> Optional[str]:
    """
    Synchronously look up the user's preferred brand for an ingredient.
    Returns the brand string if set, or None.
    """
    conn = None
    try:
        conn = sqlite3.connect("meal_tracker.db")
        cursor = conn.cursor()
        cursor.execute(
            "SELECT preferred_brand FROM brand_preferences WHERE ingredient_name = ? LIMIT 1",
            (ingredient_name.strip().lower(),)
        )
        row = cursor.fetchone()
        return row[0] if row else None
    except Exception as e:
        print(f"Error looking up brand preference: {e}")
        return None
    finally:
        if conn:
            conn.close()

# ----------------- GRAPH NODES -----------------

def extraction_node(state: GraphState) -> Dict[str, Any]:
    """
    Node 1: Extract ingredients and weights from raw_text using GPT-4o-mini.
    """
    raw_text = state.get("raw_text", "")
    print(f"[Extraction Node] Parsing raw text: '{raw_text}'")
    
    # Initialize the LLM with structured output
    llm = ChatAnthropic(model="claude-sonnet-4-6", temperature=0)
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
        # Return fallback empty or simple parsing in case of API failure
        return {"extracted_ingredients": []}

def resolution_node(state: GraphState) -> Dict[str, Any]:
    """
    Node 2: Iterate through extracted ingredients, checking cache, querying web fallback, and caching.
    """
    extracted_ingredients = state.get("extracted_ingredients", [])
    resolved_list = []
    
    llm = ChatAnthropic(model="claude-sonnet-4-6", temperature=0)
    structured_parser = llm.with_structured_output(MacroParsingResponse)
    
    # Try initializing Tavily search tool
    tavily_search = None
    if os.environ.get("TAVILY_API_KEY"):
        try:
            tavily_search = TavilySearchResults(max_results=3)
        except Exception as te:
            print(f"Tavily tool initialization failed: {te}")
            
    for item in extracted_ingredients:
        name = item.name
        brand = item.brand
        weight = item.weight_g
        
        # Inject preferred brand if user didn't specify one
        if not brand:
            preferred = get_preferred_brand(name)
            if preferred:
                brand = preferred
                print(f"[Resolution Node] Using preferred brand '{brand}' for '{name}'")

        print(f"[Resolution Node] Resolving ingredient: {brand or ''} {name} ({weight}g)")

        # 1. Look up in SQLite cache
        cached_macros = query_local_cache(name, brand)
        
        if cached_macros:
            print(f"[Resolution Node] Cache HIT: {brand or ''} {name}")
            resolved_list.append({
                "name": name,
                "brand": brand,
                "weight_g": weight,
                "calories_per_100g": cached_macros["calories_per_100g"],
                "protein_per_100g": cached_macros["protein_per_100g"],
                "carbs_per_100g": cached_macros["carbs_per_100g"],
                "fat_per_100g": cached_macros["fat_per_100g"]
            })
            continue
            
        # 2. Cache MISS: Query web or use LLM knowledge fallback
        print(f"[Resolution Node] Cache MISS: Web search fallback for {brand or ''} {name}")
        search_query = f"nutritional values per 100g for {brand or ''} {name} calories protein carbs fat"
        
        search_snippets = ""
        if tavily_search:
            try:
                results = tavily_search.invoke({"query": search_query})
                # Join search snippets
                search_snippets = "\n".join([r.get("content", "") for r in results])
                print(f"[Resolution Node] Tavily search retrieved {len(results)} snippets.")
            except Exception as se:
                print(f"Tavily search execution failed: {se}. Falling back to internal LLM knowledge.")
                
        # 3. Use LLM sub-call to parse the search snippets or fall back on its own knowledge base
        prompt = (
            f"Determine the nutritional facts per 100g (calories in kcal, protein in g, carbs in g, fat in g) for "
            f"the food item: '{brand or ''} {name}'.\n"
        )
        if search_snippets:
            prompt += f"Here are web search findings to help you:\n{search_snippets}\n"
            
        prompt += (
            "Provide accurate per-100g macro fields. If you cannot find brand specific facts, estimate based on "
            "standard generic values of the food item."
        )
        
        try:
            parsed_macros = structured_parser.invoke(prompt)
            macros_dict = {
                "calories_per_100g": float(parsed_macros.calories_per_100g),
                "protein_per_100g": float(parsed_macros.protein_per_100g),
                "carbs_per_100g": float(parsed_macros.carbs_per_100g),
                "fat_per_100g": float(parsed_macros.fat_per_100g)
            }
            
            # 4. Save to Cache
            save_to_local_cache(name, brand, macros_dict)
            
            resolved_list.append({
                "name": name,
                "brand": brand,
                "weight_g": weight,
                "calories_per_100g": macros_dict["calories_per_100g"],
                "protein_per_100g": macros_dict["protein_per_100g"],
                "carbs_per_100g": macros_dict["carbs_per_100g"],
                "fat_per_100g": macros_dict["fat_per_100g"]
            })
        except Exception as e:
            print(f"Error parsing macros with LLM for {name}: {e}")
            # Safe generic fallback to prevent failure
            fallback_macros = {"calories_per_100g": 100.0, "protein_per_100g": 5.0, "carbs_per_100g": 10.0, "fat_per_100g": 2.0}
            resolved_list.append({
                "name": name,
                "brand": brand,
                "weight_g": weight,
                **fallback_macros
            })
            
    return {"resolved_ingredients": resolved_list}

def calculation_node(state: GraphState) -> Dict[str, Any]:
    """
    Node 3: Multiply per-100g values against weight_g and sum up.
    """
    resolved_ingredients = state.get("resolved_ingredients", [])
    
    total_calories = 0.0
    total_protein = 0.0
    total_carbs = 0.0
    total_fat = 0.0
    
    for item in resolved_ingredients:
        weight_factor = item["weight_g"] / 100.0
        total_calories += item["calories_per_100g"] * weight_factor
        total_protein += item["protein_per_100g"] * weight_factor
        total_carbs += item["carbs_per_100g"] * weight_factor
        total_fat += item["fat_per_100g"] * weight_factor
        
    totals = {
        "calories": round(total_calories, 1),
        "protein": round(total_protein, 1),
        "carbs": round(total_carbs, 1),
        "fat": round(total_fat, 1)
    }
    
    print(f"[Calculation Node] Aggregated totals: {totals}")
    return {"total_meal_macros": totals}

# ----------------- GRAPH COMPILATION -----------------

workflow = StateGraph(GraphState)
workflow.add_node("extractor", extraction_node)
workflow.add_node("resolver", resolution_node)
workflow.add_node("calculator", calculation_node)

workflow.set_entry_point("extractor")
workflow.add_edge("extractor", "resolver")
workflow.add_edge("resolver", "calculator")
workflow.add_edge("calculator", END)

compiled_graph = workflow.compile()
