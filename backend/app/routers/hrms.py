from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional

from ..database import get_db
from ..models.user import User
from ..models.attendance import Attendance
from ..models.project import Project
from ..models.task import Task
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/hrms", tags=["hrms"])

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Employee Stats
    total_employees = db.query(User).filter(User.role == "employee").count()
    active_employees = db.query(User).filter(User.role == "employee", User.is_active == True).count()
    
    # 2. Today's Attendance breakdown
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_records = db.query(Attendance.status, func.count(Attendance.id)).filter(Attendance.date == today_str).group_by(Attendance.status).all()
    
    attendance_breakdown = {
        "present": 0, "absent": 0, "late": 0, "half_day": 0, "work_from_home": 0, "on_leave": 0
    }
    for status, count in today_records:
        if status in attendance_breakdown:
            attendance_breakdown[status] = count
            
    # Unmarked calculation
    marked_total = sum(attendance_breakdown.values())
    unmarked = max(0, active_employees - marked_total)
    
    # 3. Department Breakdown
    depts = db.query(User.department, func.count(User.id)).filter(User.role == "employee").group_by(User.department).all()
    departments = [{"department": d[0] or "Unassigned", "count": d[1]} for d in depts]
    
    # 4. Project & Task Summary
    projects_active = db.query(Project).filter(Project.status == "in_progress").count()
    tasks_open = db.query(Task).filter(Task.status.in_(["todo", "in_progress", "review"])).count()
    
    return {
        "employees": {
            "total": total_employees,
            "active": active_employees,
            "departments": departments,
        },
        "attendance": {
            "today": today_str,
            "breakdown": attendance_breakdown,
            "unmarked": unmarked
        },
        "projects": {
            "active": projects_active,
            "openTasks": tasks_open
        }
    }

@router.get("/attendance-report")
def get_attendance_report(month: str = Query(..., description="YYYY-MM"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get all employees
    employees = db.query(User).filter(User.role == "employee").all()
    
    # Get all records for the month
    records = db.query(Attendance).filter(Attendance.date.startswith(month)).all()
    
    # Group by employee
    emp_map = {e.id: {
        "employeeId": e.employeeId,
        "name": e.name,
        "department": e.department,
        "present": 0, "absent": 0, "late": 0, "half_day": 0, "work_from_home": 0, "on_leave": 0,
        "total_days": 0
    } for e in employees}
    
    for r in records:
        if r.employee_id in emp_map:
            emp = emp_map[r.employee_id]
            emp["total_days"] += 1
            if r.status in emp:
                emp[r.status] += 1
                
    return {"month": month, "report": list(emp_map.values())}
