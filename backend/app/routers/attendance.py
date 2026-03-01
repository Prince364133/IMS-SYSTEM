from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import exc
from typing import Optional

from ..database import get_db
from ..models.attendance import Attendance
from ..models.user import User
from ..schemas.attendance import AttendanceCreate, AttendanceUpdate
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

@router.post("")
def mark_attendance(att: AttendanceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        new_att = Attendance(
            employee_id=att.employee,
            date=att.date,
            status=att.status,
            check_in=att.check_in,
            check_out=att.check_out,
            notes=att.notes,
            marked_by=current_user.id
        )
        db.add(new_att)
        db.commit()
        db.refresh(new_att)
        return {"record": new_att}
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Attendance already marked for this user today")

@router.get("/today")
def get_attendance_today(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # Needs to return attendance + nested employee object
    records = db.query(Attendance).filter(Attendance.date == today_str).all()
    
    result = []
    for r in records:
        emp = db.query(User).filter(User.id == r.employee_id).first()
        r_dict = {
            "_id": r.id,  # _id for frontend compatibility
            "id": r.id,
            "employee": {"_id": emp.id, "name": emp.name, "employeeId": emp.employeeId, "department": emp.department} if emp else r.employee_id,
            "date": r.date,
            "status": r.status,
            "checkIn": r.check_in,
            "checkOut": r.check_out,
            "notes": r.notes
        }
        result.append(r_dict)
        
    return {"records": result}

@router.get("/employee/{user_id}")
def get_employee_attendance(
    user_id: str, 
    month: Optional[str] = None, 
    date: Optional[str] = None,
    limit: int = 31,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(Attendance).filter(Attendance.employee_id == user_id)
    
    if month:
        query = query.filter(Attendance.date.startswith(month))
    elif date:
        query = query.filter(Attendance.date == date)
        
    records = query.order_by(Attendance.date.desc()).limit(limit).all()
    
    result = []
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
        result.append(r_dict)
        
    return {"records": result}

@router.put("/{att_id}")
def update_attendance(
    att_id: str,
    att_update: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    att = db.query(Attendance).filter(Attendance.id == att_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Record not found")
        
    update_data = att_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(att, key, value)
        
    db.commit()
    db.refresh(att)
    return {"record": att}

@router.delete("/{att_id}")
def delete_attendance(att_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    att = db.query(Attendance).filter(Attendance.id == att_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Record not found")
        
    db.delete(att)
    db.commit()
    return {"message": "Record deleted"}
