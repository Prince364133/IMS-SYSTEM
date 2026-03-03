from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class JobBase(BaseModel):
    title: str = Field(..., description="Job title", example="Mobile Flutter Developer")
    department: Optional[str] = Field("", description="Hiring department", example="Software")
    location: Optional[str] = Field("On-site", description="Work location: On-site, Remote, Hybrid", example="Remote")
    employee_type: Optional[str] = Field("Full-time", description="Contract type: Full-time, Part-time, Contract", example="Full-time")
    description: Optional[str] = Field("", description="Detailed job description")
    requirements: Optional[str] = Field("", description="Comma-separated or bulleted requirements")
    status: Optional[str] = Field("open", description="Job status: open, closed, draft", example="open")
    deadline: Optional[datetime] = Field(None, description="Application deadline")

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
