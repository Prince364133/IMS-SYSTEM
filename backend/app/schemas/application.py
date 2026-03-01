from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ApplicationBase(BaseModel):
    applicant_name: str
    email: EmailStr
    phone: Optional[str] = ""
    resume_url: Optional[str] = ""
    cover_letter: Optional[str] = ""
    status: Optional[str] = "applied"

class ApplicationCreate(ApplicationBase):
    job_id: str

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None

class ApplicationOut(ApplicationBase):
    id: str
    job_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
