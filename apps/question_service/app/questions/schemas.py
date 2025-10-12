from pydantic import BaseModel
from datetime import datetime

class QuestionBase(BaseModel):
    title: str
    body: str
    author_id: int

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
