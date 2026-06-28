import asyncio
import json
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import bible_client, youtube_client

router = APIRouter()

@router.post("/search", response_model=schemas.SearchResponse)
async def search(payload: schemas.SearchRequest, db: Session = Depends(get_db)):
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query must not be empty")
    
    verses_result, sermons_result = await asyncio.gather(
        bible_client.search_verses(query),
        youtube_client.search_sermons(query),
        return_exceptions=True,
    )

    warnings: List[str] = []

    verses = [] if isinstance(verses_result, Exception) else verses_result
    if isinstance(verses_result, Exception):
        warnings.append("Could not reach the Bible verse")
    
    sermons = [] if isinstance(sermons_result, Exception) else sermons_result
    if isinstance(sermons_result, Exception):
        warnings.append("Could not reach YouTube")
    
    response = schemas.SearchResponse(
        query=query,
        verses=[schemas.VerseOut(**v) for v in verses],
        sermons=[schemas.SermonOut(**s) for s in sermons],
        warnings = warnings,
        saved_at=datetime.utcnow(),
    )

    saved = models.SavedQuery(
        query_text=query,
        results_json=response.model_dump_json(),
    )
    db.add(saved)
    db.commit()

    return response
