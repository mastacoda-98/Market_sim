from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.pydantic_schemas.orders import OrderRequest, TradeResponse, OrderResponse
from backend.pydantic_schemas.stock import StockResponse
from backend.matching_engine.matching_engine import MatchingEngine, Trade
from backend.order_book.order_book import Order, OrderSide
import uuid 
from backend.api.utils.orders import findOrderById, findStockBySymbol, makeOrder



router = APIRouter()

@router.post("/order")
async def place_order(order_req: OrderRequest):
    order_id = str(uuid.uuid4())
    order = Order(order_id, order_req.symbol, order_req.side, order_req.price, order_req.quantity)
    order_response = await makeOrder(order)
    return order_response

@router.get("/order/{order_id}")
async def get_order(order_id: str):
    order_response = findOrderById(order_id)
    if order_response is not None:
        return order_response
    
    raise HTTPException(status_code=404, detail="Order not found")
    

@router.get("/stocks")
async def get_stocks():
    return [{"symbol": stock.symbol, "price": stock.price} for stock in MatchingEngine().stocks.values()]



@router.get("/stock/{symbol}")
async def get_stock(symbol: str):
    stock_response = findStockBySymbol(symbol)
    if stock_response is not None:
        return stock_response
    
    raise HTTPException(status_code=404, detail="Stock not found")

