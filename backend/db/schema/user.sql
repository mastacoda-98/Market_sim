CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    credits FLOAT ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_portfolio (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    stock_symbol VARCHAR(10) NOT NULL,
    quantity FLOAT NOT NULL,
    average_buy_price FLOAT NOT NULL,
    total_invested FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, stock_symbol)
);

CREATE TABLE trade_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    symbol VARCHAR(10) NOT NULL,
    price FLOAT NOT NULL,
    quantity FLOAT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX idx_user_portfolio_user_id ON user_portfolio(user_id);
CREATE INDEX idx_trade_user_id ON trade_history(user_id);
CREATE INDEX idx_trade_symbol ON trade_history(symbol);