from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from db import get_db, mongo_configured

logger = logging.getLogger(__name__)

router = APIRouter(tags=["daily-quotes"])

ROOT = Path(__file__).parent
SEED_PATH = ROOT / "data" / "daily_quotes.json"
CATALOG_CACHE_CONTROL = "no-store"


class DailyQuoteOut(BaseModel):
    text: str
    author: str


class DailyQuoteListOut(BaseModel):
    items: list[DailyQuoteOut]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def read_daily_quote_seed() -> list[dict[str, str]]:
    raw = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("daily_quotes.json must be a JSON array")
    rows: list[dict[str, str]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        text = str(item.get("text") or "").strip()
        author = str(item.get("author") or "").strip()
        if text and author:
            rows.append({"text": text, "author": author})
    return rows


def _to_out(doc: dict[str, Any]) -> DailyQuoteOut:
    return DailyQuoteOut(
        text=str(doc.get("text") or ""),
        author=str(doc.get("author") or ""),
    )


async def _published_documents() -> Optional[list[dict[str, Any]]]:
    if not mongo_configured():
        return None
    try:
        return (
            await get_db()
            .daily_quotes.find({"published": True, "deleted": {"$ne": True}})
            .sort([("sort", 1), ("createdAt", 1)])
            .to_list(length=500)
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to read daily quotes from MongoDB")
        return None


async def catalog_documents() -> list[dict[str, Any]]:
    if mongo_configured():
        docs = await _published_documents()
        if docs is None:
            raise HTTPException(status_code=503, detail="Каталог временно недоступен")
        return docs
    return [{"text": row["text"], "author": row["author"]} for row in read_daily_quote_seed()]


async def seed_daily_quotes() -> None:
    if not mongo_configured():
        return
    db = get_db()
    rows = read_daily_quote_seed()
    for index, row in enumerate(rows):
        now = _utcnow()
        insert_doc = {
            **row,
            "sort": index,
            "published": True,
            "deleted": False,
            "createdAt": now,
            "updatedAt": now,
        }
        try:
            await db.daily_quotes.update_one(
                {"text": row["text"], "author": row["author"]},
                {"$setOnInsert": insert_doc},
                upsert=True,
            )
        except DuplicateKeyError:
            continue
    logger.info("Daily quotes seeded | count=%s", len(rows))


@router.get("/daily-quotes", response_model=DailyQuoteListOut)
async def list_daily_quotes(response: Response):
    response.headers["Cache-Control"] = CATALOG_CACHE_CONTROL
    docs = await catalog_documents()
    return DailyQuoteListOut(items=[_to_out(doc) for doc in docs])
