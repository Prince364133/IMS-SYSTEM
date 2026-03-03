from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ..database import get_db
from ..models.application import Application
from ..models.user import User
from ..schemas.application import ApplicationCreate, ApplicationUpdate
from ..middleware.auth import get_current_user
from ..services.application_service import ApplicationService

router = APIRouter(prefix="/api/applications", tags=["applications"])

@router.get("")
async def get_applications(
    job_id: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    apps = await ApplicationService.get_applications(db, job_id, search)
    return {"applications": apps}

@router.post("")
async def create_application(app: ApplicationCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_app = await ApplicationService.create_application(db, app)
    return {"application": new_app}

@router.put("/{app_id}")
async def update_application(
    app_id: str,
    app_update: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app_doc = await ApplicationService.update_application(db, app_id, app_update, current_user)
    return {"application": app_doc}

@router.delete("/{app_id}")
async def delete_application(app_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await ApplicationService.delete_application(db, app_id, current_user)
