from backend.order_book.order_book import OrderBook
from typing import Optional, List
from datetime import datetime

class Stock:
    def __init__(self, stock_id: str, stock_name: str, symbol: str, price: float = 50, about: Optional[str] = None):
        self.stock_id = stock_id
        self.stock_name = stock_name
        self.symbol = symbol
        self.order_book = OrderBook()
        self.price = price
        self.about = about
        
    
stocks = {
    "BITM": Stock("1", "BIT Mesra", "BITM", 2000),
    "TECHNO": Stock("2", "Techno Store", "TECHNO", 50),
    "DWNS": Stock("3", "Down South Cafe", "DWNS", 100),
    "DOMINOS": Stock("4", "Dominos", "DOMINOS", 300),
}

class Trade: 
    def __init__(self, symbol: str, price: float, quantity: float, buy_order_id: str, sell_order_id: str, timestamp):
        self.symbol = symbol
        self.price = price
        self.quantity = quantity
        self.buy_order_id = buy_order_id
        self.sell_order_id = sell_order_id 
        self.timestamp = timestamp

class MatchingEngine:
    def __init__(self):
        self.stocks = stocks
        
    async def process_order(self, order) -> Optional[List[Trade]]:
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
            
            best_buy.quantity -= trade_quantity
            best_sell.quantity -= trade_quantity
            if best_buy.quantity == 0:
                stock.order_book.remove_order(best_buy.order_id)
            if best_sell.quantity == 0:
                stock.order_book.remove_order(best_sell.order_id)
            
            stock.price = trade_price
            trades.append(Trade(order.symbol, trade_price, trade_quantity, best_buy.order_id, best_sell.order_id, datetime.now()))
        
        return trades

