import hashlib
import datetime
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic_schemas.user import UserCreateRequest, UserResponse
from fastapi import HTTPException


def hash_password(password: str) -> str:
    password = password[:72]
    salt = "market_sim_salt"
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return hashed


async def create_new_user(user: UserCreateRequest, db: AsyncSession) -> UserResponse:
    hashed_password = hash_password(user.password)
    
    try:
        result = await db.execute(
            text("""
                INSERT INTO users (first_name, last_name, email, password_hash, credits, created_at, updated_at)
                VALUES (:first_name, :last_name, :email, :password_hash, :credits, :created_at, :updated_at)
                RETURNING id, first_name, last_name, email, credits, created_at, updated_at
            """),
            {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "password_hash": hashed_password,
                "credits": 10000.0,
                "created_at": datetime.datetime.now(),
                "updated_at": datetime.datetime.now()
            }
        )
        await db.commit()
        row = result.mappings().fetchone()
        
        if row is None:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        return UserResponse(
            user_id=str(row["id"]),
            first_name=row["first_name"],
            last_name=row["last_name"],
            email=row["email"],
            credits=row["credits"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

    except Exception as e:
        await db.rollback()
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Error creating user")



async def get_user_by_email(email: str, db: AsyncSession) -> Optional[UserResponse]:
    result = await db.execute(
        text("""
            SELECT id, first_name, last_name, email, credits, created_at, updated_at
            FROM users
            WHERE email = :email
        """),
        {"email": email}
    )
    row = result.mappings().fetchone()
    if row:
        return UserResponse(
            user_id=str(row["id"]),
            first_name=row["first_name"],
            last_name=row["last_name"],
            email=row["email"],
            credits=row["credits"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )
    return None

async def get_user_by_id(user_id: str, db: AsyncSession) -> Optional[UserResponse]:
    result = await db.execute(
        text("""
            SELECT id, first_name, last_name, email, credits, created_at, updated_at
            FROM users
            WHERE id = :user_id
        """),
        {"user_id": int(user_id)}
    )
    row = result.mappings().fetchone()
    if row:
        return UserResponse(
            user_id=str(row["id"]),
            first_name=row["first_name"],
            last_name=row["last_name"],
            email=row["email"],
            credits=row["credits"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )
    return None


async def get_user_password_hash(email: str, db: AsyncSession) -> Optional[str]:
    result = await db.execute(
        text("""
            SELECT password_hash
            FROM users
            WHERE email = :email
        """),
        {"email": email}
    )
    row = result.mappings().fetchone()
    return row["password_hash"] if row else None


async def get_user_portfolio(user_id: int, db: AsyncSession) -> list:
    result = await db.execute(
        text("""
            SELECT stock_symbol, quantity, average_buy_price, total_invested, updated_at 
            FROM user_portfolio 
            WHERE user_id = :user_id
            ORDER BY updated_at DESC
        """),
        {"user_id": user_id}
    )
    
    rows = result.fetchall()
    portfolio = []
    for row in rows:
        portfolio.append({
            "symbol": row[0],
            "quantity": row[1],
            "average_buy_price": row[2],
            "total_invested": row[3],
            "updated_at": row[4]
        })
    
    return portfolio


async def get_user_trades(user_id: int, db: AsyncSession) -> list:
    result = await db.execute(
        text("""
            SELECT id, side, symbol, price, quantity, timestamp 
            FROM trade_history 
            WHERE user_id = :user_id
            ORDER BY timestamp DESC
            LIMIT 100
        """),
        {"user_id": user_id}
    )
    
    rows = result.fetchall()
    trades = []
    for row in rows:
        trades.append({
            "trade_id": row[0],
            "side": row[1],
            "symbol": row[2],
            "price": row[3],
            "quantity": row[4],
            "timestamp": row[5]
        })
    
    return trades


async def add_stocks_to_user(user_id: int, symbol: str, quantity: float, db: AsyncSession):
    await db.execute(
        text("""
            INSERT INTO user_portfolio (user_id, stock_symbol, quantity, average_buy_price, total_invested)
            VALUES (:user_id, :symbol, :qty, 0, 0)
            ON CONFLICT (user_id, stock_symbol) DO UPDATE
            SET quantity = user_portfolio.quantity + :qty
        """),
        {"user_id": user_id, "symbol": symbol, "qty": quantity}
    )
    await db.commit()
    
    return {"user_id": user_id, "symbol": symbol, "quantity": quantity}