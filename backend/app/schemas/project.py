from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProjectBase(BaseModel):
    name: str = Field(..., description="The name of the project", example="Website Redesign")
    description: Optional[str] = Field("", description="A detailed description of the project", example="Overhauling the company's public website.")
    status: Optional[str] = Field("not_started", description="Current status: not_started, in_progress, on_hold, completed", example="in_progress")
    priority: Optional[str] = Field("medium", description="Priority level: low, medium, high, critical", example="high")
    deadline: Optional[datetime] = Field(None, description="Project completion deadline")
    progress: Optional[float] = Field(0.0, description="Project completion percentage (0.0 to 1.0)", example=0.45)

class ProjectCreate(ProjectBase):
    owner_id: Optional[str] = None
    client_id: Optional[str] = None
    tags: Optional[List[str]] = []
    member_ids: Optional[List[str]] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime] = None
    progress: Optional[float] = None
    client_id: Optional[str] = None
    tags: Optional[List[str]] = None
    member_ids: Optional[List[str]] = None

class ProjectOut(ProjectBase):
    id: str
    owner_id: str
    client_id: Optional[str] = None
    tags: List[str] = []
    member_ids: List[str] = []
    start_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
