import fastapi 
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
from api.orders import router as orders_router
from api.websockets import router as ws_router
from api.users import router as users_router
from api.utils.orders import cleanup_old_trades
from db.db_connect import AsyncSessionLocal

scheduler = AsyncIOScheduler()

async def cleanup_trades_task():
    async with AsyncSessionLocal() as db:
        deleted = await cleanup_old_trades(db, days=3)
        print(f"Cleanup task: Deleted {deleted} trades older than 3 days")

@asynccontextmanager
async def lifespan(app: fastapi.FastAPI):
    # Startup
    scheduler.add_job(cleanup_trades_task, "interval", hours=24, id="cleanup_trades")
    scheduler.start()
    print("Scheduled task started: cleanup trades every 24 hours")
    yield
    # Shutdown
    scheduler.shutdown()
    print("Scheduled task stopped")

app = fastapi.FastAPI(lifespan=lifespan)
app.include_router(orders_router, prefix="/api")
app.include_router(ws_router)
app.include_router(users_router, prefix="/api")