from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JobBase(BaseModel):
    title: str
    department: Optional[str] = ""
    location: Optional[str] = "On-site"
    employee_type: Optional[str] = "Full-time"
    description: Optional[str] = ""
    requirements: Optional[str] = ""
    status: Optional[str] = "open"
    deadline: Optional[datetime] = None

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employee_type: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None

class JobOut(JobBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
