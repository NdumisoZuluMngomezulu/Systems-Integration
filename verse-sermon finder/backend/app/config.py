import os

from dotenv import load_dotenv

load_dotenv()

# YouTube Data API v3 key - get one free from Google Cloud Console.
# See README.md for step-by-step instructions.
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

# SQLite by default so the project runs with zero extra setup.
# Swap to Postgres/MySQL later by changing this URL - SQLAlchemy
# handles the rest, no other code needs to change.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./bible_app.db")

# Free, no-key, full-text search across the KJV Bible.
# https://github.com/JudeaSoftware/kjv-bible-api
# NOTE: this is a small hobby-maintained API. If it's ever down, swap in
# https://api.biblesupersearch.com/api?search= as a drop-in alternative -
# see bible_client.py.
BIBLE_SEARCH_URL = os.getenv(
    "BIBLE_SEARCH_URL", "https://judeasoftware.com/api/kjv/search.php"
)
