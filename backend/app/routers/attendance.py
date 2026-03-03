from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import exc
from typing import Optional

from ..database import get_db
from ..models.attendance import Attendance
from ..models.user import User
from ..schemas.attendance import AttendanceCreate, AttendanceUpdate
from ..middleware.auth import get_current_user
from ..middleware.rbac import require_hr
from ..services.attendance_service import AttendanceService

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

@router.post("")
async def mark_attendance(att: AttendanceCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = await AttendanceService.mark_attendance(db, att, current_user)
    return {"record": record}

@router.get("/today", dependencies=[require_hr])
async def get_attendance_today(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = await AttendanceService.get_today_attendance(db)
    return {"records": records}

@router.get("/employee/{user_id}")
async def get_employee_attendance(
    user_id: str, 
    month: Optional[str] = None, 
    date: Optional[str] = None,
    limit: int = 31,
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    records = await AttendanceService.get_employee_attendance(db, user_id, current_user, month, date, limit)
    return {"records": records}

@router.put("/{att_id}")
async def update_attendance(
    att_id: str,
    att_update: AttendanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = await AttendanceService.update_attendance(db, att_id, att_update)
    return {"record": record}

@router.delete("/{att_id}")
async def delete_attendance(att_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await AttendanceService.delete_attendance(db, att_id, current_user)
