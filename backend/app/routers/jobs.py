from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.job import Job
from ..models.user import User
from ..schemas.job import JobCreate, JobUpdate
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.get("")
def get_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    jobs = db.query(Job).all()
    return {"jobs": jobs}

@router.post("")
def create_job(job: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Not authorized to create jobs")
        
    new_job = Job(**job.model_dump())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return {"job": new_job}

@router.get("/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job": job}

@router.put("/{job_id}")
def update_job(
    job_id: str,
    job_update: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Not authorized to update jobs")
        
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    update_data = job_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(job, key, value)
        
    db.commit()
    db.refresh(job)
    return {"job": job}
