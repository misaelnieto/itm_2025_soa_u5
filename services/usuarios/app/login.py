from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import get_session
from app.core.deps import SessionDep, get_current_user, reusable_oauth2
from app.core.security import create_access_token, verify_password
from app.models import Token, User, UserPublic, TokenBlacklist

router = APIRouter(tags=["login"])


@router.post("/login/access-token", response_model=Token)
def login_access_token(
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Get user by user_id
    statement = select(User).where(User.user_id == form_data.username)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(status_code=400, detail="Incorrect user ID or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect user ID or password")

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        user.id, expires_delta=access_token_expires
    )

    return Token(access_token=access_token)


@router.post("/login/test-token", response_model=UserPublic)
def test_token(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Test access token and return user info
    """
    return current_user


@router.post("/login/logout")
def logout(
    session: SessionDep,
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

