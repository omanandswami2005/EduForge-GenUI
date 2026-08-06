"""Firebase Auth middleware for JWT verification."""
import asyncio
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, credentials
import os
import json

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        cred = credentials.Certificate(json.loads(sa_json))
        firebase_admin.initialize_app(cred)
    elif os.environ.get("FIREBASE_AUTH_EMULATOR_HOST"):
        # Emulator needs no real credentials — the Admin SDK routes verify_id_token
        # calls to FIREBASE_AUTH_EMULATOR_HOST automatically once it's set.
        project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "demo-eduforge")
        firebase_admin.initialize_app(options={"projectId": project_id})
    else:
        try:
            firebase_admin.initialize_app()
        except Exception:
            # No credentials and no emulator configured — auth calls below will
            # raise until FIREBASE_AUTH_EMULATOR_HOST or a service account is set.
            pass

security = HTTPBearer(auto_error=False)


async def verify_firebase_token(
    creds: HTTPAuthorizationCredentials | None = Security(security),
) -> dict:
    """Verify Firebase ID token and return decoded claims."""
    if not creds:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        # Run the blocking SDK call in a thread pool so it doesn't stall the event loop
        decoded = await asyncio.to_thread(auth.verify_id_token, creds.credentials)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def optional_auth(
    creds: HTTPAuthorizationCredentials | None = Security(security),
) -> dict | None:
    """Optional auth — returns None if no token provided."""
    if not creds:
        return None
    try:
        return await asyncio.to_thread(auth.verify_id_token, creds.credentials)
    except Exception:
        return None
