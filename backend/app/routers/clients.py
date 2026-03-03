from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.client import Client
from ..models.user import User
from ..schemas.client import ClientCreate, ClientUpdate
from ..middleware.auth import get_current_user
from ..middleware.rbac import require_hr
from ..services.client_service import ClientService

router = APIRouter(prefix="/api/clients", tags=["clients"])

@router.get("")
async def get_clients(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    clients = await ClientService.get_clients(db)
    return {"clients": clients}

@router.post("", dependencies=[require_hr])
async def create_client(client: ClientCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_client = await ClientService.create_client(db, client, current_user)
    return {"client": new_client}

@router.get("/{client_id}")
async def get_client(client_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = await ClientService.get_by_id(db, client_id)
    return {"client": client}

@router.put("/{client_id}", dependencies=[require_hr])
async def update_client(
    client_id: str,
    client_update: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = await ClientService.update_client(db, client_id, client_update, current_user)
    return {"client": client}

@router.delete("/{client_id}", dependencies=[require_hr])
async def delete_client(client_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await ClientService.delete_client(db, client_id, current_user)
