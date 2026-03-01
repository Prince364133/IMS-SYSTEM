import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(String, default="todo") # todo, in_progress, review, done
    priority = Column(String, default="medium") # low, medium, high, critical
    due_date = Column(DateTime(timezone=True), nullable=True)
    
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    assignee_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    
    # Similar to Project, we might have attachments or tags, stored as strings
    attachment_urls = Column(String, default="")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
