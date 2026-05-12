from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
from collections import defaultdict

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        # symbol -> set of connections
        self.connections: Dict[str, Set[WebSocket]] = {}

        # symbol -> active viewer count
        self.active_viewers = defaultdict(int)

    async def connect(self, symbol: str, websocket: WebSocket):
        symbol = symbol.upper()

        if symbol not in self.connections:
            self.connections[symbol] = set()

        self.connections[symbol].add(websocket)

        self.active_viewers[symbol] += 1

        print(f"{symbol} viewers: {self.active_viewers[symbol]}")

    def disconnect(self, symbol: str, websocket: WebSocket):
        symbol = symbol.upper()

        if symbol in self.connections:
            self.connections[symbol].discard(websocket)

            self.active_viewers[symbol] = max(
                0,
                self.active_viewers[symbol] - 1,
            )

            print(f"{symbol} viewers: {self.active_viewers[symbol]}")

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

    def get_viewers(self, symbol: str) -> int:
        symbol = symbol.upper()

        return self.active_viewers.get(symbol, 0)

    def total_active_viewers(self) -> int:
        return sum(self.active_viewers.values())

    def has_active_users(self) -> bool:
        return self.total_active_viewers() > 0


manager = ConnectionManager()


@router.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await websocket.accept()

    await manager.connect(symbol, websocket)

    try:
        while True:
            # keep connection alive
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(symbol, websocket)