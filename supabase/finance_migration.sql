-- ============================================================
-- AffiliateOS — Finance Tracker Migration
-- Run this AFTER schema.sql in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- WALLET (one per user — tracks starting capital)
-- ============================================================
CREATE TABLE wallets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  starting_balance NUMERIC(12,2) DEFAULT 0,
  currency        TEXT DEFAULT 'USD',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS (every money movement)
-- ============================================================
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- When & what
  date            DATE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency        TEXT DEFAULT 'USD',

  -- Category
  category        TEXT NOT NULL,
  -- income:  'affiliate_payout', 'bonus', 'refund', 'other_income'
  -- expense: 'ad_spend', 'tracker', 'hosting', 'domain', 'spy_tool',
  --          'vpn', 'creative', 'team', 'software', 'other_expense'

  description     TEXT,

  -- Optional links to campaign/offer for reconciliation
  offer_id        UUID REFERENCES offers(id) ON DELETE SET NULL,
  campaign_id     UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  -- Payment info
  payment_method  TEXT,   -- Payoneer, Wire, Crypto, Card...
  network         TEXT,   -- which affiliate network paid / which ad network charged
  reference       TEXT,   -- invoice number, transaction ID, etc.

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_transactions_user_date     ON transactions(user_id, date);
CREATE INDEX idx_transactions_user_type     ON transactions(user_id, type);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER wallets_updated_at      BEFORE UPDATE ON wallets      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE wallets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wallet"       ON wallets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own transactions"   ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- HELPFUL VIEW: monthly P&L
-- ============================================================
CREATE OR REPLACE VIEW monthly_pnl AS
SELECT
  user_id,
  TO_CHAR(date, 'YYYY-MM') AS month,
  SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
  SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) -
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS net_profit
FROM transactions
GROUP BY user_id, TO_CHAR(date, 'YYYY-MM')
ORDER BY month DESC;
