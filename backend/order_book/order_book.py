import heapq
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional

class OrderSide(Enum):
    BUY = "BUY"
    SELL = "SELL"

def _default_expires_at():
    return datetime.now() + timedelta(hours=6)

@dataclass
class Order:
    order_id: str
    symbol: str
    side: OrderSide
    price: float
    quantity: float
    order_by: str
    timestamp: datetime = field(default_factory=datetime.now)
    expires_at: datetime = field(default_factory=_default_expires_at)
    
    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at

class OrderBook:
    def __init__(self):
        self.buy_heap = []
        self.sell_heap = []
        self.orders = {}
    
    def add_buy_order(self, order: Order):
        heapq.heappush(self.buy_heap, (-order.price, order.timestamp, order.order_id))
        self.orders[order.order_id] = order
    
    def add_sell_order(self, order: Order):
        heapq.heappush(self.sell_heap, (order.price, order.timestamp, order.order_id))
        self.orders[order.order_id] = order
    
    def _remove_from_heap(self, heap: list, order_id: str):
        heap[:] = [item for item in heap if item[2] != order_id]
        heapq.heapify(heap)
    
    def peek_best_buy(self) -> Optional[Order]:
        if self.buy_heap and self.buy_heap[0][2] in self.orders:
            return self.orders[self.buy_heap[0][2]]
        return None
    
    def peek_best_sell(self) -> Optional[Order]:
        if self.sell_heap and self.sell_heap[0][2] in self.orders:
            return self.orders[self.sell_heap[0][2]]
        return None
    
    def can_match(self) -> bool:
        best_buy = self.peek_best_buy()
        best_sell = self.peek_best_sell()
        return best_buy is not None and best_sell is not None and best_buy.price >= best_sell.price
    
    def remove_order(self, id: str):
        if id in self.orders:
            order = self.orders[id]
            if order.side == OrderSide.BUY:
                self._remove_from_heap(self.buy_heap, id)
            else:
                self._remove_from_heap(self.sell_heap, id)
            del self.orders[id]
    
    def get_expired_orders(self) -> list:
        return [order for order in self.orders.values() if order.is_expired()]
    
    def get_bids(self, limit: int = 10) -> list:
        bids = []
        temp = self.buy_heap.copy()
        while temp and len(bids) < limit:
            price, ts, oid = heapq.heappop(temp)
            if oid in self.orders:
                bids.append({"price": -price, "quantity": self.orders[oid].quantity})
        return bids
    
    def get_asks(self, limit: int = 10) -> list:
        asks = []
        temp = self.sell_heap.copy()
        while temp and len(asks) < limit:
            price, ts, oid = heapq.heappop(temp)
            if oid in self.orders:
                asks.append({"price": price, "quantity": self.orders[oid].quantity})
        return asks
    
    def get_order(self, order_id: str):
        return self.orders.get(order_id)
    
