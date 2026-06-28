import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.services import bible_client, youtube_client

# --- isolated in-memory test database, shared across the whole test run ---
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


async def fake_search_verses(query, limit=5):
    return [
        {
            "ref": "John 3:16",
            "text": "For God so loved the world...",
            "book": "John",
            "testament": "NT",
        }
    ]


async def fake_search_sermons(query, max_results=5):
    return [
        {
            "video_id": "abc123",
            "title": f"A sermon about {query}",
            "channel": "Test Church",
            "thumbnail_url": "https://example.com/thumb.jpg",
            "video_url": "https://www.youtube.com/watch?v=abc123",
        }
    ]


@pytest.fixture(autouse=True)
def patch_external_apis(monkeypatch):
    monkeypatch.setattr(bible_client, "search_verses", fake_search_verses)
    monkeypatch.setattr(youtube_client, "search_sermons", fake_search_sermons)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_search_returns_verses_and_sermons_and_saves_history():
    res = client.post("/api/search", json={"query": "faith"})
    assert res.status_code == 200

    body = res.json()
    assert body["query"] == "faith"
    assert len(body["verses"]) == 1
    assert body["verses"][0]["ref"] == "John 3:16"
    assert len(body["sermons"]) == 1
    assert body["warnings"] == []

    history = client.get("/api/history").json()
    assert any(h["query_text"] == "faith" for h in history)


def test_search_rejects_empty_query():
    res = client.post("/api/search", json={"query": "   "})
    assert res.status_code == 400


def test_history_item_detail_and_delete():
    client.post("/api/search", json={"query": "hope"})

    history = client.get("/api/history").json()
    item = next(h for h in history if h["query_text"] == "hope")

    detail = client.get(f"/api/history/{item['id']}")
    assert detail.status_code == 200
    assert detail.json()["query"] == "hope"

    delete_res = client.delete(f"/api/history/{item['id']}")
    assert delete_res.status_code == 204

    missing = client.get(f"/api/history/{item['id']}")
    assert missing.status_code == 404


def test_search_degrades_gracefully_if_one_api_fails(monkeypatch):
    async def broken_search_verses(query, limit=5):
        raise RuntimeError("simulated outage")

    monkeypatch.setattr(bible_client, "search_verses", broken_search_verses)

    res = client.post("/api/search", json={"query": "peace"})
    assert res.status_code == 200

    body = res.json()
    assert body["verses"] == []
    assert len(body["sermons"]) == 1
    assert "Bible verse service" in body["warnings"][0]
