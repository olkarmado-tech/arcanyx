from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from admin import _json_value
from auth import get_current_admin
from db import get_db

router = APIRouter(prefix="/admin/daily-quotes", tags=["admin-daily-quotes"])
logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class DailyQuoteDraftIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    author: str = Field(min_length=1, max_length=160)
    sort: int = Field(default=0, ge=-10000, le=10000)

    @field_validator("text", "author", mode="before")
    @classmethod
    def strip_text(cls, value: Any) -> str:
        return str(value or "").strip()


class QuoteReorderIn(BaseModel):
    ids: list[str] = Field(min_length=1, max_length=500)


def _admin_item(doc: dict[str, Any]) -> dict[str, Any]:
    return _json_value(
        {
            "id": doc.get("_id"),
            "text": doc.get("text") or "",
            "author": doc.get("author") or "",
            "sort": int(doc.get("sort") or 0),
            "published": bool(doc.get("published")),
            "createdAt": doc.get("createdAt"),
            "updatedAt": doc.get("updatedAt"),
            "publishedAt": doc.get("publishedAt"),
        }
    )


def _object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId as exc:
        raise HTTPException(status_code=400, detail="Некорректный ID цитаты") from exc


async def _document(quote_id: str) -> dict[str, Any]:
    doc = await get_db().daily_quotes.find_one(
        {"_id": _object_id(quote_id), "deleted": {"$ne": True}}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Цитата не найдена")
    return doc


@router.get("")
async def list_admin_daily_quotes(
    _user: dict[str, Any] = Depends(get_current_admin),
):
    docs = (
        await get_db()
        .daily_quotes.find({"deleted": {"$ne": True}})
        .sort([("sort", 1), ("createdAt", 1)])
        .to_list(length=500)
    )
    return {"items": [_admin_item(doc) for doc in docs]}


@router.post("", status_code=201)
async def create_daily_quote(
    body: DailyQuoteDraftIn,
    user: dict[str, Any] = Depends(get_current_admin),
):
    db = get_db()
    if body.sort == 0:
        last = (
            await db.daily_quotes.find({"deleted": {"$ne": True}})
            .sort([("sort", -1)])
            .limit(1)
            .to_list(length=1)
        )
        sort = int(last[0].get("sort") or 0) + 1 if last else 0
    else:
        sort = body.sort
    now = _utcnow()
    doc = {
        "text": body.text,
        "author": body.author,
        "sort": sort,
        "published": False,
        "deleted": False,
        "createdAt": now,
        "updatedAt": now,
        "createdBy": user["_id"],
        "updatedBy": user["_id"],
    }
    result = await db.daily_quotes.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _admin_item(doc)


@router.put("/{quote_id}")
async def update_daily_quote(
    quote_id: str,
    body: DailyQuoteDraftIn,
    user: dict[str, Any] = Depends(get_current_admin),
):
    doc = await _document(quote_id)
    await get_db().daily_quotes.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "text": body.text,
                "author": body.author,
                "sort": body.sort,
                "updatedAt": _utcnow(),
                "updatedBy": user["_id"],
            }
        },
    )
    return _admin_item(await _document(quote_id))


@router.post("/reorder")
async def reorder_daily_quotes(
    body: QuoteReorderIn,
    user: dict[str, Any] = Depends(get_current_admin),
):
    db = get_db()
    now = _utcnow()
    for position, quote_id in enumerate(body.ids):
        await db.daily_quotes.update_one(
            {"_id": _object_id(quote_id), "deleted": {"$ne": True}},
            {
                "$set": {
                    "sort": position,
                    "updatedAt": now,
                    "updatedBy": user["_id"],
                }
            },
        )
    return {"ok": True}


@router.delete("/{quote_id}")
async def archive_daily_quote(
    quote_id: str,
    user: dict[str, Any] = Depends(get_current_admin),
):
    doc = await _document(quote_id)
    await get_db().daily_quotes.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "published": False,
                "deleted": True,
                "updatedAt": _utcnow(),
                "updatedBy": user["_id"],
            }
        },
    )
    return {"ok": True}


@router.post("/{quote_id}/publish")
async def publish_daily_quote(
    quote_id: str,
    user: dict[str, Any] = Depends(get_current_admin),
):
    doc = await _document(quote_id)
    if not str(doc.get("text") or "").strip() or not str(doc.get("author") or "").strip():
        raise HTTPException(status_code=409, detail="Нельзя опубликовать пустую цитату")
    now = _utcnow()
    await get_db().daily_quotes.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "published": True,
                "publishedAt": now,
                "updatedAt": now,
                "updatedBy": user["_id"],
            }
        },
    )
    return _admin_item(await _document(quote_id))


@router.post("/{quote_id}/unpublish")
async def unpublish_daily_quote(
    quote_id: str,
    user: dict[str, Any] = Depends(get_current_admin),
):
    doc = await _document(quote_id)
    await get_db().daily_quotes.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "published": False,
                "updatedAt": _utcnow(),
                "updatedBy": user["_id"],
            }
        },
    )
    return _admin_item(await _document(quote_id))
