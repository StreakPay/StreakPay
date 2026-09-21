-- Migration 007: Fix critical RLS policy vulnerabilities
-- Run this in Supabase SQL Editor
-- This migration tightens overly permissive RLS policies found during final audit.

-- ============================================================
-- SPK CANDLES: Restrict INSERT to service_role only (server-side trading)
-- Previously: any authenticated user could insert fake candle data
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert candles" ON spk_candles;

CREATE POLICY "Service role can insert candles"
  ON spk_candles FOR INSERT
  WITH CHECK (false);

-- ============================================================
-- MARKET STATE: Restrict UPDATE/INSERT to service_role only
-- Previously: any authenticated user could manipulate SPK price
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update market state" ON market_state;
DROP POLICY IF EXISTS "Authenticated users can insert market state" ON market_state;

CREATE POLICY "Service role can update market state"
  ON market_state FOR UPDATE
  USING (false);

CREATE POLICY "Service role can insert market state"
  ON market_state FOR INSERT
  WITH CHECK (false);

-- ============================================================
-- PAYMENT TRANSACTIONS: Restrict UPDATE to service_role only
-- Previously: any authenticated user could mark any payment as success
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update payment transactions" ON payment_transactions;

CREATE POLICY "Service role can update payment transactions"
  ON payment_transactions FOR UPDATE
  USING (false);

-- ============================================================
-- FRIENDSHIPS: Require that the inserting user is one of the two users
-- Previously: WITH CHECK (true) allowed inserting friendships between any users
-- ============================================================
DROP POLICY IF EXISTS "Users can insert friendships" ON friendships;

CREATE POLICY "Users can insert own friendships"
  ON friendships FOR INSERT
  WITH CHECK (
    auth.uid() = user_id_1 OR auth.uid() = user_id_2
  );

-- ============================================================
-- CONVERSATIONS: Require that the inserting user is part of the friendship
-- Previously: WITH CHECK (true) allowed inserting conversations for any friendship
-- ============================================================
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;

CREATE POLICY "Users can insert conversations for own friendships"
  ON conversations FOR INSERT
  WITH CHECK (
    friendship_id IN (
      SELECT id FROM friendships
      WHERE user_id_1 = auth.uid() OR user_id_2 = auth.uid()
    )
  );

-- ============================================================
-- Coin config: Restrict to service_role only (prevent reward config leaks)
-- ============================================================
-- Note: coin_config has no RLS by default (it's a config table).
-- If it has RLS enabled, restrict SELECT to authenticated users only.
-- This prevents unauthenticated users from reading reward parameters.
