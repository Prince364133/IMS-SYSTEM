import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(String, default="not_started") # not_started, in_progress, on_hold, completed, cancelled
    priority = Column(String, default="medium") # low, medium, high, critical
    deadline = Column(DateTime(timezone=True), nullable=True)
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    client_id = Column(String, ForeignKey("clients.id"), nullable=True)
    progress = Column(Float, default=0.0)
    
    # In Postgres we could use ARRAY(String), but for SQLite compat we can store as comma-sep string.
    # However, since we're using PostgreSQL in prod, we could use a tags table or simple string.
    # We'll use a simple string representation for simplicity, OR parse it in schemas.
    tags = Column(String, default="") 

    # We store member_ids as a comma-separated string to match simple Mongo arrays, 
    # OR we use a secondary association table. For a fast migration matching the existing structure,
    # comma-separated string is easiest, or a proper association table if cleaner.
    # Let's use a comma-separated string for `member_ids` to avoid complex joins.
    member_ids = Column(String, default="")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
