from datetime import datetime
from enum import Enum
from pydantic import BaseModel, field_serializer
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

class TradeResponse(BaseModel):
    symbol: str
    price: float
    quantity: float
    timestamp: datetime
    buyer_id: int
    seller_id: int
    
    @field_serializer('price', 'quantity')
    def serialize_decimals(self, value: float) -> float:
        return round(value, 2)
    
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
    
    @field_serializer('price', 'quantity', 'filled_quantity', 'pending_quantity')
    def serialize_decimals(self, value: float) -> float:
        return round(value, 2)

    

