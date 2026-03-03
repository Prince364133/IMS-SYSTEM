import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    
    applicant_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, default="")
    resume_url = Column(String, default="")
    cover_letter = Column(Text, default="")
    
    status = Column(String, default="applied") # applied, reviewing, interviewing, offered, rejected, hired
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
