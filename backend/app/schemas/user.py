from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = "employee"
    phone: Optional[str] = ""
    department: Optional[str] = ""
    position: Optional[str] = ""

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
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
