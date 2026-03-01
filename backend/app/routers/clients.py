from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.client import Client
from ..models.user import User
from ..schemas.client import ClientCreate, ClientUpdate
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/clients", tags=["clients"])

@router.get("")
def get_clients(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    clients = db.query(Client).all()
    return {"clients": clients}

@router.post("")
def create_client(client: ClientCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client_data = client.model_dump()
    project_ids = client_data.pop("project_ids", [])
    
    new_client = Client(**client_data)
    new_client.project_ids = ",".join(project_ids) if project_ids else ""
    
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return {"client": new_client}

@router.get("/{client_id}")
def get_client(client_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"client": client}

@router.put("/{client_id}")
def update_client(
    client_id: str,
    client_update: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    update_data = client_update.model_dump(exclude_unset=True)
    if "project_ids" in update_data:
        client.project_ids = ",".join(update_data.pop("project_ids"))
        
    for key, value in update_data.items():
        setattr(client, key, value)
        
    db.commit()
    db.refresh(client)
    return {"client": client}
