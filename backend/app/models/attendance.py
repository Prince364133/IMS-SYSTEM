import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.sql import func
from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    date = Column(String, nullable=False, index=True) # YYYY-MM-DD format
    status = Column(String, default="present") # present, absent, late, half_day, work_from_home, on_leave
    check_in = Column(String, default="") # HH:MM format
    check_out = Column(String, default="") # HH:MM format
    notes = Column(Text, default="")
    marked_by = Column(String, ForeignKey("users.id"), nullable=True) # Who marked it (id)

    __table_args__ = (
        UniqueConstraint('employee_id', 'date', name='uq_employee_date'),
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
