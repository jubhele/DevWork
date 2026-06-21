"""
AES-256-GCM credential vault — per-tenant portal credential encryption.

Derives a unique encryption key per (tenant, portal) pair using HKDF.
The VAULT_MASTER_SECRET is the only secret that must be kept secure;
it never enters the database.
"""
from __future__ import annotations

import base64
import os

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from api.config import get_settings
from api.debug import log_debug

settings = get_settings()

_NONCE_BYTES = 12   # 96-bit nonce for AES-GCM
_KEY_BYTES = 32     # 256-bit key


def _derive_key(tenant_id: str, portal: str) -> bytes:
    """
    Derive a unique 256-bit key for (tenant_id, portal) using HKDF-SHA256.
    The master secret is the input key material; the info field scopes the key.
    """
    master = settings.vault_master_secret.encode()
    info = f"{tenant_id}:{portal}".encode()

    return HKDF(
        algorithm=hashes.SHA256(),
        length=_KEY_BYTES,
        salt=None,
        info=info,
    ).derive(master)


def encrypt(tenant_id: str, portal: str, plaintext: str) -> tuple[str, str]:
    """
    Encrypt plaintext with the tenant+portal derived key.
    Returns (ciphertext_b64, nonce_b64). Both must be stored; nonce is not secret.
    """
    key = _derive_key(tenant_id, portal)
    nonce = os.urandom(_NONCE_BYTES)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)

    log_debug("VAULT_ENCRYPT", {"tenant_id": tenant_id, "portal": portal})
    return (
        base64.b64encode(ciphertext).decode(),
        base64.b64encode(nonce).decode(),
    )


def decrypt(tenant_id: str, portal: str, ciphertext_b64: str, nonce_b64: str) -> str:
    """
    Decrypt a vault-stored credential.
    Raises ValueError if decryption fails (wrong key or tampered ciphertext).
    """
    key = _derive_key(tenant_id, portal)
    nonce = base64.b64decode(nonce_b64)
    ciphertext = base64.b64decode(ciphertext_b64)
    aesgcm = AESGCM(key)

    try:
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        log_debug("VAULT_DECRYPT", {"tenant_id": tenant_id, "portal": portal, "status": "ok"})
        return plaintext.decode()
    except Exception:
        log_debug("VAULT_DECRYPT_FAIL", {"tenant_id": tenant_id, "portal": portal})
        raise ValueError(f"Vault decryption failed for tenant={tenant_id} portal={portal}")


async def store_credential(
    subscriber_id: str,
    portal: str,
    username: str,
    password: str,
) -> None:
    """Encrypt and persist a subscriber's portal credentials to the DB."""
    from api.db import AsyncSessionLocal
    from sqlalchemy import text

    username_enc, username_nonce = encrypt(subscriber_id, f"{portal}:username", username)
    password_enc, password_nonce = encrypt(subscriber_id, f"{portal}:password", password)

    # Store separate nonces per field by encoding both into the nonce column as JSON
    import json
    nonce_json = json.dumps({"u": username_nonce, "p": password_nonce})

    async with AsyncSessionLocal() as db:
        await db.execute(
            text("""
                INSERT INTO portal_credentials (subscriber_id, portal, username_enc, password_enc, nonce)
                VALUES (:sid, :portal, :uenc, :penc, :nonce)
                ON CONFLICT (subscriber_id, portal)
                DO UPDATE SET username_enc = EXCLUDED.username_enc,
                              password_enc = EXCLUDED.password_enc,
                              nonce = EXCLUDED.nonce
            """),
            {
                "sid": subscriber_id,
                "portal": portal,
                "uenc": username_enc,
                "penc": password_enc,
                "nonce": nonce_json,
            },
        )
        await db.commit()


async def load_credential(subscriber_id: str, portal: str) -> tuple[str, str]:
    """Retrieve and decrypt a subscriber's portal credentials. Returns (username, password)."""
    import json

    from api.db import AsyncSessionLocal
    from sqlalchemy import text

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text("""
                SELECT username_enc, password_enc, nonce
                FROM portal_credentials
                WHERE subscriber_id = :sid AND portal = :portal
            """),
            {"sid": subscriber_id, "portal": portal},
        )
        row = result.mappings().first()

    if not row:
        raise ValueError(f"No credentials stored for subscriber={subscriber_id} portal={portal}")

    nonces = json.loads(row["nonce"])
    username = decrypt(subscriber_id, f"{portal}:username", row["username_enc"], nonces["u"])
    password = decrypt(subscriber_id, f"{portal}:password", row["password_enc"], nonces["p"])
    return username, password
