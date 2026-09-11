from fastapi import APIRouter

from core.config import SUPPORTED_PROVIDERS

router = APIRouter(prefix="/api", tags=["keys"])


@router.get("/keys")
async def list_api_keys():
    "Returns supported providers. Keys are stored in browser localStorage only."
    return [
        {"provider": p, "label": m["label"], "description": m["description"]}
        for p, m in SUPPORTED_PROVIDERS.items()
    ]


@router.get("/health")
def health_check():
    import datetime
    return {"status": "healthy", "time": datetime.datetime.now().isoformat()}
