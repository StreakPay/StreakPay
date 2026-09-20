-- StreakPay Database Migration for Supabase PostgreSQL
-- Run this in Supabase SQL Editor or via CLI

-- ============================================================
-- 1. PROFILES (linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  profile_image TEXT,
  tiktok_username TEXT,
  snapchat_username TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. STREAKS
-- ============================================================
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_completion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. STREAK TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS streak_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL,
  day_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE streak_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view streak tasks"
  ON streak_tasks FOR SELECT
  USING (true);

-- ============================================================
-- 4. STREAK COMPLETIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS streak_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_id UUID NOT NULL REFERENCES streaks(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES streak_tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, completed_at)
);

ALTER TABLE streak_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
  ON streak_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON streak_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. MILESTONES
-- ============================================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  required_streak INT NOT NULL,
  reward_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view milestones"
  ON milestones FOR SELECT
  USING (true);

-- ============================================================
-- 6. CLAIMED MILESTONES
-- ============================================================
CREATE TABLE IF NOT EXISTS claimed_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_id UUID NOT NULL REFERENCES streaks(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_id)
);

ALTER TABLE claimed_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claimed milestones"
  ON claimed_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own claimed milestones"
  ON claimed_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7. WALLETS
-- ============================================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'NGN',
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency)
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets"
  ON wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. LEDGER ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  direction TEXT NOT NULL,
  type TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger entries"
  ON ledger_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ledger entries"
  ON ledger_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ledger_user_created ON ledger_entries(user_id, created_at DESC);

-- ============================================================
-- 9. PAYMENT TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  provider TEXT NOT NULL,
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_payment_user_created ON payment_transactions(user_id, created_at DESC);

-- ============================================================
-- 10. PAYMENT PROOFS
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proofs"
  ON payment_proofs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proofs"
  ON payment_proofs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 11. WITHDRAWAL REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'requested',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_withdrawal_user_created ON withdrawal_requests(user_id, created_at DESC);
CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);

-- ============================================================
-- 12. TRADING ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS trading_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  cash_balance NUMERIC(14,2) NOT NULL DEFAULT 10000,
  total_pnl NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trading account"
  ON trading_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own trading account"
  ON trading_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading account"
  ON trading_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 13. TRADING POSITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS trading_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL DEFAULT 'SPK',
  quantity NUMERIC(14,4) NOT NULL,
  average_price NUMERIC(14,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trading_account_id, symbol)
);

ALTER TABLE trading_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own positions"
  ON trading_positions FOR SELECT
  USING (
    trading_account_id IN (
      SELECT id FROM trading_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own positions"
  ON trading_positions FOR ALL
  USING (
    trading_account_id IN (
      SELECT id FROM trading_accounts WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 14. TRADING ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS trading_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  side TEXT NOT NULL,
  symbol TEXT NOT NULL DEFAULT 'SPK',
  quantity NUMERIC(14,4) NOT NULL,
  price NUMERIC(14,4) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON trading_orders FOR SELECT
  USING (
    trading_account_id IN (
      SELECT id FROM trading_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own orders"
  ON trading_orders FOR INSERT
  WITH CHECK (
    trading_account_id IN (
      SELECT id FROM trading_accounts WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_order_account_created ON trading_orders(trading_account_id, created_at DESC);

-- ============================================================
-- 15. SPK CANDLES
-- ============================================================
CREATE TABLE IF NOT EXISTS spk_candles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  open NUMERIC(14,4) NOT NULL,
  high NUMERIC(14,4) NOT NULL,
  low NUMERIC(14,4) NOT NULL,
  close NUMERIC(14,4) NOT NULL,
  volume NUMERIC(14,2) NOT NULL DEFAULT 0,
  timeframe TEXT NOT NULL DEFAULT '1m',
  UNIQUE(timestamp, timeframe)
);

ALTER TABLE spk_candles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view candles"
  ON spk_candles FOR SELECT
  USING (true);

CREATE INDEX idx_candle_timestamp ON spk_candles(timestamp, timeframe);

-- ============================================================
-- 16. MARKET STATE
-- ============================================================
CREATE TABLE IF NOT EXISTS market_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE DEFAULT 'SPK',
  base_price NUMERIC(14,4) NOT NULL DEFAULT 1.00,
  current_price NUMERIC(14,4) NOT NULL DEFAULT 1.00,
  volatility NUMERIC(14,4) NOT NULL DEFAULT 0.02,
  sentiment NUMERIC(14,4) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE market_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market state"
  ON market_state FOR SELECT
  USING (true);

-- ============================================================
-- 17. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_notification_user_created ON notifications(user_id, created_at DESC);

-- ============================================================
-- 18. AI CONVERSATIONS + MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON ai_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages"
  ON ai_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 19. QUIZ QUESTIONS + ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active quiz questions"
  ON quiz_questions FOR SELECT
  USING (active = true);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 20. SUPPORT TICKETS + MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for own tickets"
  ON support_messages FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for own tickets"
  ON support_messages FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 21. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access (no user policies -- only service_role can access)
CREATE POLICY "No public access to audit logs"
  ON audit_logs FOR ALL
  USING (false);

-- ============================================================
-- 22. ADMIN USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can check if they are admin"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 23. MUSIC ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS music_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  reward NUMERIC(12,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE music_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active music activities"
  ON music_activities FOR SELECT
  USING (active = true);

CREATE TABLE IF NOT EXISTS music_user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES music_activities(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reward_earned NUMERIC(12,2) NOT NULL DEFAULT 0
);

ALTER TABLE music_user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own music activities"
  ON music_user_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own music activities"
  ON music_user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 24. SPK PRICE HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS spk_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price NUMERIC(14,4) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE spk_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price history"
  ON spk_price_history FOR SELECT
  USING (true);

CREATE INDEX idx_price_history_timestamp ON spk_price_history(timestamp);

-- ============================================================
-- SEED DATA: Streak Tasks
-- ============================================================
INSERT INTO streak_tasks (activity_type, day_number, title, description) VALUES
  ('daily_engagement', 1, 'Daily Engagement', 'Complete today''s engagement activity'),
  ('daily_checkin', 2, 'Daily Check-in', 'Check in to maintain your streak'),
  ('daily_quiz', 3, 'Daily Quiz', 'Answer today''s quiz question'),
  ('share_referral', 4, 'Share & Refer', 'Share StreakPay with a friend')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: Milestones
-- ============================================================
INSERT INTO milestones (required_streak, reward_amount, currency) VALUES
  (20, 5000, 'NGN'),
  (50, 40000, 'NGN'),
  (100, 110000, 'NGN')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: Market State
-- ============================================================
INSERT INTO market_state (symbol, base_price, current_price, volatility, sentiment)
VALUES ('SPK', 1.00, 1.00, 0.02, 0)
ON CONFLICT (symbol) DO NOTHING;

-- ============================================================
-- FUNCTION: Auto-create profile + streak + wallet on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, full_name, verification_status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'unverified');

  -- Create streak
  INSERT INTO streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0);

  -- Create NGN wallet
  INSERT INTO wallets (user_id, currency, balance)
  VALUES (NEW.id, 'NGN', 0);

  -- Create trading account
  INSERT INTO trading_accounts (user_id, cash_balance, total_pnl)
  VALUES (NEW.id, 10000, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: after a new user signs up via Supabase Auth
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
