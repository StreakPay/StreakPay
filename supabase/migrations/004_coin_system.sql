-- ============================================================
-- PHASE 4: StreakPay Coin System
-- ============================================================

-- ============================================================
-- 1. COIN BALANCES (one row per user, separate from cash wallets)
-- ============================================================
CREATE TABLE IF NOT EXISTS coin_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  total_spent INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE coin_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coin balance"
  ON coin_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coin balance"
  ON coin_balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coin balance"
  ON coin_balances FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. COIN TRANSACTIONS (every coin movement is traceable)
-- ============================================================
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coin transactions"
  ON coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coin transactions"
  ON coin_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_coin_txn_user_created ON coin_transactions(user_id, created_at DESC);
CREATE INDEX idx_coin_txn_reference ON coin_transactions(reference);
CREATE INDEX idx_coin_txn_type ON coin_transactions(type);

-- ============================================================
-- 3. COIN MULTIPLIER (chat multiplier state per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS coin_multiplier (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  increases_today INT NOT NULL DEFAULT 0,
  last_increase_at TIMESTAMPTZ,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE coin_multiplier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own multiplier"
  ON coin_multiplier FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own multiplier"
  ON coin_multiplier FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own multiplier"
  ON coin_multiplier FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. COIN CONFIG (reward configuration, extensible)
-- ============================================================
CREATE TABLE IF NOT EXISTS coin_config (
  key TEXT PRIMARY KEY,
  value NUMERIC(14,4) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE coin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coin config"
  ON coin_config FOR SELECT
  USING (true);

-- ============================================================
-- 5. COIN RATE LIMITS (tracks user activity for anti-abuse)
-- ============================================================
CREATE TABLE IF NOT EXISTS coin_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  reward_count INT NOT NULL DEFAULT 0,
  coins_earned INT NOT NULL DEFAULT 0,
  message_hashes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE coin_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON coin_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rate limits"
  ON coin_rate_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rate limits"
  ON coin_rate_limits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_rate_limit_user_window ON coin_rate_limits(user_id, window_start DESC);

-- ============================================================
-- 6. SEED CONFIG
-- ============================================================
INSERT INTO coin_config (key, value, description) VALUES
  ('base_chat_reward', 5, 'Base coins earned per qualifying chat message'),
  ('base_activity_reward', 10, 'Base coins earned per daily activity'),
  ('max_multiplier', 2.00, 'Maximum chat multiplier allowed'),
  ('multiplier_step', 0.05, 'Multiplier increase per qualifying chat'),
  ('max_multiplier_increases_per_day', 10, 'Max multiplier increases per 24h'),
  ('daily_coin_cap', 500, 'Max coins a user can earn per day'),
  ('rate_limit_window_minutes', 60, 'Rate limit window in minutes'),
  ('rate_limit_max_rewards', 20, 'Max rewards per rate limit window'),
  ('rate_limit_max_coins', 200, 'Max coins per rate limit window'),
  ('duplicate_message_window_minutes', 30, 'Minutes before same message hash can earn again'),
  ('diminishing_returns_threshold', 5, 'After this many rewards, returns diminish by 50%')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 7. Auto-create coin_balance + coin_multiplier on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user_coin_system()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO coin_balances (user_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 0, 0, 0);

  INSERT INTO coin_multiplier (user_id, multiplier, increases_today, last_reset_date)
  VALUES (NEW.id, 1.00, 0, CURRENT_DATE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created_coin_system
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_coin_system();
