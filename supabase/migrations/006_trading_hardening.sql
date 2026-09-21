-- ============================================================
-- PHASE 6: Trading System Hardening
-- ============================================================

-- Update starting balance to $5,000 for existing users who haven't traded
UPDATE trading_accounts
SET cash_balance = 5000
WHERE cash_balance = 10000
  AND user_id NOT IN (
    SELECT DISTINCT trading_account_id FROM trading_orders
  );

-- Update the trigger to use $5,000 starting balance
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, verification_status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'unverified');

  INSERT INTO streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0);

  INSERT INTO wallets (user_id, currency, balance)
  VALUES (NEW.id, 'NGN', 0);

  INSERT INTO trading_accounts (user_id, cash_balance, total_pnl)
  VALUES (NEW.id, 5000, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add realized_pnl column for tracking sell P&L separately
ALTER TABLE trading_accounts
  ADD COLUMN IF NOT EXISTS realized_pnl NUMERIC(14,2) NOT NULL DEFAULT 0;

-- Update existing accounts to have realized_pnl = total_pnl
UPDATE trading_accounts SET realized_pnl = total_pnl WHERE realized_pnl = 0;
