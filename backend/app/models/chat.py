import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Chat(Base):
    __tablename__ = "chats"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    is_group = Column(Boolean, default=False)
    name = Column(String, default="")
    
    # Comma-separated list of User IDs for simple MongoDB-like array storage
    member_ids = Column(Text, default="")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    chat_id = Column(String, ForeignKey("chats.id"), nullable=False, index=True)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    content = Column(Text, default="")
    # For file payloads like images or docs
    attachment_url = Column(String, default="")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
