import uuid
from sqlalchemy import Column, String, Boolean, Float, DateTime
from sqlalchemy.sql import func
from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="employee")  # admin, hr, manager, employee, client
    photoUrl = Column(String, default="")
    phone = Column(String, default="")
    is_active = Column(Boolean, default=True)
    
    # HR fields
    employeeId = Column(String, unique=True, index=True, nullable=True)
    department = Column(String, default="")
    position = Column(String, default="")
    joinDate = Column(DateTime(timezone=True), nullable=True)
    salary = Column(Float, default=0)
    leaveBalance = Column(Float, default=20)
    emergencyContact = Column(String, default="")
    bankAccount = Column(String, default="") # Sensitive, handled in Pydantic models
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
