import uuid
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    title = Column(String, nullable=False)
    department = Column(String, default="")
    location = Column(String, default="On-site")
    employee_type = Column(String, default="Full-time")
    description = Column(Text, default="")
    requirements = Column(Text, default="")
    status = Column(String, default="open") # open, closed, draft
    deadline = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
