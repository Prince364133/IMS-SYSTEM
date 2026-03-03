from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ..database import get_db
from ..models.user import User
from ..schemas.job import JobCreate, JobUpdate
from ..middleware.auth import get_current_user
from ..middleware.rbac import require_hr
from ..services.job_service import JobService

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.get("")
async def get_jobs(
    department: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    jobs = await JobService.get_jobs(db, department, search)
    return {"jobs": jobs}

@router.post("", dependencies=[require_hr])
async def create_job(job: JobCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_job = await JobService.create_job(db, job, current_user)
    return {"job": new_job}

@router.get("/{job_id}")
async def get_job(job_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = await JobService.get_by_id(db, job_id)
    return {"job": job}

@router.put("/{job_id}", dependencies=[require_hr])
async def update_job(
    job_id: str,
    job_update: JobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = await JobService.update_job(db, job_id, job_update, current_user)
    return {"job": job}

@router.delete("/{job_id}", dependencies=[require_hr])
async def delete_job(job_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await JobService.delete_job(db, job_id, current_user)
