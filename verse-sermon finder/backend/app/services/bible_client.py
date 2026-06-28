from typing import Dict, List

import httpx

from app.config import BIBLE_SEARCH_URL


async def search_verses(query: str, limit: int = 5) -> List[Dict]:
    """
    Full-text search across the KJV Bible using a free, no-API-key
    service: https://github.com/JudeaSoftware/kjv-bible-api

    If that service is ever unavailable, a drop-in alternative with a
    similar query-param style is Bible SuperSearch:
    https://api.biblesupersearch.com/api?bible=kjv&search=<query>
    (note: that one nests results differently - see its docs before swapping).
    """
    params = {"q": query, "limit": limit}

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(BIBLE_SEARCH_URL, params=params)
        response.raise_for_status()
        data = response.json()

    return [
        {
            "ref": item.get("ref", ""),
            "text": item.get("text", ""),
            "book": item.get("book"),
            "testament": item.get("testament"),
        }
        for item in data.get("results", [])
    ]