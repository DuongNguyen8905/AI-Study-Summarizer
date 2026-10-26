from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.db.models import User, Document, ChatMessage
from app.api.auth import get_current_user
from app.services.ai_service import answer_document_query

router = APIRouter(prefix="/chat", tags=["Chat with Document"])

class ChatRequest(BaseModel):
    message: str

class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    reply: str
    user_message_id: int
    bot_message_id: int


@router.get("/{doc_id}", response_model=List[ChatMessageOut])
def get_chat_history(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu học tập.")
    
    messages = db.query(ChatMessage).filter(ChatMessage.document_id == doc_id).order_by(ChatMessage.created_at.asc()).all()
    return messages


@router.post("/{doc_id}", response_model=ChatResponse)
def send_chat_message(
    doc_id: int,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu học tập.")

    query_text = payload.message.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="Nội dung câu hỏi không được để trống.")

    # 1. Fetch recent history
    past_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.document_id == doc_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    history_list = [{"role": m.role, "content": m.content} for m in past_messages]

    # 2. Call AI service
    try:
        reply_text = answer_document_query(doc.raw_text, query_text, history_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi trả lời: {str(e)}")

    # 3. Save User message
    user_msg = ChatMessage(
        document_id=doc_id,
        user_id=current_user.id,
        role="user",
        content=query_text
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # 4. Save Bot message
    bot_msg = ChatMessage(
        document_id=doc_id,
        user_id=current_user.id,
        role="assistant",
        content=reply_text
    )
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)

    return {
        "reply": reply_text,
        "user_message_id": user_msg.id,
        "bot_message_id": bot_msg.id
    }
