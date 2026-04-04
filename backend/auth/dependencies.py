from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from api.utils.users import get_user_by_id
from db.db_connect import get_db
from jose import JWTError, jwt
from utils import decode_access_token
from api.utils.users import get_user_by_email

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db=Depends(get_db)
):
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_email = payload.get("sub")
    if user_email is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user_by_email(user_email, db)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user