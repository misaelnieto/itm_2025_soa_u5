from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select

from app.core.config import settings
from app.core.deps import DbSessionDep, get_current_user, reusable_oauth2
from app.core.security import create_access_token, verify_password
from app.models import AuthToken, User, UserPublic, TokenBlacklist

router = APIRouter(tags=["auth"])


@router.get(
    "/status",
    operation_id="api_status",
    summary="Estatus del API de usuarios",
    description="Reporta el estatus interno del API de usuarios"
)
def api_status(session:DbSessionDep, current_user: Annotated[User, Depends(get_current_user)],):
    return {
        "database_session": session.info,
        "user_info": current_user,
    }

@router.post(
    "/login",
    response_model=AuthToken,
    operation_id="login",
    summary="Obtains an access token",
)
def login_access_token(
    db_session: DbSessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> AuthToken:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Get user by user_id
    statement = select(User).where(User.user_id == form_data.username)
    user = db_session.exec(statement).first()

    if not user:
        raise HTTPException(status_code=400, detail="Incorrect user ID or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect user ID or password")

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(user.id, expires_delta=access_token_expires)

    return AuthToken(access_token=access_token)


@router.post(
    "/test-token",
    response_model=UserPublic,
    operation_id="test_access_token",
    summary="Test access token and return user info",
)
def test_token(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Verifies the access token is correct and returns the related user info.
    """
    return current_user


@router.post("/logout", operation_id="logout", summary="Logouts the user")
def logout(
    session: DbSessionDep,
    current_user: Annotated[User, Depends(get_current_user)],
    token: Annotated[str, Depends(reusable_oauth2)],
) -> dict:
    """
    Logout user by blacklisting their token
    """
    # Add token to blacklist
    blacklisted_token = TokenBlacklist(token=token)
    session.add(blacklisted_token)
    session.commit()

    return {"message": "Successfully logged out"}
