import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.core.config import settings
from app.core.db import get_db_session
from app.main import app
from tests.utils.user import create_test_user


@pytest.fixture(name="session")
def session_fixture():
    """Create a test database session"""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client with a test database session"""
    def get_test_session():
        yield session

    app.dependency_overrides[get_db_session] = get_test_session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session):
    """Create a test user"""
    return create_test_user(
        session=session,
        user_id="testuser",
        password="testpass"
    )
