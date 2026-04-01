from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import Set, Dict
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.connections: Dict[WebSocket, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections[websocket] = set()
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.connections:
            del self.connections[websocket]
    
    def subscribe(self, websocket: WebSocket, symbol: str):
        if websocket in self.connections:
            self.connections[websocket].add(symbol.upper())
    
    def unsubscribe(self, websocket: WebSocket, symbol: str):
        if websocket in self.connections:
            self.connections[websocket].discard(symbol.upper())

    async def broadcast_to_symbol(self, message: dict, symbol: str):
        """Broadcast only to clients subscribed to this symbol"""
        symbol = symbol.upper()
        for connection, subscribed_symbols in self.connections.items():
            if symbol in subscribed_symbols:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            action = message.get("action")
            symbol = message.get("symbol")
            
            if action == "subscribe" and symbol:
                manager.subscribe(websocket, symbol)
            elif action == "unsubscribe" and symbol:
                manager.unsubscribe(websocket, symbol)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        
        
