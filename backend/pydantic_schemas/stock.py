from datetime import datetime
from enum import Enum
from pydantic import BaseModel, field_serializer
from typing import Optional, List
from order_book.order_book import OrderSide


class StockResponse(BaseModel):
    stock_id: str
    stock_name: str
    symbol: str
    price: float
    about: Optional[str] = None
    
    @field_serializer('price')
    def serialize_price(self, value: float) -> float:
        return round(value, 2)