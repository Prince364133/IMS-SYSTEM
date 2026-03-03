from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TaskBase(BaseModel):
    title: str = Field(..., description="The title of the task", example="Design Homepage")
    description: Optional[str] = Field("", description="A detailed description of the task", example="Create high-fidelity mockups for the homepage.")
    status: Optional[str] = Field("todo", description="Current status: todo, in_progress, review, done", example="todo")
    priority: Optional[str] = Field("medium", description="Priority level: low, medium, high, critical", example="high")
    due_date: Optional[datetime] = Field(None, description="Task due date")
    attachment_urls: Optional[str] = Field("", description="Comma-separated list of attachment URLs")

class TaskCreate(TaskBase):
    project_id: str
    assignee_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    assignee_id: Optional[str] = None
    attachment_urls: Optional[str] = None

class TaskOut(TaskBase):
    id: str
    project_id: str
    assignee_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
