from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from typing import Any, Dict
from datetime import datetime, timedelta
import uuid

from ..models.user import User
from ..models.refresh_token import RefreshToken
from ..schemas.user import UserCreate, Login
from ..middleware.auth import verify_password, get_password_hash, create_access_token
from ..middleware.audit import log_action
from ..config import settings
from ..services.mfa_service import MFAService
from ..schemas.mfa import MFAVerifyRequest

class AuthService:
    @staticmethod
    async def register_user(db: AsyncSession, user_data: UserCreate) -> Dict[str, Any]:
        result = await db.execute(select(User).filter(User.email == user_data.email))
        db_user = result.scalars().first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            name=user_data.name,
            email=user_data.email,
            password=hashed_password,
            role="pending"
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        access_token = create_access_token(data={"id": new_user.id})
        refresh_token = await AuthService.create_refresh_token(db, new_user.id)
        
        await log_action(new_user, "REGISTER_SUCCESS", "user", new_user.id, db=db)
        
        return {
            "token": access_token, 
            "refreshToken": refresh_token,
            "user": new_user
        }
    
    @staticmethod
    async def login_user(db: AsyncSession, login_data: Login) -> Dict[str, Any]:
        result = await db.execute(select(User).filter(
            User.email == login_data.email,
            User.deleted_at == None
        ))
        user = result.scalars().first()
        
        if not user or not verify_password(login_data.password, user.password):
            await log_action(None, "LOGIN_FAIL", "user", login_data.email, "Invalid credentials", db=db)
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not user.is_active:
            await log_action(user, "LOGIN_BLOCKED", "user", user.id, "Inactive account", db=db)
            raise HTTPException(status_code=403, detail="Account deactivated. Contact admin.")
            
        # Check MFA
        if user.mfa_enabled:
            return {"mfa_required": True, "userId": user.id}
            
        access_token = create_access_token(data={"id": user.id})
        refresh_token = await AuthService.create_refresh_token(db, user.id)
        
        await log_action(user, "LOGIN_SUCCESS", "user", user.id, db=db)
        
        return {
            "token": access_token, 
            "refreshToken": refresh_token,
            "user": user
        }

    @staticmethod
    async def verify_mfa(db: AsyncSession, data: MFAVerifyRequest) -> Dict[str, Any]:
        result = await db.execute(select(User).filter(User.id == data.user_id, User.deleted_at == None))
        user = result.scalars().first()
        if not user or not user.mfa_enabled:
            raise HTTPException(status_code=400, detail="MFA not enabled or user not found")
            
        if not MFAService.verify_token(user.mfa_secret, data.token):
            await log_action(user, "MFA_FAIL", "user", user.id, "Invalid MFA token", db=db)
            raise HTTPException(status_code=401, detail="Invalid MFA token")
            
        access_token = create_access_token(data={"id": user.id})
        refresh_token = await AuthService.create_refresh_token(db, user.id)
        
        await log_action(user, "LOGIN_SUCCESS_MFA", "user", user.id, db=db)
        
        return {
            "token": access_token, 
            "refreshToken": refresh_token,
            "user": user
        }

    @staticmethod
    async def create_refresh_token(db: AsyncSession, user_id: str) -> str:
        token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        new_token = RefreshToken(
            token=token,
            user_id=user_id,
            expires_at=expires_at
        )
        db.add(new_token)
        await db.commit()
        return token

    @staticmethod
    async def refresh_access_token(db: AsyncSession, refresh_token: str) -> Dict[str, str]:
        result = await db.execute(select(RefreshToken).filter(
            RefreshToken.token == refresh_token,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.utcnow()
        ))
        db_token = result.scalars().first()
        
        if not db_token:
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
            
        # Rotate token: revoke old one and create new one
        db_token.is_revoked = True
        await db.commit()
        
        new_access_token = create_access_token(data={"id": db_token.user_id})
        new_refresh_token = await AuthService.create_refresh_token(db, db_token.user_id)
        
        return {
            "token": new_access_token,
            "refreshToken": new_refresh_token
        }

    @staticmethod
    async def change_password(db: AsyncSession, current_user: User, data: Dict[str, Any]) -> Dict[str, str]:
        current_password = data.get("currentPassword")
        new_password = data.get("newPassword")
        
        if not current_password or not new_password:
            raise HTTPException(status_code=400, detail="Missing required password fields")
            
        if not verify_password(current_password, current_user.password):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        current_user.password = get_password_hash(new_password)
        await db.commit()
        
        return {"message": "Password updated successfully"}
