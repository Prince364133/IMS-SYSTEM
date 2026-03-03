from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from typing import Optional, List, Dict, Any

from ..models.goal import Goal
from ..schemas.goal import GoalCreate, GoalUpdate

class GoalService:
    @staticmethod
    async def get_goals(db: AsyncSession, employee_id: Optional[str] = None):
        stmt = select(Goal)
        if employee_id:
            stmt = stmt.filter(Goal.employee_id == employee_id)
            
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, goal_id: str):
        result = await db.execute(select(Goal).filter(Goal.id == goal_id))
        goal = result.scalars().first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        return goal

    @staticmethod
    async def create_goal(db: AsyncSession, goal_data: GoalCreate):
        new_goal = Goal(**goal_data.model_dump())
        db.add(new_goal)
        await db.commit()
        await db.refresh(new_goal)
        return new_goal

    @staticmethod
    async def update_goal(db: AsyncSession, goal_id: str, goal_update: GoalUpdate):
        goal = await GoalService.get_by_id(db, goal_id)
        
        update_data = goal_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(goal, key, value)
            
        await db.commit()
        await db.refresh(goal)
        return goal

    @staticmethod
    async def delete_goal(db: AsyncSession, goal_id: str):
        goal = await GoalService.get_by_id(db, goal_id)
        await db.delete(goal)
        await db.commit()
        return {"message": "Goal deleted successfully"}
