# Desiface — Session Context

> Keep this file updated at the end of every session so the next session starts with full context.
> Last updated: 2026-05-25 (session 2)

---

## What this project is

Desiface is a LinkedIn-style social network for the South Asian diaspora.  
**Stack:** FastAPI (Python) backend · Next.js 14 frontend · PostgreSQL · Caddy reverse proxy (prod)

---

## What's been built and committed

- **Phase 1 MVP** (`f8654cb`):
  - Feed, posts with image uploads, likes, comments, share/repost
  - Connections (send / accept / reject), mutual connection checks
  - Real-time WebSocket chat (DMs)
  - User profiles — avatar upload, bio, visibility settings
  - Privacy controls (public / connections-only profiles)
  - Notifications with unread badge
  - Search (users)
  - Password reset + email verification flow
  - LinkedIn-style blue UI, 3-column layout, icon navbar
- **Playwright e2e tests** covering all Phase 1 features (`47ab22d`)

---

## What's in-progress (uncommitted, on `main`)

### 1. Production deployment setup — new untracked files
| File | Purpose |
|---|---|
| `docker-compose.prod.yml` | Orchestrates Caddy + PostgreSQL + backend + frontend |
| `Caddyfile` | Reverse proxy — routes `/auth/*`, `/users/*`, etc. to backend; rest to frontend; auto HTTPS |
| `backend/Dockerfile.prod` | Python 3.12-slim; runs `alembic upgrade head` then uvicorn (2 workers) |
| `frontend/Dockerfile.prod` | Multi-stage Node build using Next.js standalone output |
| `.env.production.example` | Root template: `DOMAIN`, `POSTGRES_*`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` |
| `backend/.env.production.example` | Backend template: `DATABASE_URL`, `SECRET_KEY`, CORS, SMTP, `DEV_MODE=False` |
| `backend/uploads/` | Local upload dir (prod uses Docker volume `uploads_data`) |

### 2. Production-hardening — modified files not yet committed
- `backend/app/core/config.py` — `DEV_MODE` default → `False`
- `backend/app/main.py` — `slowapi` rate limiter added as middleware
- `backend/app/routers/auth.py` — rate limits: `/register` 10/min, `/login` 20/min, `/forgot-password` 5/min
- `backend/requirements.txt` — added `slowapi==0.1.9`
- `frontend/next.config.ts` — `output: "standalone"` enabled for Docker

### 3. Media URL fix — modified files not yet committed
- `frontend/src/lib/media.ts` *(new)* — `mediaUrl()` helper resolves relative upload paths against `NEXT_PUBLIC_API_URL` instead of hardcoded `localhost:8000`
- `frontend/src/components/PostCard.tsx` — uses `mediaUrl()`
- `frontend/src/components/EditProfileModal.tsx` — uses `mediaUrl()`
- `frontend/src/app/profile/[username]/page.tsx` — uses `mediaUrl()`
- `frontend/src/app/messages/[username]/page.tsx` — uses `NEXT_PUBLIC_WS_URL`

---

## Development Process

See `PROCESS.md` for full details. Summary:

- **Never commit directly to `main` or `develop`**
- Create `feature/xxx` or `fix/xxx` branch from `develop`
- Test on branch → merge to `develop` → run full tests → merge to `main` → deploy
- Every merge to `develop`: run Playwright tests
- Every merge to `main`: run Playwright + bot smoke test (20 bots via `desiface-agents`)

---

## What remains / next steps

- [ ] **Commit everything** — all in-progress changes listed above are done but uncommitted
- [ ] Deploy: fill in `.env.production` files and run `docker compose -f docker-compose.prod.yml up -d --build`
- [ ] Phase 2 features — TBD, discuss with user

## How to run locally (dev)

The app runs via Docker Compose. After system restart:

```bash
cd /Users/amit/project/desiface
docker compose up -d
```

- Frontend → http://localhost:3001
- Backend → http://localhost:8000
- DB → localhost:5432

Note: port 3001 on host maps to container port 3000 (see `docker-compose.yml` line `3001:3000`).
The `ai-film-pipeline` project (separate) uses port 3000 — don't confuse the two.

### Troubleshooting
- If `docker compose` commands hang or go to background in Claude Code terminal, run them directly in your own terminal instead.

---

## Key architecture notes

- Frontend env vars (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`) are **baked at build time** — must be set correctly before `docker build`
- Uploaded files served at `/uploads/*` by FastAPI `StaticFiles`, persisted via Docker volume in prod
- JWT auth; `DEV_MODE=True` returns raw token in API response — **must be `False` in prod**
- CORS origins set in backend `.env` as a JSON array string, e.g. `["https://yourdomain.com"]`
