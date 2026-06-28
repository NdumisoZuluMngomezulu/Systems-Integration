from typing import Dict, List

import httpx

from app.config import YOUTUBE_API_KEY

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


async def search_sermons(query: str, max_results: int = 5) -> List[Dict]:
    """
    Searches YouTube for sermon videos related to the query, using the
    official YouTube Data API v3 (search.list).

    Requires a free Google Cloud API key (see README for setup steps).
    Each call costs 100 of your 10,000 free daily quota units, so this
    app caches every result in the database (see models.SavedQuery) and
    only calls this again for a brand-new search, not for replays from
    history.
    """
    if not YOUTUBE_API_KEY:
        raise RuntimeError("YOUTUBE_API_KEY is not configured")

    params = {
        "part": "snippet",
        "q": f"{query} sermon",
        "type": "video",
        "maxResults": max_results,
        "safeSearch": "strict",
        "relevanceLanguage": "en",
        "key": YOUTUBE_API_KEY,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(YOUTUBE_SEARCH_URL, params=params)
        response.raise_for_status()
        data = response.json()

    results: List[Dict] = []
    for item in data.get("items", []):
        video_id = item.get("id", {}).get("videoId")
        if not video_id:
            continue

        snippet = item.get("snippet", {})
        thumbnails = snippet.get("thumbnails", {})
        thumb = thumbnails.get("medium") or thumbnails.get("default") or {}

        results.append(
            {
                "video_id": video_id,
                "title": snippet.get("title", ""),
                "channel": snippet.get("channelTitle", ""),
                "thumbnail_url": thumb.get("url", ""),
                "video_url": f"https://www.youtube.com/watch?v={video_id}",
            }
        )

    return results
