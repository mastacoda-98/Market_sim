from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic_schemas.orders import OrderRequest, TradeResponse, OrderResponse
from pydantic_schemas.stock import StockResponse
from pydantic_schemas.user import UserCreateRequest, UserResponse, LoginRequest
from matching_engine.matching_engine import engine, Trade
from order_book.order_book import Order, OrderSide
from api.utils.users import get_user_password_hash
from api.utils.orders import findOrderById, findStockBySymbol, makeOrder
from api.utils.users import create_new_user, get_user_by_email, get_user_by_id, hash_password
from api.websockets import manager
from db.db_connect import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from auth.utils import create_access_token
from auth.dependencies import get_current_user


router = APIRouter()
@router.post("/users")
async def create_user(user_req: UserCreateRequest, db: AsyncSession = Depends(get_db)):
    existing_user = await get_user_by_email(user_req.email, db)
    if existing_user is not None:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = await create_new_user(user_req, db)
    return new_user

@router.get("/users/{id}")
async def get_user(id: str, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_id(id, db)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.post("/login")
async def login(login_req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(login_req.email, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_hash = await get_user_password_hash(login_req.email, db)
    if user_hash is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    hashed = hash_password(login_req.password)
    
    if hashed != user_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(user.email)
    
    response = Response(content='{"access_token":"' + access_token + '","token_type":"bearer"}', media_type="application/json")
    response.set_cookie(key="access_token", value=access_token, httponly=True)
    return response


@router.get("/me")
async def read_current_user(current_user: UserResponse = Depends(get_current_user)):
    return current_user