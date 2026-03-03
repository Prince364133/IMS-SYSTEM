from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from typing import List, Dict, Any

from ..models.chat import Chat, Message
from ..models.user import User
from ..schemas.chat import ChatCreate, MessageCreate

class ChatService:
    @staticmethod
    async def get_user_chats(db: AsyncSession, current_user: User):
        # We use comma-separated member_ids for simplicity in this MVP
        stmt = select(Chat).filter(Chat.member_ids.like(f"%{current_user.id}%"))
        result = await db.execute(stmt)
        chats = result.scalars().all()
        
        final_result = []
        for c in chats:
            final_result.append({
                "id": c.id,
                "is_group": c.is_group,
                "name": c.name,
                "member_ids": [m for m in c.member_ids.split(",") if m],
                "created_at": c.created_at
            })
        return final_result

    @staticmethod
    async def create_chat(db: AsyncSession, chat_data: ChatCreate, current_user: User):
        c_dict = chat_data.model_dump()
        member_ids = c_dict.pop("member_ids", [])
        
        if current_user.id not in member_ids:
            member_ids.append(current_user.id)
            
        new_chat = Chat(**c_dict)
        new_chat.member_ids = ",".join(member_ids)
        
        db.add(new_chat)
        await db.commit()
        await db.refresh(new_chat)
        
        return {
            "id": new_chat.id,
            "is_group": new_chat.is_group,
            "name": new_chat.name,
            "member_ids": member_ids,
            "created_at": new_chat.created_at
        }

    @staticmethod
    async def get_messages(db: AsyncSession, chat_id: str):
        stmt = select(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at.asc())
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def send_message(db: AsyncSession, chat_id: str, msg_data: MessageCreate, current_user: User):
        if msg_data.chat_id != chat_id:
            raise HTTPException(status_code=400, detail="Path chat ID does not match body")
            
        new_msg = Message(
            chat_id=chat_id,
            sender_id=current_user.id,
            content=msg_data.content,
            attachment_url=msg_data.attachment_url
        )
        db.add(new_msg)
        await db.commit()
        await db.refresh(new_msg)
        return new_msg
