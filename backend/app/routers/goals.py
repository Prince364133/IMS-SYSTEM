from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models.goal import Goal
from ..models.user import User
from ..schemas.goal import GoalCreate, GoalUpdate
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/goals", tags=["goals"])

@router.get("")
def get_goals(
    employee_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Goal)
    if employee_id:
        query = query.filter(Goal.employee_id == employee_id)
        
    goals = query.all()
    return {"goals": goals}

@router.post("")
def create_goal(goal: GoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_goal = Goal(**goal.model_dump())
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return {"goal": new_goal}

@router.put("/{goal_id}")
def update_goal(
    goal_id: str,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    update_data = goal_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goal, key, value)
        
    db.commit()
    db.refresh(goal)
    return {"goal": goal}
