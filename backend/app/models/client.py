import uuid
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Client(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, default="")
    company = Column(String, default="")
    address = Column(String, default="")
    website = Column(String, default="")
    notes = Column(Text, default="")
    
    # We can store an array of project_ids as string for simplicity
    project_ids = Column(String, default="")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
