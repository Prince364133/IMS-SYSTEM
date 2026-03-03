from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from ..database import get_db
from ..models.user import User
from ..schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from ..middleware.auth import get_current_user
from ..middleware.rbac import require_hr
from ..services.project_service import ProjectService

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("")
async def get_projects(
    search: Optional[str] = None,
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    projects, total = await ProjectService.get_projects(db, current_user, search, limit, offset)
    return {"projects": projects, "total": total}

@router.post("", dependencies=[require_hr])
async def create_project(project: ProjectCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_project = await ProjectService.create_project(db, project, current_user)
    return {"project": new_project}

@router.get("/{project_id}")
async def get_project(project_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = await ProjectService.get_by_id(db, project_id)
    return {"project": project}

@router.put("/{project_id}", dependencies=[require_hr])
async def update_project(
    project_id: str, 
    project_update: ProjectUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    project = await ProjectService.update_project(db, project_id, project_update, current_user)
    return {"project": project}

@router.delete("/{project_id}", dependencies=[require_hr])
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await ProjectService.delete_project(db, project_id, current_user)
