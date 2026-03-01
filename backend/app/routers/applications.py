from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models.application import Application
from ..models.user import User
from ..schemas.application import ApplicationCreate, ApplicationUpdate
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/applications", tags=["applications"])

@router.get("")
def get_applications(
    job_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Application)
    if job_id:
        query = query.filter(Application.job_id == job_id)
        
    apps = query.all()
    return {"applications": apps}

@router.post("")
def create_application(app: ApplicationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_app = Application(**app.model_dump())
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return {"application": new_app}

@router.put("/{app_id}")
def update_application(
    app_id: str,
    app_update: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    app_doc = db.query(Application).filter(Application.id == app_id).first()
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
        
    update_data = app_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(app_doc, key, value)
        
    db.commit()
    db.refresh(app_doc)
    return {"application": app_doc}
