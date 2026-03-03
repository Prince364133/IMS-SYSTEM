from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AttendanceBase(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format", example="2024-03-01")
    status: Optional[str] = Field("present", description="Status: present, absent, late, half_day", example="present")
    check_in: Optional[str] = Field("", description="Check-in time (HH:mm)", example="09:00")
    check_out: Optional[str] = Field("", description="Check-out time (HH:mm)", example="18:00")
    notes: Optional[str] = Field("", description="Optional notes about the attendance", example="Late due to traffic.")

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
