from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime

from ..models.application import Application
from ..models.user import User
from ..schemas.application import ApplicationCreate, ApplicationUpdate
from ..middleware.audit import log_action

class ApplicationService:
    @staticmethod
    async def get_applications(db: AsyncSession, job_id: Optional[str] = None, search: Optional[str] = None):
        stmt = select(Application).filter(Application.deleted_at == None)
        if search:
            stmt = stmt.filter(or_(
                Application.applicant_name.ilike(f"%{search}%"),
                Application.email.ilike(f"%{search}%")
            ))
        if job_id:
            stmt = stmt.filter(Application.job_id == job_id)
            
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, app_id: str):
        result = await db.execute(select(Application).filter(Application.id == app_id, Application.deleted_at == None))
        app = result.scalars().first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        return app

    @staticmethod
    async def create_application(db: AsyncSession, app_data: ApplicationCreate):
        new_app = Application(**app_data.model_dump())
        db.add(new_app)
        await db.commit()
        await db.refresh(new_app)
        
        # Public creation usually doesn't have current_user, but we can log system action
        await log_action(None, "CREATE", "application", new_app.id, f"New application from: {new_app.email}", db=db)
        return new_app

    @staticmethod
    async def update_application(
        db: AsyncSession, 
        app_id: str, 
        app_update: ApplicationUpdate, 
        current_user: User
    ):
        if current_user.role not in ["admin", "hr", "manager", "superadmin"]:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        app_doc = await ApplicationService.get_by_id(db, app_id)
        
        update_data = app_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(app_doc, key, value)
            
        await db.commit()
        await db.refresh(app_doc)
        
        await log_action(current_user, "UPDATE", "application", app_id, f"Updated status to: {app_doc.status}", db=db)
        return app_doc

    @staticmethod
    async def delete_application(db: AsyncSession, app_id: str, current_user: User):
        if current_user.role not in ["admin", "hr", "superadmin"]:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        app_doc = await ApplicationService.get_by_id(db, app_id)
        app_doc.deleted_at = datetime.utcnow()
        await db.commit()
        
        await log_action(current_user, "DELETE", "application", app_id, f"Soft deleted application: {app_doc.email}", db=db)
        return {"message": "Application deleted successfully"}
