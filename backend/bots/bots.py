import asyncio
import random
import uuid
from datetime import datetime, timedelta

from matching_engine.matching_engine import engine
from order_book.order_book import OrderSide
from api.websockets import manager
from api.utils.orders import save_trades_to_db, update_user_portfolios
from db.db_connect import AsyncSessionLocal


BOT_USER_IDS = {
    "mm_1": 1001,
    "mm_2": 1002,
    "retail_1": 1003,
    "retail_2": 1004,
    "momentum_1": 1005,
}


class BotOrder:
    def __init__(
        self,
        symbol: str,
        side,
        price: float,
        quantity: int,
        order_by: str,
        timestamp: datetime = None, # type: ignore
        is_expired: datetime = datetime.now() + timedelta(minutes=6),
    ):
        self.order_id = str(uuid.uuid4())
        self.symbol = symbol
        self.side = side
        self.price = round(price, 2)
        self.quantity = quantity
        self.order_by = order_by
        self.created_at = datetime.now()
        self.timestamp = timestamp or self.created_at
        self.expires_at = is_expired

    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at


class BaseBot:
    def __init__(self, bot_id: str, bot_name: str):
        self.bot_id = bot_id
        self.bot_name = bot_name
        self.user_id = BOT_USER_IDS.get(bot_id, 1000)

    async def place_order(self, symbol, side, price, quantity):
        order = BotOrder(
            symbol=symbol,
            side=side,
            price=price,
            quantity=quantity,
            order_by=str(self.user_id),
        )

        trades = await engine.process_order(order)

        if trades:
            async with AsyncSessionLocal() as db:
                try:
                    await save_trades_to_db(trades, db)
                    await update_user_portfolios(trades, db)
                    await db.commit()

                except Exception as e:
                    await db.rollback()
                    print(f"[{self.bot_name}] Error saving trades: {e}")

            for trade in trades:
                await manager.broadcast(
                    trade.symbol,
                    {
                        "symbol": trade.symbol,
                        "price": trade.price,
                        "quantity": trade.quantity,
                        "timestamp": str(trade.timestamp),
                    },
                )

    def calculate_price(self, stock, side):
        vwap = stock.vwap_price or stock.price

        deviation = random.uniform(0.005, 0.02)

        apply_deviation = random.choice([1, -1])

        if apply_deviation == 1:
            deviation += 0.01

        return vwap * (1 + (apply_deviation * deviation))

    async def run(self):
        while True:
            try:
                stock = random.choice(list(engine.stocks.values()))

                side = random.choice(
                    [OrderSide.BUY, OrderSide.SELL]
                )

                price = self.calculate_price(stock, side)

                if manager.has_active_users():
                    quantity = random.randint(1, 5)

                    await self.place_order(
                        stock.symbol,
                        side,
                        price,
                        quantity,
                    )

                    print(
                        f"[{self.bot_name}] active "
                        f"{side.value} "
                        f"{stock.symbol} "
                        f"@ {price:.2f} "
                        f"qty={quantity}"
                    )

                    await asyncio.sleep(2)

                else:
                    quantity = random.randint(1, 3)

                    await self.place_order(
                        stock.symbol,
                        side,
                        price,
                        quantity,
                    )

                    print(
                        f"[{self.bot_name}] passive "
                        f"{side.value} "
                        f"{stock.symbol} "
                        f"@ {price:.2f} "
                        f"qty={quantity}"
                    )

                    for _ in range(random.randint(300, 600)):
                        if manager.has_active_users():
                            break
                        await asyncio.sleep(3)

            except Exception as e:
                print(f"[{self.bot_name}] Exception: {e}")
                await asyncio.sleep(1)


class MarketMakerBot(BaseBot):
    def calculate_price(self, stock, side):
        vwap = stock.vwap_price or stock.price

        # Small spread for tight matching
        spread = random.uniform(0.0005, 0.002)

        if side == OrderSide.BUY:
            return vwap * (1 - spread)

        return vwap * (1 + spread)


class RetailBot(BaseBot):
    def calculate_price(self, stock, side):
        vwap = stock.vwap_price or stock.price

        if side == OrderSide.BUY:
            # Buyers buy higher - pushes prices up
            bias = random.uniform(0.002, 0.010)
            return vwap * (1 + bias)
        
        if random.random() < 0.7:
            return vwap * (1 + random.uniform(0.001, 0.008))
        else:
            return vwap * (1 - random.uniform(0.0005, 0.003))


class MomentumBot(BaseBot):
    def calculate_price(self, stock, side):
        vwap = stock.vwap_price or stock.price

        if side == OrderSide.BUY:
            # Buyers push prices higher
            return vwap * (1 + random.uniform(0.001, 0.008))
        
        # Sellers mostly sell at vwap or slightly higher
        return vwap * (1 + random.uniform(0.0005, 0.010))


async def start_bots():
    bots = [
        MarketMakerBot("mm_1", "MarketMaker Bot 1"),
        MarketMakerBot("mm_2", "MarketMaker Bot 2"),
        RetailBot("retail_1", "Retail Bot 1"),
        RetailBot("retail_2", "Retail Bot 2"),
        MomentumBot("momentum_1", "Momentum Bot 1"),
    ]

    print("[BotManager] Starting bots...")

    tasks = []

    for bot in bots:
        await asyncio.sleep(1)
        tasks.append(asyncio.create_task(bot.run()))

    await asyncio.gather(*tasks)