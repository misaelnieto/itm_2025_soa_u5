from fastapi.testclient import TestClient
from sqlmodel import Session

from tests.utils.user import get_test_user_token


def test_login_success(client: TestClient, test_user):
    """Test successful login with correct credentials"""
    login_data = {
        "username": "testuser",
        "password": "testpass",
    }
    response = client.post("/login/access-token", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["access_token"]


def test_login_wrong_password(client: TestClient, test_user):
    """Test login with incorrect password"""
    login_data = {
        "username": "testuser",
        "password": "wrongpass",
    }
    response = client.post("/login/access-token", data=login_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect user ID or password"


def test_login_wrong_user_id(client: TestClient, test_user):
    """Test login with non-existent user ID"""
    login_data = {
        "username": "nonexistent",
        "password": "testpass",
    }
    response = client.post("/login/access-token", data=login_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect user ID or password"


def test_login_inactive_user(client: TestClient, session: Session, test_user):
    """Test login with inactive user"""
    # Deactivate the test user
    test_user.is_active = False
    session.add(test_user)
    session.commit()

    login_data = {
        "username": "testuser",
        "password": "testpass",
    }
    response = client.post("/login/access-token", data=login_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "Inactive user"


def test_token_format(client: TestClient, test_user):
    """Test that the returned token is in the correct format"""
    login_data = {
        "username": "testuser",
        "password": "testpass",
    }
    response = client.post("/login/access-token", data=login_data)
    assert response.status_code == 200
    data = response.json()
    
    # Test token format
    token = data["access_token"]
    assert token.count(".") == 2  # JWT tokens have 3 parts separated by dots
    assert len(token.split(".")[0]) > 0  # Header
    assert len(token.split(".")[1]) > 0  # Payload
    assert len(token.split(".")[2]) > 0  # Signature


def test_logout_success(client: TestClient, test_user):
    """Test successful logout"""
    # First login to get a token
    login_data = {
        "username": "testuser",
        "password": "testpass",
    }
    login_response = client.post("/login/access-token", data=login_data)
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # Try to logout with the token
    headers = {"Authorization": f"Bearer {token}"}
    logout_response = client.post("/login/logout", headers=headers)
    assert logout_response.status_code == 200
    assert logout_response.json()["message"] == "Successfully logged out"
    
    # Verify token is now invalid
    test_response = client.post("/login/test-token", headers=headers)
    assert test_response.status_code == 401
    assert test_response.json()["detail"] == "Token has been invalidated"


def test_logout_without_token(client: TestClient):
    """Test logout without providing a token"""
    response = client.post("/login/logout")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_logout_with_invalid_token(client: TestClient):
    """Test logout with an invalid token"""
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.post("/login/logout", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Could not validate credentials"


def test_logout_twice(client: TestClient, test_user):
    """Test that logging out twice with the same token fails"""
    # First login to get a token
    login_data = {
        "username": "testuser",
        "password": "testpass",
    }
    login_response = client.post("/login/access-token", data=login_data)
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # First logout
    headers = {"Authorization": f"Bearer {token}"}
    logout_response = client.post("/login/logout", headers=headers)
    assert logout_response.status_code == 200
    
    # Second logout with same token should fail
    second_logout_response = client.post("/login/logout", headers=headers)
    assert second_logout_response.status_code == 401
    assert second_logout_response.json()["detail"] == "Token has been invalidated"


