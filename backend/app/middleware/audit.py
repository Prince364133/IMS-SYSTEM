from sqlalchemy.ext.asyncio import AsyncSession
from ..models.audit_log import AuditLog
import logging
from typing import Any

# Configure audit logger
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# Create file handler
fh = logging.FileHandler("audit.log")
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
audit_logger.addHandler(fh)

async def log_action(
    user: Any, 
    action: str, 
    resource_type: str, 
    resource_id: str, 
    detail: str = "", 
    db: AsyncSession = None
):
    user_id = getattr(user, "id", "system")
    user_email = getattr(user, "email", "system")
    msg = f"USER[{user_id}/{user_email}] - ACTION[{action}] - RESOURCE[{resource_type}/{resource_id}] - DETAIL[{detail}]"
    audit_logger.info(msg)
    
    # Save to database if session provided
    if db:
        try:
            new_log = AuditLog(
                user_id=user_id,
                user_email=user_email,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                detail=detail
            )
            db.add(new_log)
            await db.commit()
        except Exception as e:
            audit_logger.error(f"Failed to save audit log to DB: {e}")
            
    print(f"AUDIT: {msg}") # Also print for convenience in dev
