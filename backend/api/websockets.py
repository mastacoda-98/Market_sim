from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        # symbol -> set of connections
        self.connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, symbol: str, websocket: WebSocket):
        symbol = symbol.upper()

        if symbol not in self.connections:
            self.connections[symbol] = set()

        self.connections[symbol].add(websocket)

    def disconnect(self, symbol: str, websocket: WebSocket):
        symbol = symbol.upper()

        if symbol in self.connections:
            self.connections[symbol].discard(websocket)

            if not self.connections[symbol]:
                del self.connections[symbol]

    async def broadcast(self, symbol: str, message: dict):
        symbol = symbol.upper()

        if symbol not in self.connections:
            return

        dead = []

        for ws in self.connections[symbol]:
            try:
                await ws.send_json(message)
            except:
                dead.append(ws)

        for ws in dead:
            self.disconnect(symbol, ws)


manager = ConnectionManager()


@router.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await websocket.accept()

    await manager.connect(symbol, websocket)

    try:
        while True:
            # keep connection alive (optional ping from client)
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(symbol, websocket)