# Verse & Sermon Finder

A mobile app that takes a topic or feeling (e.g. "dealing with anxiety",
"forgiveness") and returns matching Bible verses plus related sermons on
YouTube. Built with Flutter (frontend), a Python REST API (backend), and
SQLite (saved search history).

## Stack

| Layer       | Choice                          | Why |
|-------------|----------------------------------|-----|
| Frontend    | Flutter (Dart)                  | as requested |
| Backend API | Python + **FastAPI**            | async-friendly REST framework with free auto-generated docs at `/docs` |
| Database    | **SQLite** via SQLAlemy ORM      | zero setup; swap `DATABASE_URL` for Postgres/MySQL later, no other code changes needed |
| HTTP client (backend → external APIs) | **httpx** (async) | lets the Bible search and YouTube search run concurrently |
| Env config  | **python-dotenv**                | keeps API keys out of source code |
| Backend tests | **pytest** + FastAPI `TestClient` | mocks both external APIs, uses an in-memory SQLite db |
| Containerization | **Docker** (backend)        | optional, included so you can deploy without installing Python on a server |

## External APIs used

1. **Bible search** — [kjv-bible-api](https://github.com/JudeaSoftware/kjv-bible-api),
   a free, no-key, full-text search API over the King James Bible.
   ⚠️ This is a small hobby-maintained project, not a large company's
   infrastructure — if it's ever down, swap `BIBLE_SEARCH_URL` in `.env`
   for an alternative like [Bible SuperSearch](https://api.biblesupersearch.com/)
   (response shape differs slightly — check `app/services/bible_client.py`).
2. **Sermon suggestions** — [YouTube Data API v3](https://developers.google.com/youtube/v3),
   `search.list` with the query + `" sermon"` appended. Free, but quota-limited:
   **10,000 units/day, and each search costs 100 units** — so about 100
   searches/day per API key. The app saves every result to the database so
   re-opening a past search from history never re-calls YouTube.

## Getting a YouTube API key (free, ~5 minutes)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project.
2. Go to **APIs & Services → Library**, search "YouTube Data API v3", click **Enable**.
3. Go to **APIs & Services → Credentials → Create Credentials → API key**.
4. Copy the key into `backend/.env` as `YOUTUBE_API_KEY`.
5. (Recommended) Click **Edit** on the key and restrict it to the YouTube Data API v3 so it can't be used for anything else if leaked.

## File structure

```
verse-sermon-finder/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, startup
│   │   ├── config.py                # env vars
│   │   ├── database.py              # SQLAlchemy engine/session
│   │   ├── models.py                # SavedQuery table
│   │   ├── schemas.py               # Pydantic request/response models
│   │   ├── routers/search.py        # /api/search, /api/history endpoints
│   │   └── services/
│   │       ├── bible_client.py      # calls the Bible search API
│   │       └── youtube_client.py    # calls YouTube Data API v3
│   ├── tests/test_search.py         # pytest, mocks both external APIs
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── mobile/
│   ├── pubspec.yaml
│   ├── lib/
│   │   ├── main.dart
│   │   ├── models/{verse,sermon,search_result,history_entry}.dart
│   │   ├── services/api_service.dart     # talks to the backend
│   │   ├── screens/{search_screen,history_screen}.dart
│   │   └── widgets/{verse_card,sermon_card}.dart
│   └── test/widget_test.dart
└── README.md
```

## Running the backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then paste in your YOUTUBE_API_KEY
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive API docs (free with FastAPI).

Run the tests (no real API calls made - both external APIs are mocked):
```bash
pytest
```

Run with Docker instead:
```bash
docker build -t verse-sermon-backend .
docker run -p 8000:8000 --env-file .env verse-sermon-backend
```

## Running the mobile app

This repo ships the Dart source (`lib/`) and `pubspec.yaml`, but **not** the
generated native platform folders (`android/`, `ios/`, etc.) — those are
created by the Flutter CLI, which isn't available in the environment this
was built in. To run it:

```bash
cd mobile
flutter create .          # generates android/, ios/, etc. around the existing lib/
flutter pub get
```

Then open `lib/services/api_service.dart` and confirm `baseUrl` matches how
your emulator/device reaches your backend:
- Android emulator → machine running the backend: `http://10.0.2.2:8000/api` (default)
- iOS simulator → machine running the backend: `http://localhost:8000/api`
- Physical device on the same Wi-Fi: `http://<your-computer's-LAN-IP>:8000/api`

```bash
flutter run
```

## API reference

| Method | Endpoint              | Description |
|--------|------------------------|--------------|
| GET    | `/api/health`          | Health check |
| POST   | `/api/search`          | Body: `{"query": "..."}`. Returns verses + sermons, saves to history |
| GET    | `/api/history`         | List of past searches (id, query, timestamp) |
| GET    | `/api/history/{id}`    | Full cached result (verses + sermons) for a past search |
| DELETE | `/api/history/{id}`    | Remove a saved search |

## Known limitations / next steps

- **State management** is plain `setState` for simplicity — fine at this
  size, but consider Provider or Riverpod if you add more screens.
- **No migrations** — tables are created automatically on startup via
  `Base.metadata.create_all()`. Add Alembic if the schema needs to evolve
  without losing data later.
- **No authentication** — anyone who can reach the API can search and see
  all saved history. Fine for a personal/local app; add auth before
  deploying anywhere public.
- The Bible API has no verified theological curation behind its search
  ranking — it's a literal text match, not a "most relevant" match. Treat
  results as a starting point, not a definitive cross-reference.
- The YouTube results are simply "videos matching `<query> sermon>`" —
  there's no vetting of the channel or theological alignment. Worth a
  manual disclaimer in the app if you publish this.
