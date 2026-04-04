import fastapi 
from api.orders import router as orders_router
from api.websockets import router as ws_router
from api.users import router as users_router    

app = fastapi.FastAPI()
app.include_router(orders_router, prefix="/api")
app.include_router(ws_router)
app.include_router(users_router, prefix="/api")