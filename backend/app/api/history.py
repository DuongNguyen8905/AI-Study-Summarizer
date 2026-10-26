import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.db.models import User, Document, Summary
from app.api.auth import get_current_user

router = APIRouter(tags=["History & Documents"])

class DocumentListItem(BaseModel):
    id: int
    title: str
    source_type: str
    source_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentDetailOut(BaseModel):
    id: int
    title: str
    source_type: str
    source_url: Optional[str]
    raw_text: str
    created_at: datetime
    bullet_points: Optional[str] = None
    keywords: List[str] = []
    mindmap_code: Optional[str] = None


@router.get("/history", response_model=List[DocumentListItem])
def get_user_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return docs


@router.get("/documents/{doc_id}", response_model=DocumentDetailOut)
def get_document_detail(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = (
        db.query(Document)
        .filter(Document.id == doc_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu.")

    keywords = []
    bullet_points = None
    mindmap_code = None

    if doc.summary:
        bullet_points = doc.summary.bullet_points
        mindmap_code = doc.summary.mindmap_code
        if doc.summary.keywords:
            try:
                keywords = json.loads(doc.summary.keywords)
            except Exception:
                keywords = [k.strip() for k in doc.summary.keywords.split(",")]

    return {
        "id": doc.id,
        "title": doc.title,
        "source_type": doc.source_type,
        "source_url": doc.source_url,
        "raw_text": doc.raw_text,
        "created_at": doc.created_at,
        "bullet_points": bullet_points,
        "keywords": keywords,
        "mindmap_code": mindmap_code
    }


@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = (
        db.query(Document)
        .filter(Document.id == doc_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu để xóa.")

    db.delete(doc)
    db.commit()
    return {"message": "Đã xóa bài học thành công.", "id": doc_id}
