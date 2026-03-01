from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class ClientBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    company: Optional[str] = ""
    address: Optional[str] = ""
    website: Optional[str] = ""
    notes: Optional[str] = ""

class ClientCreate(ClientBase):
    project_ids: Optional[List[str]] = []

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None
    project_ids: Optional[List[str]] = None

class ClientOut(ClientBase):
    id: str
    project_ids: List[str] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
