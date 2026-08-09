"""Password hashing + signed token helpers for PaperMatch auth."""
from __future__ import annotations

import time

import jwt
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    return check_password_hash(password_hash, password)


def create_token(user_id: str) -> str:
    now = int(time.time())
    payload = {
        "uid": user_id,
        "iat": now,
        "exp": now + Config.JWT_EXPIRATION_HOURS * 3600,
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


def decode_token(token: str):
    """Return the token payload, or None when the token is invalid/expired."""
    try:
        return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
