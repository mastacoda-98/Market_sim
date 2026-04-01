from backend.order_book.order_book import OrderBook
from typing import Optional

class Stock:
    def __init__(self, stock_id: str, stock_name: str, symbol: str, price: float = 50):
        self.stock_id = stock_id
        self.stock_name = stock_name
        self.symbol = symbol
        self.order_book = OrderBook()
        self.price = price
        
    
stocks = {
    "BITM": Stock("1", "BIT Mesra", "BITM", 2000),
    "TECHNO": Stock("2", "Techno Store", "TECHNO", 50),
    "DWNS": Stock("3", "Down South Cafe", "DWNS", 100),
    "DOMINOS": Stock("4", "Dominos", "DOMINOS", 300),
}

class Trade: 
    def __init__(self, symbol: str, price: float, quantity: float):
        self.symbol = symbol
        self.price = price
        self.quantity = quantity

class MatchingEngine:
    def __init__(self):
        self.stocks = stocks
        
    async def process_order(self, order) -> Optional[Trade]:
        stock = self.stocks[order.symbol]
        if order.side == "BUY":
            stock.order_book.add_buy_order(order)
        else:
            stock.order_book.add_sell_order(order)
        
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
            return Trade(stock.symbol, trade_price, trade_quantity)

