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

@router.get("/history", response_model=List[schemas.HistoryItem])
def get_history(db: Session = Depends(get_db)):
    rows = (
        db.query(models.SavedQuery)
        .order_by(models.SavedQuery.created_at.desc())
        .limit(50)
        .all()
    )
    return rows


@router.get("/history/{item_id}", response_model=schemas.SearchResponse)
def get_history_item(item_id: int, db: Session = Depends(get_db)):
    row = db.query(models.SavedQuery).filter(models.SavedQuery.id == item_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Saved query not found")
    return json.loads(row.results_json)


@router.delete("/history/{item_id}", status_code=204)
def delete_history_item(item_id: int, db: Session = Depends(get_db)):
    row = db.query(models.SavedQuery).filter(models.SavedQuery.id == item_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Saved query not found")
    db.delete(row)
    db.commit()
    return None
