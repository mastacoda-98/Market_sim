from datetime import datetime
from enum import Enum
from pydantic import BaseModel
from typing import Optional, List
from order_book.order_book import OrderSide

class UserCreateRequest(BaseModel):
    first_name: str
    last_name: str
    password: str
    email: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AddCreditsRequest(BaseModel):
    amount: float
    
class UserResponse(BaseModel):
    user_id: str
    first_name: str
    last_name: str
    email: str
    created_at: datetime
    updated_at: datetime
    credits: float
    
class UserPortfolioItem(BaseModel):
    stock_symbol: str
    quantity: float
    average_price: float
    
class UserPortfolioResponse(BaseModel):
    user_id: str
    holdings: List[UserPortfolioItem]
    
class UserTradeHistoryItem(BaseModel):
    symbol: str
    buy_order_id: Optional[str]
    sell_order_id: Optional[str]
    price: float
    quantity: float
    timestamp: datetime
    
class UserTradeHistoryResponse(BaseModel):
    user_id: str
    trades: List[UserTradeHistoryItem]
    
