from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.project import Project
from ..models.user import User
from ..schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("")
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = db.query(Project).all()
    # Frontend expects {"projects": [...]}
    return {"projects": projects}

@router.post("")
def create_project(project: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    proj_data = project.model_dump()
    tags = proj_data.pop("tags", [])
    member_ids = proj_data.pop("member_ids", [])
    
    new_project = Project(**proj_data)
    new_project.tags = ",".join(tags) if tags else ""
    new_project.member_ids = ",".join(member_ids) if member_ids else ""
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return {"project": new_project}

@router.get("/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"project": project}

@router.put("/{project_id}")
def update_project(
    project_id: str, 
    project_update: ProjectUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    update_data = project_update.model_dump(exclude_unset=True)
    
    if "tags" in update_data:
        project.tags = ",".join(update_data.pop("tags"))
    if "member_ids" in update_data:
        project.member_ids = ",".join(update_data.pop("member_ids"))
        
    for key, value in update_data.items():
        setattr(project, key, value)
        
    db.commit()
    db.refresh(project)
    return {"project": project}

@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}
