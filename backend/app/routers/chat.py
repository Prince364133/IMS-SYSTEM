from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..database import get_db
from ..models.chat import Chat, Message
from ..models.user import User
from ..schemas.chat import ChatCreate, MessageCreate
from ..middleware.auth import get_current_user
from ..services.chat_service import ChatService

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.get("")
async def get_chats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    chats = await ChatService.get_user_chats(db, current_user)
    return {"chats": chats}

@router.post("")
async def create_chat(chat: ChatCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    chat_dict = await ChatService.create_chat(db, chat, current_user)
    return {"chat": chat_dict}

@router.get("/{chat_id}/messages")
async def get_messages(chat_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = await ChatService.get_messages(db, chat_id)
    return {"messages": messages}

@router.post("/{chat_id}/messages")
async def send_message(chat_id: str, msg: MessageCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_msg = await ChatService.send_message(db, chat_id, msg, current_user)
    return {"message": new_msg}
