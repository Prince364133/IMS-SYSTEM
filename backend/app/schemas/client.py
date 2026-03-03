from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class ClientBase(BaseModel):
    name: str = Field(..., description="Client or company name", example="Acme Corp")
    email: EmailStr = Field(..., description="Client contact email", example="contact@acmecorp.com")
    phone: Optional[str] = Field("", description="Contact phone number", example="+1987654321")
    company: Optional[str] = Field("", description="Company name (if different from name)", example="Acme Industries")
    address: Optional[str] = Field("", description="Physical office address", example="123 Tech Lane, Silicon Valley")
    website: Optional[str] = Field("", description="Company website URL", example="https://acmecorp.com")
    notes: Optional[str] = Field("", description="Internal notes about the client")

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
