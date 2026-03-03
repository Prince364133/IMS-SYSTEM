import uuid
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, index=True)
    user_email = Column(String, index=True)
    
    action = Column(String, index=True) # e.g., LOGIN_SUCCESS, DELETE, UPDATE
    resource_type = Column(String, index=True) # e.g., user, project, job
    resource_id = Column(String)
    detail = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
