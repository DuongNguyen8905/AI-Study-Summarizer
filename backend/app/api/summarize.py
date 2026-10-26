import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.db.database import get_db
from app.db.models import User, Document, Summary
from app.api.auth import get_current_user
from app.services.youtube_service import extract_video_id, get_video_title, get_youtube_transcript
from app.services.document_service import extract_text_from_pdf, extract_text_from_docx
from app.services.ai_service import generate_study_summary, generate_study_summary_from_youtube_direct

router = APIRouter(prefix="/summarize", tags=["Summarization"])

class YouTubeSummarizeRequest(BaseModel):
    url: str

class SummaryResponse(BaseModel):
    document_id: int
    title: str
    source_type: str
    source_url: Optional[str]
    bullet_points: str
    keywords: List[str]
    mindmap_code: str


@router.post("/youtube", response_model=SummaryResponse)
async def summarize_youtube(
    payload: YouTubeSummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        video_id = extract_video_id(payload.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 1. Fetch title
    title = await get_video_title(video_id)
    
    # 2. Try fetching transcript
    raw_text = None
    try:
        raw_text = get_youtube_transcript(video_id)
    except Exception:
        raw_text = None

    # 3. Call AI Summarization (Hybrid: Transcript or Direct Multimodal)
    try:
        if raw_text and len(raw_text) > 50:
            ai_result = generate_study_summary(raw_text, title)
        else:
            # Fallback to direct Gemini Multimodal YouTube processing
            clean_youtube_url = f"https://www.youtube.com/watch?v={video_id}"
            ai_result = generate_study_summary_from_youtube_direct(clean_youtube_url, title)
            raw_text = ai_result.get("bullet_points", f"Bài giảng YouTube: {title}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    keywords_list = ai_result.get("keywords", [])
    keywords_str = json.dumps(keywords_list, ensure_ascii=False)

    # 4. Save to database
    doc = Document(
        user_id=current_user.id,
        title=title,
        source_type="youtube",
        source_url=payload.url,
        raw_text=raw_text
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    summ = Summary(
        document_id=doc.id,
        bullet_points=ai_result.get("bullet_points", ""),
        keywords=keywords_str,
        mindmap_code=ai_result.get("mindmap_code", "")
    )
    db.add(summ)
    db.commit()

    return {
        "document_id": doc.id,
        "title": doc.title,
        "source_type": doc.source_type,
        "source_url": doc.source_url,
        "bullet_points": summ.bullet_points,
        "keywords": keywords_list,
        "mindmap_code": summ.mindmap_code
    }


@router.post("/document", response_model=SummaryResponse)
async def summarize_uploaded_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    filename = file.filename or "Tai_lieu_hoc_tap"
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    if ext not in ["pdf", "docx", "doc", "txt"]:
        raise HTTPException(status_code=400, detail="Hệ thống chỉ hỗ trợ file .pdf, .docx hoặc .txt")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="File tải lên không có nội dung.")

    try:
        if ext == "pdf":
            raw_text = extract_text_from_pdf(file_bytes)
        elif ext in ["docx", "doc"]:
            raw_text = extract_text_from_docx(file_bytes)
        else:
            raw_text = file_bytes.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    title = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

    try:
        ai_result = generate_study_summary(raw_text, title)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    keywords_list = ai_result.get("keywords", [])
    keywords_str = json.dumps(keywords_list, ensure_ascii=False)

    doc = Document(
        user_id=current_user.id,
        title=title,
        source_type="file",
        source_url=filename,
        raw_text=raw_text
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    summ = Summary(
        document_id=doc.id,
        bullet_points=ai_result.get("bullet_points", ""),
        keywords=keywords_str,
        mindmap_code=ai_result.get("mindmap_code", "")
    )
    db.add(summ)
    db.commit()

    return {
        "document_id": doc.id,
        "title": doc.title,
        "source_type": doc.source_type,
        "source_url": doc.source_url,
        "bullet_points": summ.bullet_points,
        "keywords": keywords_list,
        "mindmap_code": summ.mindmap_code
    }
