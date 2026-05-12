# tradeSim

**Made by Gurpreet Singh**

A real-time stock market simulation platform where users can trade stocks, execute orders, and compete in a live trading environment with automated bots and live order matching.

## About

TradeSim. is a full-stack trading simulation platform that provides a realistic stock market experience. Users can create accounts, place buy/sell orders, track their portfolio, and see real-time order matching. The backend uses a high-performance matching engine that processes orders instantly, while the frontend provides a responsive dashboard with live price updates via WebSockets.

## Tech Stack

**Backend:**

- FastAPI - Modern Python web framework
- PostgreSQL - Relational database
- SQLAlchemy - ORM for database operations
- Asyncpg - Async PostgreSQL driver
- APScheduler - Task scheduling for bots
- WebSockets - Real-time order updates

**Frontend:**

- Next.js 16 - React framework with SSR
- React 19 - UI library
- Tailwind CSS - Utility-first CSS
- Axios - HTTP client
- Recharts - Chart library

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/market-sim.git
cd market-sim
```

### 2. Setup PostgreSQL Database

````bash
# Create database
createdb market_sim

# Create tables
psql market_sim < backend/db/schema/user.sql

### 3. Install Backend Dependencies

```bash
cd backend
poetry install
````

### 4. Create .env Files

**Backend** - Create `.env` in root `market-sim/` directory:

```
DATABASE_URL=postgresql://localhost:5432/market_sim
SECRET_KEY=your-secret-key-here
```

**Frontend** - Create `.env` in `frontend/` directory:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 5. Run Backend

```bash
poetry run uvicorn main:app --reload
```

Backend runs at: http://localhost:8000  
Docs: http://localhost:8000/docs

## Frontend Setup

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Run Frontend

```bash
npm run dev
```

Frontend runs at: http://localhost:3000

### Build for Production

```bash
npm run build
npm start
```
