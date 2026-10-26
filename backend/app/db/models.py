from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)  # "youtube" or "file"
    source_url = Column(String(500), nullable=True)   # YouTube URL or filename
    raw_text = Column(Text, nullable=False)           # Extracted text / transcript
    created_at = Column(DateTime, default=utc_now)

    owner = relationship("User", back_populates="documents")
    summary = relationship("Summary", back_populates="document", uselist=False, cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="document", cascade="all, delete-orphan")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), unique=True, nullable=False)
    bullet_points = Column(Text, nullable=False)     # Markdown / Bullet points summary
    keywords = Column(Text, nullable=True)           # Comma-separated or JSON string
    mindmap_code = Column(Text, nullable=True)       # Mermaid js mindmap code
    created_at = Column(DateTime, default=utc_now)

    document = relationship("Document", back_populates="summary")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(50), nullable=False)        # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    document = relationship("Document", back_populates="chat_messages")
    user = relationship("User", back_populates="chat_messages")
