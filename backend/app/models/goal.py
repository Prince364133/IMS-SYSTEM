import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func
from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Goal(Base):
    __tablename__ = "goals"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(String, default="pending") # pending, in_progress, achieved, missed
    target_date = Column(DateTime(timezone=True), nullable=True)
    progress = Column(Float, default=0.0)
    
    employee_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
