from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ChatBase(BaseModel):
    is_group: bool = Field(False, description="Whether this is a group chat")
    name: Optional[str] = Field("", description="Group name (empty for direct messages)", example="Engineering Hub")

class ChatCreate(ChatBase):
    member_ids: List[str] = Field(..., description="List of member user IDs")

class ChatOut(ChatBase):
    id: str
    member_ids: List[str]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    content: str = Field(..., description="Message body content", example="Hello team!")
    attachment_url: Optional[str] = Field("", description="Optional file attachment URL")

class MessageCreate(MessageBase):
    chat_id: str
    sender_id: str

class MessageOut(MessageBase):
    id: str
    chat_id: str
    sender_id: str = Field(..., description="The ID of the user who sent the message")
    created_at: datetime

    class Config:
        from_attributes = True
