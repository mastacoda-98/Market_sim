import fastapi 
from api.orders import router as orders_router
from api.websockets import router as ws_router

app = fastapi.FastAPI()
app.include_router(orders_router, prefix="/api")
app.include_router(ws_router)