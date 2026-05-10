from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from pydantic_schemas.orders import OrderRequest, TradeResponse, OrderResponse
from pydantic_schemas.stock import StockResponse
from pydantic_schemas.user import UserResponse
from matching_engine.matching_engine import engine, Trade
from order_book.order_book import Order, OrderSide
import uuid 
from api.utils.orders import findOrderById, findStockBySymbol, makeOrder, validate_seller_balance, validate_buyer_balance, cancel_order, get_user_pending_orders, get_orderbook_snapshot, get_recent_trades_from_db
from api.websockets import manager
from db.db_connect import get_db
from auth.dependencies import get_current_user

router = APIRouter()

@router.post("/order")
async def place_order(order_req: OrderRequest, current_user: UserResponse = Depends(get_current_user), db = Depends(get_db)):
    user_id = int(current_user.user_id)
    
    if order_req.side == OrderSide.BUY:
        is_valid = await validate_buyer_balance(user_id, order_req.price, order_req.quantity, db)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Insufficient credits to place buy order")
    elif order_req.side == OrderSide.SELL:
        is_valid = await validate_seller_balance(user_id, order_req.symbol, order_req.quantity, db)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Insufficient quantity in portfolio")
    
    order = Order(
        order_id=str(uuid.uuid4()),
        symbol=order_req.symbol,
        side=order_req.side,
        price=order_req.price,
        quantity=order_req.quantity,
        order_by=str(user_id)
    )
    order_response = await makeOrder(order, db)
    
    return order_response

 
@router.get("/order/{order_id}")
async def get_order(order_id: str):
    order_response = findOrderById(order_id)
    if order_response is not None:
        return order_response
    
    raise HTTPException(status_code=404, detail="Order not found")

@router.delete("/order/{order_id}")
async def delete_order(order_id: str, current_user: UserResponse = Depends(get_current_user), db = Depends(get_db)):
    result = await cancel_order(order_id, int(current_user.user_id), db)
    return result

@router.get("/stocks")
async def get_stocks():
    return [{"symbol": stock.symbol, "price": round(stock.price, 2), "stock_name": stock.stock_name} for stock in engine.stocks.values()]


@router.get("/stocks/{symbol}")
async def get_stock(symbol: str):
    stock_response = findStockBySymbol(symbol)
    if stock_response is not None:
        return stock_response
    
    raise HTTPException(status_code=404, detail="Stock not found")

@router.get("/orders")
async def get_user_orders(current_user: UserResponse = Depends(get_current_user)):
    orders = get_user_pending_orders(int(current_user.user_id))
    return {"orders": orders}

@router.get("/orderbook/{symbol}")
async def get_orderbook_snapshot_endpoint(symbol: str):
    snapshot = get_orderbook_snapshot(symbol)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Stock not found")
    return snapshot

@router.get("/trades/{symbol}")
async def get_recent_trades(symbol: str, db = Depends(get_db)):
    stock = engine.stocks.get(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    recent_trades = await get_recent_trades_from_db(symbol, db)
    return {"trades": recent_trades}