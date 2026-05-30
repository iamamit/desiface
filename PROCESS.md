# Desiface — Development Process

## Branch Strategy

```
main          ← production only, always deployable
  └── develop ← integration branch, all features merge here first
        └── feature/xxx  ← one branch per feature or bug fix
        └── fix/xxx
```

**Never push directly to `main` or `develop` — PRs only. Both branches are protected on GitHub.**

---

## Test Suite Overview

Three layers of tests keep the codebase safe:

| Layer | Tool | What it tests | Where it runs |
|---|---|---|---|
| **Unit + Integration** | pytest | Backend API behaviour, auth, connections, posts, feedback | CI (every PR) |
| **Type check** | tsc --noEmit | TypeScript correctness across the frontend | CI (every PR) |
| **End-to-end (E2E)** | Playwright | Full user flows in a real browser | CI (every PR) + locally before release |

### GitHub branch protection rules (set once in GitHub Settings)

Go to **Settings → Branches → Branch protection rules** for both `develop` and `main`:

- ✅ Require status checks to pass before merging
  - Required for both branches: `Backend Tests (pytest)`, `Frontend TypeScript Check`
  - Required for `main` only: `Playwright E2E`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

**PRs cannot be merged unless all required CI jobs pass.**

---

## Step-by-Step: Feature or Bug Fix

### 1. Start a branch from `develop`
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
# or: git checkout -b fix/bug-description
```

### 2. Build and develop locally
```bash
docker compose up -d   # start local dev stack (frontend :3001, backend :8000)
# make changes, test manually in browser
```

### 3. Run backend tests before opening a PR

First time only — create the test database:
```bash
docker exec -it desiface-db-1 createdb -U desiface test_desiface
```

Run tests from the `backend/` directory (outside Docker, needs Python 3.12+):
```bash
cd backend
pip install -r requirements.txt   # first time only
pytest tests/ -v
```

Or run inside the Docker container:
```bash
docker compose exec backend pytest tests/ -v
```

All tests must pass. Fix any failures before opening a PR.

### 4. Run the frontend type check

```bash
cd frontend
npx tsc --noEmit
```

### 5. Run Playwright E2E tests locally (required before PRs to `main`)

The stack must be running (`docker compose up -d`):
```bash
cd e2e
npm ci              # first time only
npx playwright install chromium  # first time only
npx playwright test
# or with visual UI:
npx playwright test --ui
```

### 6. Commit and push
```bash
git add <files>
git commit -m "feat: description"   # see commit conventions below
git push origin feature/your-feature-name
```

### 7. Open PR → `develop` on GitHub
- Base branch: `develop`
- Fill in the PR template (what changed, testing checklist)
- CI runs automatically — backend tests + TypeScript check must pass
- Merge once CI is green

---

## Step-by-Step: Releasing to Production

### Checkpoints before merging `develop` → `main`

- [ ] **All backend pytest tests pass** (`pytest tests/ -v`)
- [ ] **Frontend TypeScript check passes** (`npx tsc --noEmit`)
- [ ] **All Playwright E2E tests pass** (`npx playwright test`)
- [ ] Manually tested the changed feature end-to-end in browser
- [ ] If DB schema changed — migration file exists in `backend/alembic/versions/`
- [ ] If new env vars added — `.env.production.example` and `backend/.env.production.example` updated
- [ ] No debug code, no `DEV_MODE`-only shortcuts left in production paths

### 8. Open PR → `main` on GitHub
- Base branch: `main`
- Only `develop` should ever be the source branch
- CI runs all three jobs (pytest + tsc + Playwright) — all must pass before merge is allowed

### 9. Deploy to production (on Hetzner server)

SSH in:
```bash
ssh root@178.105.198.35
```

Then run:
```bash
cd /app
git stash                      # save any local server edits (e.g. Caddyfile tweaks)
git pull origin main
git stash pop
docker compose -f docker-compose.prod.yml --env-file .env.production down
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

**Always pass `--env-file .env.production`** — without it, `DOMAIN`, `POSTGRES_PASSWORD`, and `NEXT_PUBLIC_*` are blank and Caddy crashes.

### 10. Post-deploy smoke test

```bash
docker compose -f docker-compose.prod.yml logs --tail=30 backend
docker compose -f docker-compose.prod.yml logs --tail=30 caddy
```

Check for:
- `Application startup complete` in backend logs
- No errors in Caddy logs
- Visit https://desiface.com and confirm the login page loads
- Sign in with your email and confirm OTP flow works

### 11. If something breaks in production

```bash
# Roll back to previous image (containers only, no code change)
docker compose -f docker-compose.prod.yml --env-file .env.production down
git checkout <previous-commit>
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Or create a `fix/` branch, follow the process from step 1, and deploy again.

---

## Adding New Tests

### Backend (pytest)

Add test files to `backend/tests/`. Each file should:
- Import `auth` helper from `tests.conftest` to get authenticated headers
- Use the `client` fixture for HTTP calls
- Use the `db` fixture if you need direct DB access (e.g., promote a user to admin)

```python
from tests.conftest import auth

def test_something(client):
    h = auth(client, "user@example.com")
    r = client.get("/some-endpoint", headers=h)
    assert r.status_code == 200
```

### Playwright E2E

Add spec files to `e2e/tests/`. Use the `register` / `login` helpers from `helpers.ts`.
Use `makeUser()` to generate unique test users so tests don't conflict.

```typescript
import { expect, test } from "@playwright/test";
import { makeUser, register } from "./helpers";

test("my feature works", async ({ page }) => {
  const user = makeUser();
  await register(page, user);
  // ... test the feature
});
```

---

## Commit Message Convention

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `test:` | Adding or fixing tests |
| `refactor:` | Code change with no behaviour change |
| `chore:` | Config, dependencies, tooling, docs |

Example: `fix: correct Caddy routing for /posts without trailing slash`

---

## Key Facts

- **Local dev:** `docker compose up -d` — frontend on :3001, backend on :8000
- **Production:** `docker compose -f docker-compose.prod.yml` with `--env-file .env.production`
- **DB migrations** run automatically on deploy (`alembic upgrade head` in Dockerfile.prod)
- **Test DB:** `test_desiface` database on the same local PostgreSQL container
- **Uploads** persist via Docker volume `uploads_data` — not lost on redeploy
- **Server IP:** `178.105.198.35` — project lives at `/app`
