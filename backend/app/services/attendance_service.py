from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, exc
from fastapi import HTTPException
from datetime import datetime
from typing import List, Optional, Any, Dict

from ..models.attendance import Attendance
from ..models.user import User
from ..schemas.attendance import AttendanceCreate, AttendanceUpdate

class AttendanceService:
    @staticmethod
    async def mark_attendance(db: AsyncSession, att_data: AttendanceCreate, current_user: User):
        try:
            new_att = Attendance(
                employee_id=att_data.employee,
                date=att_data.date,
                status=att_data.status,
                check_in=att_data.check_in,
                check_out=att_data.check_out,
                notes=att_data.notes,
                marked_by=current_user.id
            )
            db.add(new_att)
            await db.commit()
            await db.refresh(new_att)
            return new_att
        except exc.IntegrityError:
            await db.rollback()
            raise HTTPException(status_code=409, detail="Attendance already marked for this user today")

    @staticmethod
    async def get_today_attendance(db: AsyncSession):
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        # Optimized: Join with User to avoid N+1 queries
        stmt = (
            select(Attendance, User)
            .join(User, Attendance.employee_id == User.id)
            .filter(Attendance.date == today_str)
        )
        result = await db.execute(stmt)
        records = result.all()
        
        final_result = []
        for att, emp in records:
            r_dict = {
                "_id": att.id,
                "id": att.id,
                "employee": {
                    "_id": emp.id, 
                    "name": emp.name, 
                    "employeeId": emp.employeeId, 
                    "department": emp.department
                },
                "date": att.date,
                "status": att.status,
                "checkIn": att.check_in,
                "checkOut": att.check_out,
                "notes": att.notes
            }
            final_result.append(r_dict)
        return final_result

    @staticmethod
    async def get_employee_attendance(
        db: AsyncSession,
        user_id: str,
        current_user: User,
        month: Optional[str] = None,
        date: Optional[str] = None,
        limit: int = 31
    ):
        # Auth check: only self or HR/Admin
        if current_user.id != user_id and current_user.role not in ["admin", "hr", "superadmin"]:
            raise HTTPException(status_code=403, detail="Not authorized to view this report")
            
        stmt = select(Attendance).filter(Attendance.employee_id == user_id)
        
        if month:
            stmt = stmt.filter(Attendance.date.startswith(month))
        elif date:
            stmt = stmt.filter(Attendance.date == date)
            
        stmt = stmt.order_by(Attendance.date.desc()).limit(limit)
        result = await db.execute(stmt)
        records = result.scalars().all()
        
        final_result = []
        for r in records:
            r_dict = {
                "_id": r.id,
                "id": r.id,
                "date": r.date,
                "status": r.status,
                "checkIn": r.check_in,
                "checkOut": r.check_out,
                "notes": r.notes
            }
            final_result.append(r_dict)
        return final_result

    @staticmethod
    async def update_attendance(db: AsyncSession, att_id: str, att_update: AttendanceUpdate):
        result = await db.execute(select(Attendance).filter(Attendance.id == att_id))
        att = result.scalars().first()
        if not att:
            raise HTTPException(status_code=404, detail="Record not found")
            
        update_data = att_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(att, key, value)
            
        await db.commit()
        await db.refresh(att)
        return att

    @staticmethod
    async def delete_attendance(db: AsyncSession, att_id: str, current_user: User):
        if current_user.role not in ["admin", "hr", "superadmin"]:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        result = await db.execute(select(Attendance).filter(Attendance.id == att_id))
        att = result.scalars().first()
        if not att:
            raise HTTPException(status_code=404, detail="Record not found")
            
        await db.delete(att)
        await db.commit()
        return {"message": "Record deleted"}
