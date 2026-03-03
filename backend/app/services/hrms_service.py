from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import List, Dict, Any, Optional

from ..models.user import User
from ..models.attendance import Attendance
from ..models.project import Project
from ..models.task import Task

class HRMSService:
    @staticmethod
    async def get_dashboard_stats(db: AsyncSession) -> Dict[str, Any]:
        # 1. Employee Stats
        total_employees_stmt = select(func.count(User.id)).filter(User.role == "employee")
        total_employees = (await db.execute(total_employees_stmt)).scalar() or 0
        
        active_employees_stmt = select(func.count(User.id)).filter(User.role == "employee", User.is_active == True)
        active_employees = (await db.execute(active_employees_stmt)).scalar() or 0
        
        # 2. Today's Attendance breakdown
        today_str = datetime.now().strftime("%Y-%m-%d")
        today_records_stmt = (
            select(Attendance.status, func.count(Attendance.id))
            .filter(Attendance.date == today_str)
            .group_by(Attendance.status)
        )
        today_records = (await db.execute(today_records_stmt)).all()
        
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
        depts_stmt = (
            select(User.department, func.count(User.id))
            .filter(User.role == "employee")
            .group_by(User.department)
        )
        depts = (await db.execute(depts_stmt)).all()
        departments = [{"department": d[0] or "Unassigned", "count": d[1]} for d in depts]
        
        # 4. Project & Task Summary
        projects_active_stmt = select(func.count(Project.id)).filter(Project.status == "in_progress")
        projects_active = (await db.execute(projects_active_stmt)).scalar() or 0
        
        tasks_open_stmt = select(func.count(Task.id)).filter(Task.status.in_(["todo", "in_progress", "review"]))
        tasks_open = (await db.execute(tasks_open_stmt)).scalar() or 0
        
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

    @staticmethod
    async def get_attendance_report(db: AsyncSession, month: str) -> Dict[str, Any]:
        # Get all employees
        employees_stmt = select(User).filter(User.role == "employee")
        employees = (await db.execute(employees_stmt)).scalars().all()
        
        # Get all records for the month
        records_stmt = select(Attendance).filter(Attendance.date.startswith(month))
        records = (await db.execute(records_stmt)).scalars().all()
        
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
