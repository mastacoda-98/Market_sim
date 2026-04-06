from order_book.order_book import OrderBook
from typing import Optional, List
from datetime import datetime
import asyncio
from collections import deque
from datetime import datetime

class Stock:
    def __init__(self, stock_id: str, stock_name: str, symbol: str, price: float = 50, about: Optional[str] = None):
        self.stock_id = stock_id
        self.stock_name = stock_name
        self.symbol = symbol
        self.order_book = OrderBook()
        self.price = price
        self.about = about
        
        self.trades = deque(maxlen=100)
        self.day_high = price
        self.day_low = price
        self.tq = 0.0
        self.q = 0.0
        self.cur_minute = datetime.now()
        
    def getVWAP(self) -> float:
        if self.q == 0:
            return self.price
        return self.tq / self.q
        
    
stocks = {
    "BITM": Stock("1", "BIT Mesra", "BITM", 2000),
    "TECHNO": Stock("2", "Techno Store", "TECHNO", 50),
    "DWNS": Stock("3", "Down South Cafe", "DWNS", 100),
    "DOMINOS": Stock("4", "Dominos", "DOMINOS", 300),
}

class Trade: 
    def __init__(self, symbol: str, price: float, quantity: float, 
                 buy_order_id: str, sell_order_id: str, 
                 buyer_user_id: str, seller_user_id: str, timestamp):
        self.symbol = symbol
        self.price = price
        self.quantity = quantity
        self.buy_order_id = buy_order_id
        self.sell_order_id = sell_order_id
        self.buyer_user_id = buyer_user_id
        self.seller_user_id = seller_user_id
        self.timestamp = timestamp

class MatchingEngine:
    def __init__(self):
        self.stocks = stocks
        self.lock = asyncio.Lock()
        
    async def process_order(self, order) -> Optional[List[Trade]]:
        async with self.lock:
            stock = self.stocks[order.symbol]
            if order.side == "BUY":
                stock.order_book.add_buy_order(order)
            else:
                stock.order_book.add_sell_order(order)
            
            trades = []
            while stock.order_book.can_match():
                best_buy = stock.order_book.best_buy()
                best_sell = stock.order_book.best_sell()
                
                if best_buy is None or best_sell is None:
                    break
                
                trade_price = best_sell.price
                trade_quantity = min(best_buy.quantity, best_sell.quantity)
                
                buyer_user_id = best_buy.order_by
                seller_user_id = best_sell.order_by
                
                best_buy.quantity -= trade_quantity
                best_sell.quantity -= trade_quantity
                if best_buy.quantity == 0:
                    stock.order_book.remove_order(best_buy.order_id)
                if best_sell.quantity == 0:
                    stock.order_book.remove_order(best_sell.order_id)
                
                stock.price = trade_price
                trade = Trade(order.symbol, trade_price, trade_quantity, best_buy.order_id, best_sell.order_id, buyer_user_id, seller_user_id, datetime.now())
                trades.append(trade)
                stock.trades.append(trade)
                stock.day_high = max(stock.day_high, trade_price)
                stock.day_low = min(stock.day_low, trade_price)
                
                now_min = datetime.now().replace(second=0, microsecond=0)
                if stock.cur_minute != now_min:
                    stock.cur_minute = now_min
                    stock.q = 0.0
                    stock.tq = 0.0
                
                stock.q += trade_quantity
                stock.tq += trade_quantity * trade_price
            
            return trades

engine = MatchingEngine()

