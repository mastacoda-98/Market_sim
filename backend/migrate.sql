-- Clear all trades
TRUNCATE TABLE trade_history CASCADE;

-- Drop old columns
ALTER TABLE trade_history DROP COLUMN user_id;
ALTER TABLE trade_history DROP COLUMN side;

-- Drop old index
DROP INDEX IF EXISTS idx_trade_user_id;

-- Add new columns
ALTER TABLE trade_history 
ADD COLUMN buyer_id INTEGER NOT NULL DEFAULT 1,
ADD COLUMN seller_id INTEGER NOT NULL DEFAULT 1;

-- Add foreign key constraints
ALTER TABLE trade_history
ADD CONSTRAINT fk_trade_buyer FOREIGN KEY (buyer_id) REFERENCES users(id);

ALTER TABLE trade_history
ADD CONSTRAINT fk_trade_seller FOREIGN KEY (seller_id) REFERENCES users(id);

-- Create new indexes
CREATE INDEX idx_trade_buyer_id ON trade_history(buyer_id);
CREATE INDEX idx_trade_seller_id ON trade_history(seller_id);

SELECT 'Migration completed successfully' as status;
