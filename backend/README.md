Bots / Users (will do in last)
↓ (HTTP)
FastAPI API
↓
Matching Engine
↓
Order Book (in-memory)
↓
Trade Events
↓
WebSocket Broadcaster
↓
Next.js Frontend (live UI)

🔹 A. HTTP API (input)
POST /order
Purpose:

- accept order
- validate
- send to matching engine

Flow:

request → validate → engine.process_order() → return "accepted"

Here's your text with proper spacing and breaks for better readability:

---

**🔹 B. Matching Engine (core logic)**  
File: `matching_engine.py`

**Responsibilities:**

- Receive order
- Match with opposite side
- Execute trades
- Update order book
- Emit events

**Core logic:**

```
if best_buy.price >= best_sell.price:
    execute_trade()
```

---

**🔹 C. Order Book (data structure)**  
File: `order_book.py`

**Use:**

- `buy_heap` → max heap
- `sell_heap` → min heap

**Stores:**

- price
- quantity
- timestamp

**Rules:**

- BUY → highest price first
- SELL → lowest price first

---

**🔹 D. Price Logic**

```
price = last executed trade price
```

No formula.

---

**🔹 E. WebSocket System (output)**  
Endpoint: `/ws`  
File: `websocket.py`

**Responsibilities:**

- Accept connections
- Store clients
- Send updates

---

**🔹 F. Broadcaster**  
File: `broadcaster.py`

```
clients = []

async def broadcast(msg):
    for c in clients:
        await c.send_json(msg)
```

---

**📡 4. EVENT SYSTEM (VERY IMPORTANT)**

You send structured events:

**Trade Event**

```
{
    "type": "trade",
    "symbol": "AAPL",
    "price": 101,
    "quantity": 5
}
```

**Order Book Update**

```
{
    "type": "orderbook",
    "symbol": "AAPL",
    "bids": [...],
    "asks": [...]
}
```

**Order Status (optional)**

```
{
    "type": "order_update",
    "order_id": 123,
    "status": "filled"
}
```

---

**🖥️ 5. FRONTEND (Next.js)**

Using Next.js

**WebSocket Client**

```
const ws = new WebSocket("ws://localhost:8000/ws");

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "trade") updateTrades(data);
    if (data.type === "orderbook") updateBook(data);
};
```

**Components**

- **OrderBook** → shows bids/asks
- **TradeFeed** → shows live trades
- **PriceChart** → shows last price over time

---

**🤖 6. BOTS (SIMULATION)**

**Purpose:**

- Simulate users
- Generate activity

**Random Bot**  
Send random buy/sell orders

**Market Maker**

- Buy at (price - 1)
- Sell at (price + 1)

---

**🔁 7. COMPLETE FLOW**

1. Bot/User → POST /order
2. API → validate
3. Engine → process order
4. Matching happens
5. Trade executes (maybe)
6. Order book updates
7. Backend broadcasts:
   - trade
   - orderbook
8. Frontend updates instantly

---

**⚠️ 8. KEY DESIGN RULES**

✔ Matching engine is **NOT a loop** — runs only when order arrives  
✔ **No DB** in matching path — use in-memory structures  
✔ **HTTP vs WebSocket**

- HTTP → input (orders)
- WebSocket → output (events)  
  ✔ **Price is not computed** — price = last trade

---

**🚀 9. MVP (build this first)**

You only need:

- POST /order
- basic matching engine
- order book
- WebSocket broadcast
- simple UI

---

**🔥 10. ADVANCED (later)**

- multiple symbols
- user accounts
- private order updates
- Redis event queue
- performance metrics
- strategy bots

---

**🧠 FINAL MENTAL MODEL**

**System = Event Processor**

**Input:** orders (HTTP)  
**Processing:** matching engine  
**Output:** events (WebSocket)

---

**🎯 ONE LINE SUMMARY**

👉 You are building a system that:  
**takes orders → matches them → generates trades → streams updates live**

GET /stocks/{symbol}/orderbook endpoint - Users can't see bid/ask spreads or pending orders

Shows top 5/10 bids and asks
Transaction Rollback Safety - If update_user_portfolios() fails after save_trades_to_db(), trades are saved but portfolio not updated

Need: try/except with await db.rollback() in makeOrder()
🟡 MEDIUM PRIORITY:

Input Validation - No checks for:

Negative prices
Zero quantity
Minimum lot size
Price decimals (use Decimal not float)
Partial Fill Tracking - When pending order fills later, how do users know? WebSocket order status updates needed

Order Expiration - Orders sit forever. Need: end-of-day cancel or explicit expiry time

Idempotency - If place order request retries, creates duplicate trades

🟢 NICE TO HAVE:

Bids/asks visualization dashboard
Trading fees/commission
Audit logs for all transactions
Rate limiting on endpoints
Market hours validation
