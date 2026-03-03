from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from typing import Any, Dict

from ..database import get_db
from ..models.user import User
from ..schemas.user import UserCreate, UserOut, Token, Login
from ..middleware.auth import get_current_user
from ..services.auth_service import AuthService
from ..services.mfa_service import MFAService
from ..middleware.audit import log_action

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await AuthService.register_user(db, user)
    return result

@router.post("/mfa/setup")
async def setup_mfa(current_user: User = Depends(get_current_user)):
    secret = MFAService.generate_secret()
    uri = MFAService.get_provisioning_uri(current_user.email, secret)
    qr_code = MFAService.generate_qr_base64(uri)
    return {
        "secret": secret,
        "qr_code": qr_code,
        "provisioning_uri": uri
    }

@router.post("/mfa/enable")
async def enable_mfa(
    data: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify the token first
    if not MFAService.verify_token(data.get("secret"), data.get("token")):
        raise HTTPException(status_code=400, detail="Invalid token")

    current_user.mfa_secret = data.get("secret")
    current_user.mfa_enabled = True
    await db.commit()

    await log_action(current_user, "MFA_ENABLED", "user", current_user.id, db=db)
    return {"message": "MFA enabled successfully"}

@router.post("/mfa/verify")
async def verify_mfa(data: Any, db: AsyncSession = Depends(get_db)):
    return await AuthService.verify_mfa(db, data)

@router.post("/login")
async def login(login_data: Login, db: AsyncSession = Depends(get_db)):
    result = await AuthService.login_user(db, login_data)
    # result might be {"mfa_required": True, "userId": ...} or the full token response
    return result

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {"user": current_user}

@router.post("/refresh")
async def refresh_token(data: Dict[str, str], db: AsyncSession = Depends(get_db)):
    token = data.get("refreshToken")
    if not token:
        raise HTTPException(status_code=400, detail="Refresh token required")
    return await AuthService.refresh_access_token(db, token)

@router.put("/change-password")
async def change_password(data: Dict[str, Any], db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await AuthService.change_password(db, current_user, data)
