from fastapi import Depends, HTTPException, status
from typing import List, Any
from .auth import get_current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: Any = Depends(get_current_user)):
        if user.role not in self.allowed_roles and user.role != "superadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role: {user.role}"
            )
        return user

# Convenience factory for common roles
def require_roles(roles: List[str]):
    return Depends(RoleChecker(roles))

# Direct admin/hr checks
require_admin = require_roles(["admin"])
require_hr = require_roles(["hr", "admin"])
require_manager = require_roles(["manager", "hr", "admin"])
require_staff = require_roles(["employee", "manager", "hr", "admin"])
