import json
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.error_log import ErrorLog
from app.routers import admin, auth, connections, feedback, groups, jobs, messages, notifications, posts, programs, search, services, users, ws

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Desiface API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_errors(request: Request, call_next):
    response = await call_next(request)

    if response.status_code >= 400:
        # Read the response body to capture the error detail
        body_bytes = b""
        async for chunk in response.body_iterator:
            body_bytes += chunk

        detail = None
        try:
            parsed = json.loads(body_bytes)
            detail = parsed.get("detail") or str(parsed)
        except Exception:
            detail = body_bytes.decode(errors="replace")[:500] if body_bytes else None

        # Extract user_id from JWT if present (best-effort, no DB call)
        user_id = None
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            from app.core.security import decode_access_token
            user_id = decode_access_token(auth_header[7:])

        ip = request.headers.get("x-forwarded-for", request.client.host if request.client else None)
        query = str(request.query_params) if request.query_params else None

        try:
            db = SessionLocal()
            db.add(ErrorLog(
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                detail=str(detail)[:1000] if detail else None,
                user_id=str(user_id) if user_id else None,
                ip_address=ip,
                query_params=query,
            ))
            db.commit()
            db.close()
        except Exception:
            pass  # never let logging break the response

        from fastapi.responses import Response
        return Response(
            content=body_bytes,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )

    return response


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(connections.router)
app.include_router(notifications.router)
app.include_router(messages.router)
app.include_router(search.router)
app.include_router(services.router)
app.include_router(programs.router)
app.include_router(jobs.router)
app.include_router(groups.router)
app.include_router(ws.router)
app.include_router(feedback.router)
app.include_router(admin.router)

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/app/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/health")
def health_check():
    return {"status": "ok"}
