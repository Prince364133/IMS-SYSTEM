from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from typing import Optional, List
from datetime import datetime

from ..models.user import User
from ..schemas.user import UserUpdate
from ..middleware.auth import get_password_hash
from ..middleware.audit import log_action

class UserService:
    @staticmethod
    async def get_users(
        db: AsyncSession,
        role: Optional[str] = None,
        search: Optional[str] = None,
        department: Optional[str] = None,
        is_active: Optional[bool] = None
    ):
        # Filter out soft-deleted users
        stmt = select(User).filter(User.deleted_at == None)
        
        if role:
            stmt = stmt.filter(User.role == role)
        if search:
            stmt = stmt.filter(or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.department.ilike(f"%{search}%")
            ))
        if department:
            stmt = stmt.filter(User.department == department)
        if is_active is not None:
            stmt = stmt.filter(User.is_active == is_active)
            
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str):
        # Only get if not soft-deleted
        result = await db.execute(select(User).filter(User.id == user_id, User.deleted_at == None))
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    @staticmethod
    async def update_user(
        db: AsyncSession,
        user_id: str,
        user_update: UserUpdate,
        current_user: User
    ):
        user = await UserService.get_by_id(db, user_id)
        
        # Authorization logic: Only admin/hr/superadmin or self can update
        is_admin_or_hr = current_user.role in ["admin", "hr", "superadmin"]
        is_self = current_user.id == user_id
        
        if not (is_admin_or_hr or is_self):
            raise HTTPException(status_code=403, detail="Not authorized to update this user")
            
        update_data = user_update.model_dump(exclude_unset=True)
        
        # Self-update restrictions for normal users
        if not is_admin_or_hr and is_self:
            if "role" in update_data:
                del update_data["role"]
            if "is_active" in update_data:
                del update_data["is_active"]
                
        if "password" in update_data and update_data["password"]:
            update_data["password"] = get_password_hash(update_data["password"])
            
        for key, value in update_data.items():
            setattr(user, key, value)
            
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def delete_user(db: AsyncSession, user_id: str, current_user: User):
        if current_user.role not in ["admin", "hr", "superadmin"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete user")
            
        user = await UserService.get_by_id(db, user_id)
        
        # Log action before deletion
        await log_action(current_user, "DELETE", "user", user_id, f"Soft deleted user: {user.email}", db=db)
        
        # Soft delete
        user.deleted_at = datetime.utcnow()
        user.is_active = False # Also deactivate for safety
        
        await db.commit()
        return {"message": "User deleted successfully"}
