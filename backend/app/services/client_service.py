from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from typing import List, Optional, Any
from datetime import datetime

from ..models.client import Client
from ..schemas.client import ClientCreate, ClientUpdate
from ..middleware.audit import log_action

class ClientService:
    @staticmethod
    async def get_clients(db: AsyncSession, search: Optional[str] = None):
        stmt = select(Client).filter(Client.deleted_at == None)
        if search:
            stmt = stmt.filter(Client.name.ilike(f"%{search}%"))
        
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, client_id: str):
        result = await db.execute(select(Client).filter(Client.id == client_id, Client.deleted_at == None))
        client = result.scalars().first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        return client

    @staticmethod
    async def create_client(db: AsyncSession, client_data: ClientCreate, current_user: Any):
        new_client = Client(**client_data.model_dump())
        db.add(new_client)
        await db.commit()
        await db.refresh(new_client)
        
        await log_action(current_user, "CREATE", "client", new_client.id, f"Created client: {new_client.name}", db=db)
        return new_client

    @staticmethod
    async def update_client(db: AsyncSession, client_id: str, client_update: ClientUpdate, current_user: Any):
        client = await ClientService.get_by_id(db, client_id)
        
        update_data = client_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(client, key, value)
            
        await db.commit()
        await db.refresh(client)
        
        await log_action(current_user, "UPDATE", "client", client_id, f"Updated client: {client.name}", db=db)
        return client

    @staticmethod
    async def delete_client(db: AsyncSession, client_id: str, current_user: Any):
        client = await ClientService.get_by_id(db, client_id)
        client.deleted_at = datetime.utcnow()
        await db.commit()
        
        await log_action(current_user, "DELETE", "client", client_id, f"Soft deleted client: {client.name}", db=db)
        return {"message": "Client deleted successfully"}
