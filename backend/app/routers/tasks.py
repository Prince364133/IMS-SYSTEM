from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ..database import get_db
from ..models.task import Task
from ..models.user import User
from ..schemas.task import TaskCreate, TaskUpdate
from ..middleware.auth import get_current_user
from ..services.task_service import TaskService

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("")
async def get_tasks(
    project_id: Optional[str] = None,
    assignee_id: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks, total = await TaskService.get_tasks(db, project_id, assignee_id, search, status, limit, offset)
    return {"tasks": tasks, "count": total}

@router.post("")
async def create_task(task: TaskCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_task = await TaskService.create_task(db, task, current_user)
    return {"task": new_task}

@router.put("/{task_id}")
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = await TaskService.update_task(db, task_id, task_update, current_user)
    return {"task": task}

@router.delete("/{task_id}")
async def delete_task(task_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await TaskService.delete_task(db, task_id, current_user)
