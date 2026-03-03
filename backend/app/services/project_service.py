from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from fastapi import HTTPException
from typing import List, Optional, Any, Dict
from datetime import datetime

from ..models.project import Project
from ..schemas.project import ProjectCreate, ProjectUpdate
from ..middleware.audit import log_action

class ProjectService:
    @staticmethod
    async def get_projects(db: AsyncSession, current_user: Any, search: Optional[str] = None, limit: int = 100, offset: int = 0):
        # Filter out soft-deleted projects
        stmt = select(Project).filter(Project.deleted_at == None)
        
        if search:
            stmt = stmt.filter(Project.name.ilike(f"%{search}%"))
            
        if current_user.role not in ["admin", "superadmin", "hr"]:
            # Filter projects where member_ids (comma string) contains current_user.id
            stmt = stmt.filter(Project.member_ids.like(f"%{current_user.id}%"))
        
        # Get total count
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await db.execute(count_stmt)
        total_count = total.scalar() or 0
        
        # Apply limit/offset
        stmt = stmt.limit(limit).offset(offset)
        result = await db.execute(stmt)
        return result.scalars().all(), total_count

    @staticmethod
    async def get_by_id(db: AsyncSession, project_id: str):
        result = await db.execute(select(Project).filter(Project.id == project_id, Project.deleted_at == None))
        project = result.scalars().first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project

    @staticmethod
    async def create_project(db: AsyncSession, project_data: ProjectCreate, current_user: Any):
        proj_dict = project_data.model_dump()
        if not proj_dict.get("owner_id"):
            proj_dict["owner_id"] = current_user.id
            
        tags = proj_dict.pop("tags", [])
        member_ids = proj_dict.pop("member_ids", [])
        
        new_project = Project(**proj_dict)
        new_project.tags = ",".join(tags) if tags else ""
        new_project.member_ids = ",".join(member_ids) if member_ids else ""
        
        db.add(new_project)
        await db.commit()
        await db.refresh(new_project)
        
        await log_action(current_user, "CREATE", "project", new_project.id, f"Created project: {new_project.name}", db=db)
        return new_project

    @staticmethod
    async def update_project(db: AsyncSession, project_id: str, project_update: ProjectUpdate, current_user: Any):
        project = await ProjectService.get_by_id(db, project_id)
        
        update_data = project_update.model_dump(exclude_unset=True)
        
        if "tags" in update_data:
            project.tags = ",".join(update_data.pop("tags"))
        if "member_ids" in update_data:
            project.member_ids = ",".join(update_data.pop("member_ids"))
            
        for key, value in update_data.items():
            setattr(project, key, value)
            
        await db.commit()
        await db.refresh(project)
        
        await log_action(current_user, "UPDATE", "project", project_id, f"Updated project: {project.name}", db=db)
        return project

    @staticmethod
    async def delete_project(db: AsyncSession, project_id: str, current_user: Any):
        project = await ProjectService.get_by_id(db, project_id)
        project.deleted_at = datetime.utcnow()
        await db.commit()
        
        await log_action(current_user, "DELETE", "project", project_id, f"Soft deleted project: {project.name}", db=db)
        return {"message": "Project deleted successfully"}
