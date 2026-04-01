from datetime import datetime
from enum import Enum
from pydantic import BaseModel
from typing import Optional, List
from order_book.order_book import OrderSide


class StockResponse(BaseModel):
    stock_id: str
    stock_name: str
    symbol: str
    price: float
    about: Optional[str] = None