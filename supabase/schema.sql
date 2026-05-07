-- ============================================================
-- AffiliateOS Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- OFFERS
-- ============================================================
CREATE TABLE offers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  network     TEXT,
  geo         TEXT,
  language    TEXT,
  vertical    TEXT,
  product_type TEXT,
  payout      NUMERIC(10,2),
  flow_type   TEXT CHECK (flow_type IN ('COD','CPS','CPL','Subscription')),
  offer_url   TEXT,
  status      TEXT DEFAULT 'New' CHECK (status IN ('New','Testing','Scaling','Paused','Dead')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNNELS
-- ============================================================
CREATE TABLE funnels (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  offer_id      UUID REFERENCES offers(id) ON DELETE SET NULL,
  funnel_type   TEXT CHECK (funnel_type IN ('Direct landing page','Advertorial','Quiz','VSL','Webinar','Leadgen')),
  angle         TEXT,
  lp_url        TEXT,
  prelp_url     TEXT,
  language      TEXT,
  status        TEXT DEFAULT 'Active' CHECK (status IN ('Active','Testing','Paused','Inactive')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CREATIVES
-- ============================================================
CREATE TABLE creatives (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  offer_id    UUID REFERENCES offers(id) ON DELETE SET NULL,
  funnel_id   UUID REFERENCES funnels(id) ON DELETE SET NULL,
  platform    TEXT CHECK (platform IN ('Meta Ads','TikTok Ads','Native Ads','Google Ads')),
  format      TEXT CHECK (format IN ('Video','Static','Carousel','UGC','Text')),
  hook        TEXT,
  angle       TEXT,
  file_url    TEXT,
  status      TEXT DEFAULT 'New' CHECK (status IN ('New','Testing','Winner','Loser','Paused')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CAMPAIGN METRICS
-- ============================================================
CREATE TABLE campaigns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  platform      TEXT CHECK (platform IN ('Meta Ads','TikTok Ads','Native Ads','Google Ads')),
  campaign_name TEXT,
  adset_name    TEXT,
  ad_name       TEXT,
  geo           TEXT,
  offer_id      UUID REFERENCES offers(id) ON DELETE SET NULL,
  funnel_id     UUID REFERENCES funnels(id) ON DELETE SET NULL,
  creative_id   UUID REFERENCES creatives(id) ON DELETE SET NULL,
  spend         NUMERIC(12,2) DEFAULT 0,
  impressions   BIGINT DEFAULT 0,
  clicks        BIGINT DEFAULT 0,
  leads         BIGINT DEFAULT 0,
  sales         BIGINT DEFAULT 0,
  revenue       NUMERIC(12,2) DEFAULT 0,
  notes         TEXT,
  -- Source tracking (for future API integrations)
  source        TEXT DEFAULT 'manual' CHECK (source IN ('manual','csv','meta_api','tiktok_api','google_api','keitaro','affiliate_network')),
  external_id   TEXT,  -- ID from the source platform
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_campaigns_user_date ON campaigns(user_id, date);
CREATE INDEX idx_campaigns_user_offer ON campaigns(user_id, offer_id);
CREATE INDEX idx_campaigns_user_platform ON campaigns(user_id, platform);
CREATE INDEX idx_campaigns_user_geo ON campaigns(user_id, geo);
CREATE INDEX idx_offers_user ON offers(user_id);
CREATE INDEX idx_funnels_user ON funnels(user_id);
CREATE INDEX idx_creatives_user ON creatives(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER funnels_updated_at BEFORE UPDATE ON funnels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER creatives_updated_at BEFORE UPDATE ON creatives FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Offers policies
CREATE POLICY "Users can view own offers"   ON offers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own offers" ON offers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own offers" ON offers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own offers" ON offers FOR DELETE USING (auth.uid() = user_id);

-- Funnels policies
CREATE POLICY "Users can view own funnels"   ON funnels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own funnels" ON funnels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own funnels" ON funnels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own funnels" ON funnels FOR DELETE USING (auth.uid() = user_id);

-- Creatives policies
CREATE POLICY "Users can view own creatives"   ON creatives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own creatives" ON creatives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own creatives" ON creatives FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own creatives" ON creatives FOR DELETE USING (auth.uid() = user_id);

-- Campaigns policies
CREATE POLICY "Users can view own campaigns"   ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- COMPUTED METRICS VIEW (optional helper)
-- ============================================================
CREATE OR REPLACE VIEW campaign_metrics AS
SELECT
  c.*,
  o.name AS offer_name,
  o.payout AS offer_payout,
  f.name AS funnel_name,
  cr.name AS creative_name,
  -- Calculated KPIs
  CASE WHEN c.impressions > 0 THEN ROUND((c.clicks::NUMERIC / c.impressions) * 100, 2) ELSE 0 END AS ctr,
  CASE WHEN c.clicks > 0 THEN ROUND(c.spend / c.clicks, 2) ELSE 0 END AS cpc,
  CASE WHEN c.impressions > 0 THEN ROUND((c.spend / c.impressions) * 1000, 2) ELSE 0 END AS cpm,
  CASE WHEN c.clicks > 0 THEN ROUND((c.sales::NUMERIC / c.clicks) * 100, 2) ELSE 0 END AS cvr,
  CASE WHEN c.sales > 0 THEN ROUND(c.spend / c.sales, 2) ELSE 0 END AS cpa,
  ROUND(c.revenue - c.spend, 2) AS profit,
  CASE WHEN c.spend > 0 THEN ROUND(((c.revenue - c.spend) / c.spend) * 100, 1) ELSE 0 END AS roi,
  CASE WHEN c.clicks > 0 THEN ROUND(c.revenue / c.clicks, 3) ELSE 0 END AS epc
FROM campaigns c
LEFT JOIN offers o ON c.offer_id = o.id
LEFT JOIN funnels f ON c.funnel_id = f.id
LEFT JOIN creatives cr ON c.creative_id = cr.id;
