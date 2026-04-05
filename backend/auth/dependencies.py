from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from db.db_connect import get_db
from auth.utils import decode_access_token
from api.utils.users import get_user_by_email
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login", auto_error=False)


async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db=Depends(get_db)
):
    if not token:
        token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_email = payload.get("sub")
    if user_email is None:
        raise HTTPException(status_code=401, detail="Invalid token format")

    user = await get_user_by_email(user_email, db)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

