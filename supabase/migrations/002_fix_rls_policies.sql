-- Migration 002: Fix missing RLS policies and admin access
-- Run this in Supabase SQL Editor

-- ============================================================
-- AUDIT LOGS: Allow admin insert (via service_role or admin users)
-- The original policy blocks ALL access. We need admins to be able to write.
-- ============================================================
DROP POLICY IF EXISTS "No public access to audit logs" ON audit_logs;

CREATE POLICY "Admins can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND active = true)
  );

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND active = true)
  );

-- ============================================================
-- PAYMENT PROOFS: Allow admin update for review
-- ============================================================
CREATE POLICY "Admins can update payment proofs"
  ON payment_proofs FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND active = true)
  );

-- ============================================================
-- WITHDRAWAL REQUESTS: Allow admin update for approval
-- ============================================================
CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND active = true)
  );

-- ============================================================
-- SPK CANDLES: Allow inserts for trading system
-- ============================================================
CREATE POLICY "Authenticated users can insert candles"
  ON spk_candles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- MARKET STATE: Allow updates for trading system
-- ============================================================
CREATE POLICY "Authenticated users can update market state"
  ON market_state FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert market state"
  ON market_state FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- PAYMENT TRANSACTIONS: Allow authenticated inserts
-- ============================================================
CREATE POLICY "Authenticated users can insert payment transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update payment transactions"
  ON payment_transactions FOR UPDATE
  USING (auth.uid() IS NOT NULL);
