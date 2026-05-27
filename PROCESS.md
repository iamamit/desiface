# Desiface — Development Process

## Branch Strategy

```
main          ← production only, always deployable
  └── develop ← integration branch, all features merge here first
        └── feature/xxx  ← one branch per feature or bug fix
        └── fix/xxx
```

**Never commit directly to `main` or `develop`.**

---

## Step-by-Step Process

### 1. Start a new branch from `develop`
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make your changes locally
```bash
docker compose up -d   # start local dev environment
# make changes, test manually in browser
```

### 3. Run tests on your branch
```bash
# Playwright e2e tests
cd e2e && npx playwright test

# If backend changes, run any relevant unit tests too
```

### 4. Commit and push your branch
```bash
git add .
git commit -m "feat: description" # or "fix: description"
git push origin feature/your-feature-name
```

### 5. Merge into `develop`
```bash
git checkout develop
git merge feature/your-feature-name
git push origin develop
```

### 6. Run full test suite on `develop`
```bash
# Run all Playwright tests against local stack
cd e2e && npx playwright test

# Run 20 bots against local stack
cd ../desiface-agents
DESIFACE_URL=http://localhost:8001 NUM_BOTS=20 RUN_MINUTES=5 python main.py
```

### 7. Deploy `develop` → `main` only when all tests pass
```bash
git checkout main
git merge develop
git push origin main
```

### 8. Deploy to production
```bash
ssh root@178.105.198.35
cd /app && git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### 9. Smoke test production with bots
```bash
cd desiface-agents
DESIFACE_URL=https://desiface.com NUM_BOTS=20 RUN_MINUTES=10 python main.py
```

---

## Commit Message Convention

| Type | When to use |
|------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `test:` | Adding or fixing tests |
| `refactor:` | Code change with no behaviour change |
| `chore:` | Config, dependencies, tooling |

Example: `fix: correct Caddy routing for /posts without trailing slash`

---

## Rules

- Feature branch → always branch from `develop`, never from `main`
- Every merge to `develop` must pass Playwright tests
- Every merge to `main` must pass Playwright tests + bot smoke test
- Database migrations run automatically on deploy (`alembic upgrade head` in Dockerfile)
- If bots find bugs in production → create a `fix/` branch, follow process from step 1
