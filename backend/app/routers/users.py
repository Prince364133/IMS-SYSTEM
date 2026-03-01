from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.user import User
from ..schemas.user import UserOut, UserUpdate
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("")
def get_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    department: Optional[str] = None,
    isActive: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    if search:
        query = query.filter(User.name.ilike(f"%{search}%"))
    if department:
        query = query.filter(User.department == department)
    if isActive is not None:
        query = query.filter(User.is_active == isActive)
        
    users = query.all()
    # The frontend expects {"users": [...]}
    return {"users": users}

@router.get("/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": user}

@router.put("/{user_id}")
def update_user(
    user_id: str, 
    user_update: UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Only admin/hr or self can update
    if current_user.role not in ["admin", "hr"] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")
        
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
        
    db.commit()
    db.refresh(user)
    return {"user": user}

@router.delete("/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete user")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}
