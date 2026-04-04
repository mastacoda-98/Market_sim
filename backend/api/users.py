from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from pydantic_schemas.orders import OrderRequest, TradeResponse, OrderResponse
from pydantic_schemas.stock import StockResponse
from pydantic_schemas.user import UserCreateRequest, UserResponse
from matching_engine.matching_engine import engine, Trade
from order_book.order_book import Order, OrderSide
import uuid 
from api.utils.orders import findOrderById, findStockBySymbol, makeOrder
from api.utils.users import create_new_user, get_user_by_email, get_user_by_id
from api.utils.orders import findOrderById, findStockBySymbol, makeOrder
from api.websockets import manager
from db.db_connect import get_db
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, AsyncEngine, async_sessionmaker

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

