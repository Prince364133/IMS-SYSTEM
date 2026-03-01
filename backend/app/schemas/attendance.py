from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AttendanceBase(BaseModel):
    date: str # YYYY-MM-DD
    status: Optional[str] = "present"
    check_in: Optional[str] = ""
    check_out: Optional[str] = ""
    notes: Optional[str] = ""

class AttendanceCreate(AttendanceBase):
    employee: str  # maps to employee_id in DB, using 'employee' because frontend sends { employee: "ID", date: ... }

class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None

class AttendanceOut(AttendanceBase):
    id: str
    employee_id: str
    marked_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# For the frontend which expects {"employee": {"_id": "...", "name": "...", "employeeId": "..."}} nested object
class AttendanceWithEmployee(AttendanceOut):
    employee_details: dict
    
    class Config:
        from_attributes = True
