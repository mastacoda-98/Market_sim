from datetime import datetime
from enum import Enum
from pydantic import BaseModel
from typing import Optional, List
from order_book.order_book import OrderSide

class OrderRequest(BaseModel):
    symbol: str
    side: OrderSide
    price: float
    quantity: float

class TradeResponse(BaseModel):
    symbol: str
    price: float
    quantity: float
    timestamp: datetime
    buy_order_id: str
    sell_order_id: str
    
class OrderResponse(BaseModel):
    order_id: str
    symbol: str
    side: OrderSide
    price: float
    quantity: float
    timestamp: datetime

    

