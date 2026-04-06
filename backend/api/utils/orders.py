from order_book.order_book import OrderBook, Order, OrderSide
import uuid
import datetime
from typing import Optional, List
from matching_engine.matching_engine import engine, Trade
from pydantic_schemas.orders import OrderRequest, TradeResponse, OrderResponse, OrderStatus
from pydantic_schemas.stock import StockResponse
from fastapi import APIRouter, HTTPException
from db.db_connect import get_db
from sqlalchemy import text
from api.websockets import manager

async def validate_seller_balance(user_id: int, symbol: str, quantity: float, db) -> bool:
    result = await db.execute(
        text("SELECT quantity FROM user_portfolio WHERE user_id = :user_id AND stock_symbol = :symbol FOR UPDATE"),
        {"user_id": user_id, "symbol": symbol}
    )
    row = result.fetchone()
    if row is None or row[0] < quantity:
        return False
    
    portfolio_quantity = row[0]
    
    pending_quantity = 0
    stock = engine.stocks.get(symbol)
    if stock:
        for order_id, order in stock.order_book.orders.items():
            if order.order_by == str(user_id) and order.symbol == symbol and order.side == "SELL":
                pending_quantity += order.quantity
    
    total_sell_quantity = pending_quantity + quantity
    if total_sell_quantity > portfolio_quantity:
        return False
    
    return True

async def validate_buyer_balance(user_id: int, price: float, quantity: float, db) -> bool:
    result = await db.execute(
        text("SELECT credits FROM users WHERE id = :user_id FOR UPDATE"),
        {"user_id": user_id}
    )
    row = result.fetchone()
    if row is None or row[0] < (price * quantity):
        return False
    return True

async def cancel_order(order_id: str, user_id: int, db) -> dict:
    order = None
    stock_symbol = None
    
    for stock in engine.stocks.values():
        if order_id in stock.order_book.orders:
            order = stock.order_book.orders[order_id]
            stock_symbol = stock.symbol
            break
    
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if int(order.order_by) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")
    
    remaining_quantity = order.quantity
    order_price = order.price
    
    if order.side == "BUY" or order.side == OrderSide.BUY:
        credit_refund = remaining_quantity * order_price
        await db.execute(
            text("UPDATE users SET credits = credits + :amount WHERE id = :user_id"),
            {"amount": credit_refund, "user_id": user_id}
        )
    
    if stock_symbol:
        engine.stocks[stock_symbol].order_book.remove_order(order_id)
    
    await db.commit()
    
    return {
        "order_id": order_id,
        "symbol": stock_symbol,
        "side": str(order.side),
        "price": order_price,
        "cancelled_quantity": remaining_quantity,
        "message": "Order cancelled successfully"
    }

async def save_trades_to_db(trades: List[Trade], db):
    if not trades:
        return
    
    for trade in trades:
        await db.execute(
            text(
                """
                INSERT INTO trade_history (user_id, side, symbol, price, quantity, timestamp)
                VALUES (:user_id, :side, :symbol, :price, :quantity, :timestamp)
                """
            ),
            {
                "user_id": trade.buyer_user_id,
                "side": "BUY",
                "symbol": trade.symbol,
                "price": trade.price,
                "quantity": trade.quantity,
                "timestamp": trade.timestamp
            }
        )
        
        await db.execute(
            text(
                """
                INSERT INTO trade_history (user_id, side, symbol, price, quantity, timestamp)
                VALUES (:user_id, :side, :symbol, :price, :quantity, :timestamp)
                """
            ),
            {
                "user_id": trade.seller_user_id,
                "side": "SELL",
                "symbol": trade.symbol,
                "price": trade.price,
                "quantity": trade.quantity,
                "timestamp": trade.timestamp
            }
        )

