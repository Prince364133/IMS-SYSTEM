from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GoalBase(BaseModel):
    title: str
    description: Optional[str] = ""
    status: Optional[str] = "pending"
    target_date: Optional[datetime] = None
    progress: Optional[float] = 0.0

class GoalCreate(GoalBase):
    employee_id: str

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    target_date: Optional[datetime] = None
    progress: Optional[float] = None

class GoalOut(GoalBase):
    id: str
    employee_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
