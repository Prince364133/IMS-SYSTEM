from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from datetime import datetime
from typing import Optional

from ..database import get_db
from ..models.user import User
from ..middleware.auth import get_current_user
from ..middleware.rbac import require_hr
from ..services.hrms_service import HRMSService

router = APIRouter(prefix="/api/hrms", tags=["hrms"])

@router.get("/dashboard", dependencies=[require_hr])
async def get_dashboard(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await HRMSService.get_dashboard_stats(db)

@router.get("/attendance-report", dependencies=[require_hr])
async def get_attendance_report(month: str = Query(..., description="YYYY-MM"), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await HRMSService.get_attendance_report(db, month)
