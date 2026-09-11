"""StateGraph wiring for the meal-resolution pipeline: extraction → resolution
→ calculation. Import `compiled_graph` and `.invoke({"raw_text": ...})` it."""
from langgraph.graph import StateGraph, END

from services.graph.state import GraphState
from services.graph.nodes import extraction_node, resolution_node, calculation_node

workflow = StateGraph(GraphState)
workflow.add_node("extractor", extraction_node)
workflow.add_node("resolver", resolution_node)
workflow.add_node("calculator", calculation_node)

workflow.set_entry_point("extractor")
workflow.add_edge("extractor", "resolver")
workflow.add_edge("resolver", "calculator")
workflow.add_edge("calculator", END)

compiled_graph = workflow.compile()
