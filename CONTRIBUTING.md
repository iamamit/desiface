# Contributing — Desiface Branch Workflow

## Branch Strategy

```
feature/* or fix/*
       ↓  (PR)
    develop
       ↓  (PR, only from develop)
      main  →  production (desiface.com)
```

## Rules

### 1. Never push directly to `main` or `develop`
- `main` and `develop` are protected branches.
- All changes must go through a pull request.

### 2. Creating a branch
- Branch off `develop`, never off `main`.
- Naming: `feature/<short-description>` or `fix/<short-description>`

```bash
git checkout develop
git pull origin develop
git checkout -b fix/some-bug
```

### 3. Before opening a PR into `develop`
Run all three test layers locally and confirm they pass:

```bash
# Unit + integration tests (backend)
cd backend && pytest

# Frontend type check
cd frontend && npx tsc --noEmit

# Playwright e2e
cd e2e && npx playwright test
```

Only open the PR if everything is green.

### 4. Merging into `develop`
- Open a PR from your branch → `develop`.
- All tests must pass in CI before merge.
- Squash or merge commit — no force pushes.

### 5. Merging `develop` → `main`
- Only `develop` may be merged into `main`.
- Open a PR from `develop` → `main`.
- Run the full test suite again after the PR is open and confirm nothing is failing.
- After merge to `main`, deploy to production.

## Quick reference

| Action | Command |
|--------|---------|
| Start new work | `git checkout develop && git pull && git checkout -b fix/name` |
| Run backend tests | `cd backend && pytest` |
| Run e2e tests | `cd e2e && npx playwright test` |
| Push branch | `git push origin fix/name` |
| Open PR | GitHub → base: `develop` |
| Release | PR from `develop` → `main` |
