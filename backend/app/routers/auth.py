from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from ..database import get_db
from ..models.user import User
from ..schemas.user import UserCreate, UserOut, Token, Login
from ..middleware.auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=Token, status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role="pending"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"id": new_user.id})
    return {"token": access_token, "user": new_user}

@router.post("/login", response_model=Token)
def login(login_data: Login, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated. Contact admin.")
        
    access_token = create_access_token(data={"id": user.id})
    return {"token": access_token, "user": user}

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"user": current_user}

@router.put("/change-password")
def change_password(data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")
    
    if not verify_password(current_password, current_user.password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    current_user.password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}
