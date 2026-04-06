from datetime import datetime
from enum import Enum
from pydantic import BaseModel
from typing import Optional, List
from order_book.order_book import OrderSide

class OrderStatus(str, Enum):
    FILLED = "FILLED"
    PARTIAL = "PARTIAL"
    PENDING = "PENDING"

class OrderRequest(BaseModel):
    symbol: str
    side: OrderSide
    price: float
    quantity: float
    order_by: str

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
    filled_quantity: float
    pending_quantity: float
    status: OrderStatus
    timestamp: datetime
    order_by: str

    

