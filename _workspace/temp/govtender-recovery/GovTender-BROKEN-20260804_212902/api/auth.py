import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from api.config import get_settings

settings = get_settings()
bearer = HTTPBearer()

_ALGORITHM = "HS256"
_TOKEN_EXPIRY_HOURS = 24


def create_token(subscriber_id: str, plan_tier: str) -> str:
    payload = {
        "sub": subscriber_id,
        "tier": plan_tier,
        "exp": datetime.now(timezone.utc) + timedelta(hours=_TOKEN_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.app_jwt_secret, algorithm=_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.app_jwt_secret, algorithms=[_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_subscriber(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    return decode_token(credentials.credentials)


def require_tier(minimum_tier: str):
    """Dependency factory: enforces minimum subscription tier."""
    _tier_rank = {"scout": 1, "respond": 2, "command": 3}

    def _check(subscriber: dict = Depends(get_current_subscriber)) -> dict:
        tier = subscriber.get("tier", "scout")
        if _tier_rank.get(tier, 0) < _tier_rank.get(minimum_tier, 99):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires the '{minimum_tier}' plan or higher",
            )
        return subscriber

    return _check
