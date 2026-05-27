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

## Step-by-Step: Feature or Bug Fix

### 1. Start a branch from `develop`
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
# or: git checkout -b fix/bug-description
```

### 2. Build and test locally
```bash
docker compose up -d   # start local dev stack (frontend :3001, backend :8000)
# make changes, test manually in browser
```

### 3. Run all tests before opening a PR
```bash
# Frontend type check
cd frontend && npx tsc --noEmit

# Playwright e2e tests
cd e2e && npx playwright test
```
All must pass. Fix any failures before continuing.

### 4. Commit and push
```bash
git add <files>
git commit -m "feat: description"   # see commit conventions below
git push origin feature/your-feature-name
```

### 5. Open PR → `develop` on GitHub
- Base branch: `develop`
- Fill in the PR template (what changed, testing checklist)
- Merge once tests pass

---

## Step-by-Step: Releasing to Production

### Checkpoints before merging `develop` → `main`

- [ ] All Playwright tests pass on `develop` locally
- [ ] Manually tested the changed feature end-to-end in browser
- [ ] No TypeScript errors (`cd frontend && npx tsc --noEmit`)
- [ ] If DB schema changed — migration file exists in `backend/alembic/versions/`
- [ ] If new env vars added — `.env.production.example` and `backend/.env.production.example` updated
- [ ] No debug code, no `DEV_MODE`-only shortcuts left in production paths

### 6. Open PR → `main` on GitHub
- Base branch: `main`
- Only `develop` should ever be the source branch

### 7. Deploy to production (on Hetzner server)

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

### 8. Post-deploy smoke test

```bash
docker compose -f docker-compose.prod.yml logs --tail=30 backend
docker compose -f docker-compose.prod.yml logs --tail=30 caddy
```

Check for:
- `Application startup complete` in backend logs
- No errors in Caddy logs
- Visit https://desiface.com and confirm the login page loads
- Sign in with your email and confirm OTP flow works

### 9. If something breaks in production

```bash
# Roll back to previous image (containers only, no code change)
docker compose -f docker-compose.prod.yml --env-file .env.production down
git checkout <previous-commit>
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Or create a `fix/` branch, follow the process from step 1, and deploy again.

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
- **Uploads** persist via Docker volume `uploads_data` — not lost on redeploy
- **Server IP:** `178.105.198.35` — project lives at `/app`
