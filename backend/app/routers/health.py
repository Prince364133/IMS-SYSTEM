from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
import redis
import os
import time

router = APIRouter(prefix="/health", tags=["system"])

@router.get("")
async def health_check(db: Session = Depends(get_db)):
    """
    Comprehensive health check for the system.
    """
    health = {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "database": "online",
            "redis": "online",
        }
    }
    
    # 1. Check Database
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        health["status"] = "unhealthy"
        health["services"]["database"] = f"offline: {str(e)}"

    # 2. Check Redis
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        r = redis.from_url(redis_url)
        r.ping()
    except Exception as e:
        health["status"] = "unhealthy"
        health["services"]["redis"] = f"offline: {str(e)}"

    return health