async def update_user_portfolios(trades: List[Trade], db):
    if not trades:
        return
    
    for trade in trades:
        buyer_id = trade.buyer_user_id
        seller_id = trade.seller_user_id
        symbol = trade.symbol
        price = trade.price
        quantity = trade.quantity
        total_cost = price * quantity
        
        result = await db.execute(
            text(
                "SELECT * FROM user_portfolio WHERE user_id = :user_id AND stock_symbol = :symbol"
            ),
            {"user_id": buyer_id, "symbol": symbol}
        )
        existing_buyer = result.fetchone()
        
        if existing_buyer:
            avg_price = existing_buyer[3]
            old_qty = existing_buyer[2]
            new_qty = old_qty + quantity
            new_avg_price = avg_price if new_qty == 0 else ((avg_price * old_qty) + total_cost) / new_qty
            new_invested = existing_buyer[4] + total_cost
            
            await db.execute(
                text(
                    """UPDATE user_portfolio 
                       SET quantity = :qty, average_buy_price = :avg_price, total_invested = :invested, updated_at = NOW()
                       WHERE user_id = :user_id AND stock_symbol = :symbol"""
                ),
                {
                    "qty": new_qty,
                    "avg_price": new_avg_price,
                    "invested": new_invested,
                    "user_id": buyer_id,
                    "symbol": symbol
                }
            )
        else:
            await db.execute(
                text(
                    """INSERT INTO user_portfolio (user_id, stock_symbol, quantity, average_buy_price, total_invested)
                       VALUES (:user_id, :symbol, :qty, :avg_price, :invested)"""
                ),
                {
                    "user_id": buyer_id,
                    "symbol": symbol,
                    "qty": quantity,
                    "avg_price": price,
                    "invested": total_cost
                }
            )
        
        await db.execute(
            text("UPDATE users SET credits = credits - :cost WHERE id = :user_id"),
            {"cost": total_cost, "user_id": buyer_id}
        )
        
        await db.execute(
            text(
                """UPDATE user_portfolio 
                   SET quantity = quantity - :qty, updated_at = NOW()
                   WHERE user_id = :user_id AND stock_symbol = :symbol"""
            ),
            {
                "qty": quantity,
                "user_id": seller_id,
                "symbol": symbol
            }
        )
        
        await db.execute(
            text("UPDATE users SET credits = credits + :earnings WHERE id = :user_id"),
            {"earnings": total_cost, "user_id": seller_id}
        )
    
    await db.commit()

async def broadcast_trades_websocket(trades: List[Trade]):
    if not trades:
        return
    
    for trade in trades:
        trade_data = {
            "action": "trade",
            "symbol": trade.symbol,
            "price": trade.price,
            "quantity": trade.quantity,
            "buy_order_id": trade.buy_order_id,
            "sell_order_id": trade.sell_order_id,
            "buyer_user_id": trade.buyer_user_id,
            "seller_user_id": trade.seller_user_id,
            "timestamp": trade.timestamp.isoformat() if hasattr(trade.timestamp, 'isoformat') else str(trade.timestamp)
        }
        
        await manager.broadcast_to_symbol(trade_data, trade.symbol)

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
                filled_quantity=0,
                pending_quantity=order.quantity,
                status=OrderStatus.PENDING,
                timestamp=order.timestamp,
                order_by=order.order_by
            )
    
    return None

async def makeOrder(order: Order, db) -> OrderResponse:
    if order.side == "BUY" or order.side == OrderSide.BUY:
        is_valid = await validate_buyer_balance(int(order.order_by), order.price, order.quantity, db)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Insufficient credits to place buy order")
    
    trades = await engine.process_order(order)
    
    if trades is None:
        trades = []
    
    filled_quantity = sum(trade.quantity for trade in trades)
    pending_quantity = order.quantity - filled_quantity
    
    if pending_quantity == 0:
        status = OrderStatus.FILLED
    elif filled_quantity == 0:
        status = OrderStatus.PENDING
    else:
        status = OrderStatus.PARTIAL
    
    await save_trades_to_db(trades, db)
    
    await update_user_portfolios(trades, db)
    
    await broadcast_trades_websocket(trades)

    order_response = OrderResponse(
        order_id=order.order_id,
        symbol=order.symbol,
        side=order.side,
        price=order.price,
        quantity=order.quantity,
        filled_quantity=filled_quantity,
        pending_quantity=pending_quantity,
        status=status,
        timestamp=order.timestamp,
        order_by=order.order_by
    )
    
    return order_response


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