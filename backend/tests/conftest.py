"""
Pytest configuration and shared fixtures.

Requires a PostgreSQL test database. Create it once:
  docker exec -it desiface-db-1 createdb -U desiface test_desiface

Or set TEST_DATABASE_URL env var to point to any PostgreSQL instance.
In CI, a postgres service container is used automatically.
"""
import os
import tempfile

# Must be set before any app module is imported so pydantic-settings picks them up
_uploads_tmp = tempfile.mkdtemp()
os.environ.setdefault("TEST_DATABASE_URL", "postgresql://desiface:desiface@localhost:5432/test_desiface")
os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]
os.environ["DEV_MODE"] = "True"
os.environ["SECRET_KEY"] = "test-secret-key-do-not-use-in-production"
os.environ["UPLOAD_DIR"] = _uploads_tmp

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

_engine = create_engine(os.environ["DATABASE_URL"])
_TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(_engine)
    yield
    Base.metadata.drop_all(_engine)


@pytest.fixture()
def db():
    session = _TestingSession()
    yield session
    session.close()


@pytest.fixture(autouse=True)
def clean_tables():
    yield
    with _engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


@pytest.fixture()
def client(db):
    def _get_db_override():
        yield db

    app.dependency_overrides[get_db] = _get_db_override
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


# ── auth helpers ──────────────────────────────────────────────────────────────

def obtain_token(client: TestClient, email: str) -> str:
    """Request OTP (returned in dev_otp) then verify to get a JWT."""
    r = client.post("/auth/request-otp", json={"email": email})
    assert r.status_code == 200, r.text
    otp = r.json()["dev_otp"]
    r2 = client.post("/auth/verify-otp", json={"email": email, "code": otp})
    assert r2.status_code == 200, r2.text
    return r2.json()["access_token"]


def auth(client: TestClient, email: str) -> dict:
    """Return Authorization header dict for the given email."""
    return {"Authorization": f"Bearer {obtain_token(client, email)}"}
