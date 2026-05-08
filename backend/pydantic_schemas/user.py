from datetime import datetime
from enum import Enum
from pydantic import BaseModel, field_serializer
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
    
    @field_serializer('credits')
    def serialize_credits(self, value: float) -> float:
        return round(value, 2)
    
class UserPortfolioItem(BaseModel):
    stock_symbol: str
    quantity: float
    average_price: float
    
    @field_serializer('quantity', 'average_price')
    def serialize_decimals(self, value: float) -> float:
        return round(value, 2)
    
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
    
    @field_serializer('price', 'quantity')
    def serialize_decimals(self, value: float) -> float:
        return round(value, 2)
    
class UserTradeHistoryResponse(BaseModel):
    user_id: str
    trades: List[UserTradeHistoryItem]
    
