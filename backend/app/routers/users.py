from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ..database import get_db
from ..models.user import User
from ..schemas.user import UserOut, UserUpdate
from ..middleware.auth import get_current_user
from ..middleware.rbac import require_hr, RoleChecker
from ..services.user_service import UserService

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("", dependencies=[require_hr])
async def get_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    department: Optional[str] = None,
    isActive: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = await UserService.get_users(db, role, search, department, isActive)
    return {"users": users}

@router.get("/{user_id}")
async def get_user(user_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = await UserService.get_by_id(db, user_id)
    return {"user": user}

@router.put("/{user_id}")
async def update_user(
    user_id: str, 
    user_update: UserUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    user = await UserService.update_user(db, user_id, user_update, current_user)
    return {"user": user}

@router.delete("/{user_id}", dependencies=[require_hr])
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await UserService.delete_user(db, user_id, current_user)
