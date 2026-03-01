from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatBase(BaseModel):
    is_group: bool = False
    name: Optional[str] = ""

class ChatCreate(ChatBase):
    member_ids: List[str]

class ChatOut(ChatBase):
    id: str
    member_ids: List[str]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    content: str
    attachment_url: Optional[str] = ""

class MessageCreate(MessageBase):
    chat_id: str
    sender_id: str

class MessageOut(MessageBase):
    id: str
    chat_id: str
    sender_id: str
    created_at: datetime

    class Config:
        from_attributes = True
