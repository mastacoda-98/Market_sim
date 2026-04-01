from order_book.order_book import OrderBook
import uuid
import datetime
from typing import Optional, List
from matching_engine.matching_engine import engine
from pydantic_schemas.orders import OrderRequest, TradeResponse, OrderResponse
from pydantic_schemas.stock import StockResponse
from fastapi import APIRouter, HTTPException
from order_book.order_book import Order, OrderSide

def findOrderById(order_id: str) -> Optional[OrderResponse]:
    for stock in engine.stocks.values():
        if order_id in stock.order_book.orders:
            order = stock.order_book.orders[order_id]
            return OrderResponse(
                order_id=order.order_id,
                symbol=order.symbol,
                side=order.side,
                price=order.price,
                quantity=order.quantity,
                timestamp=order.timestamp
            )
    
    return None

async def makeOrder(order: Order) -> tuple:
    trades = await engine.process_order(order)
    
    if trades is None:
        trades = []
    
    trade_responses = []
    for trade in trades:
        trade_responses.append(TradeResponse(
            symbol=trade.symbol,
            price=trade.price,
            quantity=trade.quantity,
            timestamp=trade.timestamp,
            buy_order_id=trade.buy_order_id,
            sell_order_id=trade.sell_order_id
        ))
    
    order_response = OrderResponse(
        order_id=order.order_id,
        symbol=order.symbol,
        side=order.side,
        price=order.price,
        quantity=order.quantity,
        timestamp=order.timestamp
    )
    
    return order_response, trade_responses


def findStockBySymbol(symbol: str) -> Optional[StockResponse]:
    for stock in engine.stocks.values():
        if stock.symbol == symbol:
            return StockResponse(
                stock_id=stock.stock_id,
                stock_name=stock.stock_name,
                symbol=stock.symbol,
                price=stock.price,
                about=stock.about
            )
    
    return None