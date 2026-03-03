from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from fastapi import HTTPException
from typing import Optional, List, Any
from datetime import datetime

from ..models.job import Job
from ..schemas.job import JobCreate, JobUpdate
from ..middleware.audit import log_action

class JobService:
    @staticmethod
    async def get_jobs(db: AsyncSession, department: Optional[str] = None, search: Optional[str] = None):
        stmt = select(Job).filter(Job.deleted_at == None)
        
        if search:
            stmt = stmt.filter(or_(
                Job.title.ilike(f"%{search}%"),
                Job.department.ilike(f"%{search}%")
            ))
            
        if department:
            stmt = stmt.filter(Job.department == department)
            
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, job_id: str):
        result = await db.execute(select(Job).filter(Job.id == job_id, Job.deleted_at == None))
        job = result.scalars().first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job

    @staticmethod
    async def create_job(db: AsyncSession, job_data: JobCreate, current_user: Any):
        new_job = Job(**job_data.model_dump())
        db.add(new_job)
        await db.commit()
        await db.refresh(new_job)
        
        await log_action(current_user, "CREATE", "job", new_job.id, f"Created job: {new_job.title}", db=db)
        return new_job

    @staticmethod
    async def update_job(db: AsyncSession, job_id: str, job_update: JobUpdate, current_user: Any):
        job = await JobService.get_by_id(db, job_id)
        
        update_data = job_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(job, key, value)
            
        await db.commit()
        await db.refresh(job)
        
        await log_action(current_user, "UPDATE", "job", job_id, f"Updated job: {job.title}", db=db)
        return job

    @staticmethod
    async def delete_job(db: AsyncSession, job_id: str, current_user: Any):
        job = await JobService.get_by_id(db, job_id)
        job.deleted_at = datetime.utcnow()
        await db.commit()
        
        await log_action(current_user, "DELETE", "job", job_id, f"Soft deleted job: {job.title}", db=db)
        return {"message": "Job deleted successfully"}
