// ============================================================
// Database Row Types (match Supabase schema exactly)
// ============================================================

export type OfferStatus = 'New' | 'Testing' | 'Scaling' | 'Paused' | 'Dead'
export type FlowType    = 'COD' | 'CPS' | 'CPL' | 'Subscription'
export type FunnelType  = 'Direct landing page' | 'Advertorial' | 'Quiz' | 'VSL' | 'Webinar' | 'Leadgen'
export type FunnelStatus   = 'Active' | 'Testing' | 'Paused' | 'Inactive'
export type Platform       = 'Meta Ads' | 'TikTok Ads' | 'Native Ads' | 'Google Ads'
export type CreativeFormat = 'Video' | 'Static' | 'Carousel' | 'UGC' | 'Text'
export type CreativeStatus = 'New' | 'Testing' | 'Winner' | 'Loser' | 'Paused'
export type DataSource     = 'manual' | 'csv' | 'meta_api' | 'tiktok_api' | 'google_api' | 'keitaro' | 'affiliate_network'

export interface Offer {
  id:           string
  user_id:      string
  name:         string
  network:      string | null
  geo:          string | null
  language:     string | null
  vertical:     string | null
  product_type: string | null
  payout:       number | null
  flow_type:    FlowType | null
  offer_url:    string | null
  status:       OfferStatus
  notes:        string | null
  created_at:   string
  updated_at:   string
}

export interface Funnel {
  id:          string
  user_id:     string
  name:        string
  offer_id:    string | null
  funnel_type: FunnelType | null
  angle:       string | null
  lp_url:      string | null
  prelp_url:   string | null
  language:    string | null
  status:      FunnelStatus
  notes:       string | null
  created_at:  string
  updated_at:  string
  // Joined
  offer?:      Pick<Offer, 'id' | 'name'>
}

export interface Creative {
  id:         string
  user_id:    string
  name:       string
  offer_id:   string | null
  funnel_id:  string | null
  platform:   Platform | null
  format:     CreativeFormat | null
  hook:       string | null
  angle:      string | null
  file_url:   string | null
  status:     CreativeStatus
  notes:      string | null
  created_at: string
  updated_at: string
  // Joined
  offer?:     Pick<Offer, 'id' | 'name'>
  funnel?:    Pick<Funnel, 'id' | 'name'>
}

export interface Campaign {
  id:            string
  user_id:       string
  date:          string
  platform:      Platform | null
  campaign_name: string | null
  adset_name:    string | null
  ad_name:       string | null
  geo:           string | null
  offer_id:      string | null
  funnel_id:     string | null
  creative_id:   string | null
  spend:         number
  impressions:   number
  clicks:        number
  leads:         number
  sales:         number
  revenue:       number
  notes:         string | null
  source:        DataSource
  external_id:   string | null
  created_at:    string
  updated_at:    string
  // Joined
  offer?:        Pick<Offer, 'id' | 'name'>
  funnel?:       Pick<Funnel, 'id' | 'name'>
  creative?:     Pick<Creative, 'id' | 'name'>
}

// ============================================================
// Calculated KPIs (computed client-side)
// ============================================================
export interface CampaignMetrics {
  ctr:    number   // CTR %
  cpc:    number   // cost per click
  cpm:    number   // cost per mille
  cvr:    number   // conversion rate %
  cpa:    number   // cost per acquisition
  profit: number   // revenue - spend
  roi:    number   // ROI %
  epc:    number   // earnings per click
}

// ============================================================
// Filter state
// ============================================================
export interface CampaignFilters {
  dateFrom:   string
  dateTo:     string
  platform:   string
  geo:        string
  offerId:    string
  funnelId:   string
  creativeId: string
}

// ============================================================
// Dashboard aggregates
// ============================================================
export interface DashboardKPIs {
  totalSpend:   number
  totalRevenue: number
  totalProfit:  number
  avgROI:       number
  totalClicks:  number
  totalLeads:   number
  totalSales:   number
  avgEPC:       number
}

export interface PerformerRow {
  name:   string
  spend:  number
  revenue:number
  profit: number
  roi:    number
}

// ============================================================
// CSV Import types
// ============================================================
export interface CSVCampaignRow {
  date:          string
  platform:      string
  campaign_name: string
  adset_name:    string
  ad_name:       string
  geo:           string
  spend:         string
  impressions:   string
  clicks:        string
  leads:         string
  sales:         string
  revenue:       string
  notes?:        string
}
