from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from fastapi import HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime

from ..models.task import Task
from ..schemas.task import TaskCreate, TaskUpdate
from ..middleware.audit import log_action

class TaskService:
    @staticmethod
    async def get_tasks(
        db: AsyncSession, 
        project_id: Optional[str] = None, 
        assignee_id: Optional[str] = None,
        search: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ):
        stmt = select(Task).filter(Task.deleted_at == None)
        
        if search:
            stmt = stmt.filter(Task.title.ilike(f"%{search}%"))
        if project_id:
            stmt = stmt.filter(Task.project_id == project_id)
        if assignee_id:
            stmt = stmt.filter(Task.assignee_id == assignee_id)
        if status:
            stmt = stmt.filter(Task.status == status)
            
        # Get total count
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await db.execute(count_stmt)
        total_count = total.scalar() or 0
        
        # Apply limit/offset
        stmt = stmt.limit(limit).offset(offset)
        result = await db.execute(stmt)
        return result.scalars().all(), total_count

    @staticmethod
    async def get_by_id(db: AsyncSession, task_id: str):
        result = await db.execute(select(Task).filter(Task.id == task_id, Task.deleted_at == None))
        task = result.scalars().first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task

    @staticmethod
    async def create_task(db: AsyncSession, task_data: TaskCreate, current_user: Any = None):
        new_task = Task(**task_data.model_dump())
        db.add(new_task)
        await db.commit()
        await db.refresh(new_task)
        
        if current_user:
            await log_action(current_user, "CREATE", "task", new_task.id, f"Created task: {new_task.title}", db=db)
        return new_task

    @staticmethod
    async def update_task(db: AsyncSession, task_id: str, task_update: TaskUpdate, current_user: Any = None):
        task = await TaskService.get_by_id(db, task_id)
        
        update_data = task_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
            
        await db.commit()
        await db.refresh(task)
        
        if current_user:
            await log_action(current_user, "UPDATE", "task", task_id, f"Updated task: {task.title}", db=db)
        return task

    @staticmethod
    async def delete_task(db: AsyncSession, task_id: str, current_user: Any = None):
        task = await TaskService.get_by_id(db, task_id)
        task.deleted_at = datetime.utcnow()
        await db.commit()
        
        if current_user:
            await log_action(current_user, "DELETE", "task", task_id, f"Soft deleted task: {task.title}", db=db)
        return {"message": "Task deleted successfully"}
