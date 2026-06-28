from datetime import datetime

from sqlalchemy import Column, Datetime, Integer, String, Text

from app.database import Base

class SavedQuery(Base):
    __tablename__ = "saved_queries"
    id = Column(Integer, primary_key=True, index=True)
    query_text = Column(String(500), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    results_json = Column(Text, nullable=False)