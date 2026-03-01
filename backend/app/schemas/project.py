from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = ""
    status: Optional[str] = "not_started"
    priority: Optional[str] = "medium"
    deadline: Optional[datetime] = None
    progress: Optional[float] = 0.0

class ProjectCreate(ProjectBase):
    owner_id: str
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
