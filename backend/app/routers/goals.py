from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ..database import get_db
from ..models.goal import Goal
from ..models.user import User
from ..schemas.goal import GoalCreate, GoalUpdate
from ..middleware.auth import get_current_user
from ..services.goal_service import GoalService

router = APIRouter(prefix="/api/goals", tags=["goals"])

@router.get("")
async def get_goals(
    employee_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals = await GoalService.get_goals(db, employee_id)
    return {"goals": goals}

@router.post("")
async def create_goal(goal: GoalCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_goal = await GoalService.create_goal(db, goal)
    return {"goal": new_goal}

@router.put("/{goal_id}")
async def update_goal(
    goal_id: str,
    goal_update: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = await GoalService.update_goal(db, goal_id, goal_update)
    return {"goal": goal}

@router.delete("/{goal_id}")
async def delete_goal(goal_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await GoalService.delete_goal(db, goal_id)
