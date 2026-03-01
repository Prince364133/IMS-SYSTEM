from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.chat import Chat, Message
from ..models.user import User
from ..schemas.chat import ChatCreate, MessageCreate
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.get("")
def get_chats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Very simple retrieval - return chats where current_user is a member
    # Because member_ids is a comma-separated string, we use LIKE
    chats = db.query(Chat).filter(Chat.member_ids.like(f"%{current_user.id}%")).all()
    # Format for the frontend
    result = []
    for c in chats:
        c_dict = {
            "id": c.id,
            "is_group": c.is_group,
            "name": c.name,
            "member_ids": [m for m in c.member_ids.split(",") if m],
            "created_at": c.created_at
        }
        result.append(c_dict)
    return {"chats": result}

@router.post("")
def create_chat(chat: ChatCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chat_data = chat.model_dump()
    member_ids = chat_data.pop("member_ids", [])
    
    # Ensure current user is in the chat
    if current_user.id not in member_ids:
        member_ids.append(current_user.id)
        
    new_chat = Chat(**chat_data)
    new_chat.member_ids = ",".join(member_ids)
    
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    
    return {
        "chat": {
            "id": new_chat.id,
            "is_group": new_chat.is_group,
            "name": new_chat.name,
            "member_ids": member_ids,
            "created_at": new_chat.created_at
        }
    }

@router.get("/{chat_id}/messages")
def get_messages(chat_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at.asc()).all()
    return {"messages": messages}

@router.post("/{chat_id}/messages")
def send_message(chat_id: str, msg: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if msg.chat_id != chat_id:
        raise HTTPException(status_code=400, detail="Path chat ID does not match body")
        
    new_msg = Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=msg.content,
        attachment_url=msg.attachment_url
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return {"message": new_msg}
