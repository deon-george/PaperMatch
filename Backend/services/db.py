"""MongoDB Atlas persistence: users + comparison history.

The connection is lazy: nothing happens until an endpoint touches the
database, so the app keeps working (anonymously) even when Atlas is
unreachable. Connection attempts are cached and retried on a backoff.
"""
from __future__ import annotations

import time
from datetime import datetime, timezone

from bson import ObjectId
from pymongo import MongoClient

from config import Config

_client = None
_db = None
_available = False
_last_try = 0.0
_RETRY_BACKOFF = 10.0


def _connect():
    """Return (db, available). Connects lazily and caches the client."""
    global _client, _db, _available, _last_try
    if _client is not None:
        return _db, _available
    if time.time() - _last_try < _RETRY_BACKOFF:
        return None, _available
    _last_try = time.time()
    if not Config.MONGODB_URI:
        _available = False
        return None, False
    try:
        client = MongoClient(
            Config.MONGODB_URI,
            serverSelectionTimeoutMS=Config.MONGODB_TIMEOUT_MS,
            connectTimeoutMS=Config.MONGODB_TIMEOUT_MS,
        )
        client.admin.command("ping")
        db = client[Config.MONGODB_DB_NAME]
        db.users.create_index("username", unique=True)
        db.users.create_index("email", unique=True)
        db.comparisons.create_index([("user_id", 1), ("created_at", -1)])
        _client = client
        _db = db
        _available = True
    except Exception as exc:  # noqa: BLE001
        _available = False
        print(f"[db] MongoDB unavailable: {exc}")
    return _db, _available


def available() -> bool:
    return bool(_connect()[1])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _public_user(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "username": doc["username"],
        "email": doc["email"],
    }


# --------------------------------------------------------------------------
# Users
# --------------------------------------------------------------------------

def create_user(username: str, email: str, password_hash: str):
    """Insert a user. Returns (user_dict, error)."""
    db, ok = _connect()
    if not ok:
        return None, "database unavailable"
    doc = {
        "username": username.lower(),
        "email": email.lower(),
        "password_hash": password_hash,
        "created_at": _now(),
    }
    try:
        res = db.users.insert_one(doc)
    except Exception:  # noqa: BLE001  (duplicate key, etc.)
        return None, "username or email already registered"
    return _public_user({"_id": res.inserted_id, **doc}), None


def get_user_by_username(username: str):
    db, ok = _connect()
    if not ok:
        return None
    return db.users.find_one({"username": username.lower()})


def get_user_by_email(email: str):
    db, ok = _connect()
    if not ok:
        return None
    return db.users.find_one({"email": email.lower()})


def get_user(user_id: str):
    db, ok = _connect()
    if not ok:
        return None
    try:
        return db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:  # noqa: BLE001
        return None


# --------------------------------------------------------------------------
# Comparison history
# --------------------------------------------------------------------------

def _entry_to_dict(doc: dict) -> dict:
    created = doc.get("created_at")
    return {
        "id": str(doc["_id"]),
        "files": doc.get("files") or {},
        "report": doc.get("report") or {},
        "date": created.isoformat() if created else None,
    }


def save_comparison(user_id: str, files: dict, report: dict, created_at=None):
    """Store a comparison report. Returns (entry_dict, error)."""
    db, ok = _connect()
    if not ok:
        return None, "database unavailable"
    doc = {
        "user_id": ObjectId(user_id),
        "files": files or {},
        "report": report or {},
        "created_at": created_at or _now(),
    }
    try:
        res = db.comparisons.insert_one(doc)
        doc["_id"] = res.inserted_id
        return _entry_to_dict(doc), None
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


def list_comparisons(user_id: str, limit: int = 50):
    db, ok = _connect()
    if not ok:
        return []
    docs = (
        db.comparisons.find({"user_id": ObjectId(user_id)})
        .sort("created_at", -1)
        .limit(limit)
    )
    return [_entry_to_dict(d) for d in docs]


def get_comparison(user_id: str, comparison_id: str):
    db, ok = _connect()
    if not ok:
        return None
    try:
        doc = db.comparisons.find_one(
            {"_id": ObjectId(comparison_id), "user_id": ObjectId(user_id)}
        )
    except Exception:  # noqa: BLE001
        return None
    return _entry_to_dict(doc) if doc else None


def delete_comparison(user_id: str, comparison_id: str) -> bool:
    db, ok = _connect()
    if not ok:
        return False
    try:
        res = db.comparisons.delete_one(
            {"_id": ObjectId(comparison_id), "user_id": ObjectId(user_id)}
        )
        return res.deleted_count > 0
    except Exception:  # noqa: BLE001
        return False
