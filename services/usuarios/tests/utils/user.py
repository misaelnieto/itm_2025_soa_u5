from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.security import get_password_hash
from app.models import User


def create_test_user(session: Session, user_id: str, password: str) -> User:
    """Create a test user in the database"""
    user = User(
        user_id=user_id,
        hashed_password=get_password_hash(password),
        is_active=True
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def get_test_user_token(client: TestClient, user_id: str, password: str) -> dict[str, str]:
    """Get authentication token for a test user"""
    login_data = {
        "username": user_id,
        "password": password,
    }
    response = client.post("/api/v1/login/access-token", data=login_data)
    tokens = response.json()
    auth_token = tokens["access_token"]
    return {"Authorization": f"Bearer {auth_token}"} 