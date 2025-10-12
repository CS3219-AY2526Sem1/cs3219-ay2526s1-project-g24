from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.core.database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    author_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
