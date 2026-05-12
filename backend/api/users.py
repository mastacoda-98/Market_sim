from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from pydantic_schemas.orders import OrderRequest, TradeResponse, OrderResponse
from pydantic_schemas.stock import StockResponse
from pydantic_schemas.user import UserCreateRequest, UserResponse, LoginRequest, AddCreditsRequest
from matching_engine.matching_engine import engine, Trade
from order_book.order_book import Order, OrderSide
from api.utils.users import get_user_password_hash, get_user_portfolio, get_user_trades, add_stocks_to_user
from api.utils.orders import findOrderById, findStockBySymbol, makeOrder
from api.utils.users import create_new_user, get_user_by_email, get_user_by_id, hash_password
from api.websockets import manager
from db.db_connect import get_db
from auth.utils import create_access_token
from auth.dependencies import get_current_user


class AddStockRequest(BaseModel):
    user_id: int
    symbol: str
    quantity: float


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
    response.set_cookie(key="access_token", value=access_token, httponly=True, samesite="none", secure=True)
    return response

@router.post("/logout")
async def logout():
    response = Response(content='{"message":"Logged out successfully"}', media_type="application/json")
    response.delete_cookie(key="access_token", samesite="none", secure=True)
    return response


@router.get("/me")
async def read_current_user(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@router.post("/me/credits/add")
async def add_credits(credits_req: AddCreditsRequest, current_user: UserResponse = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if credits_req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    await db.execute(
        text("UPDATE users SET credits = credits + :amount WHERE email = :email"),
        {"amount": credits_req.amount, "email": current_user.email}
    )
    await db.commit()
    
    user = await get_user_by_email(current_user.email, db)
    return user

@router.get("/me/portfolio")
async def get_portfolio(current_user: UserResponse = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    portfolio = await get_user_portfolio(int(current_user.user_id), db)
    return {"portfolio": portfolio}

@router.get("/me/trades")
async def get_trades(current_user: UserResponse = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    trades = await get_user_trades(int(current_user.user_id), db)
    return {"trades": trades}

@router.post("/admin/stocks/add")
async def add_stock_to_user(stock_req: AddStockRequest, db: AsyncSession = Depends(get_db)):
    result = await add_stocks_to_user(stock_req.user_id, stock_req.symbol, stock_req.quantity, db)
    return result