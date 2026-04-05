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