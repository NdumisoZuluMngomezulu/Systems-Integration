from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class SearchRequest(BaseModel):
    query: str


class VerseOut(BaseModel):
    ref: str
    text: str
    book: Optional[str] = None
    testament: Optional[str] = None


class SermonOut(BaseModel):
    video_id: str
    title: str
    channel: str
    thumbnail_url: str
    video_url: str


class SearchResponse(BaseModel):
    query: str
    verses: List[VerseOut]
    sermons: List[SermonOut]
    warnings: List[str] = []
    saved_at: datetime


class HistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    query_text: str
    created_at: datetime
