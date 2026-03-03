from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str = Field(..., description="The full name of the user", example="John Doe")
    email: EmailStr = Field(..., description="Electronic mail address", example="john.doe@example.com")
    role: Optional[str] = Field("employee", description="User role: admin, manager, employee", example="manager")
    phone: Optional[str] = Field("", description="Phone number", example="+1234567890")
    department: Optional[str] = Field("", description="Department name", example="Engineering")
    position: Optional[str] = Field("", description="Job title", example="Senior Developer")

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None
    salary: Optional[float] = None
    leaveBalance: Optional[float] = None
    emergencyContact: Optional[str] = None

class UserOut(UserBase):
    id: str
    photoUrl: Optional[str] = ""
    is_active: bool
    employeeId: Optional[str] = None
    joinDate: Optional[datetime] = None
    salary: Optional[float] = None
    leaveBalance: Optional[float] = None
    emergencyContact: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    token: str
    user: UserOut

class TokenData(BaseModel):
    id: Optional[str] = None

class Login(BaseModel):
    email: str
    password: str
