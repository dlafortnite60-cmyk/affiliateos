import type { Campaign, CampaignMetrics, DashboardKPIs, PerformerRow } from '@/types'

export function calcMetrics(c: Campaign): CampaignMetrics {
  const { spend, impressions, clicks, sales, revenue } = c
  return {
    ctr:    impressions > 0 ? +((clicks / impressions) * 100).toFixed(2)  : 0,
    cpc:    clicks > 0      ? +(spend / clicks).toFixed(2)                 : 0,
    cpm:    impressions > 0 ? +((spend / impressions) * 1000).toFixed(2)  : 0,
    cvr:    clicks > 0      ? +((sales / clicks) * 100).toFixed(2)        : 0,
    cpa:    sales > 0       ? +(spend / sales).toFixed(2)                  : 0,
    profit: +(revenue - spend).toFixed(2),
    roi:    spend > 0       ? +(((revenue - spend) / spend) * 100).toFixed(1) : 0,
    epc:    clicks > 0      ? +(revenue / clicks).toFixed(3)               : 0,
  }
}

export function calcDashboardKPIs(campaigns: Campaign[]): DashboardKPIs {
  const totalSpend   = campaigns.reduce((s, c) => s + c.spend, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const totalClicks  = campaigns.reduce((s, c) => s + c.clicks, 0)
  const totalProfit  = totalRevenue - totalSpend
  return {
    totalSpend:   +totalSpend.toFixed(2),
    totalRevenue: +totalRevenue.toFixed(2),
    totalProfit:  +totalProfit.toFixed(2),
    avgROI:       totalSpend > 0 ? +((totalProfit / totalSpend) * 100).toFixed(1) : 0,
    totalClicks,
    totalLeads:   campaigns.reduce((s, c) => s + c.leads, 0),
    totalSales:   campaigns.reduce((s, c) => s + c.sales, 0),
    avgEPC:       totalClicks > 0 ? +(totalRevenue / totalClicks).toFixed(3) : 0,
  }
}

export function groupByField(
  campaigns: Campaign[],
  getKey: (c: Campaign) => string
): PerformerRow[] {
  const map = new Map<string, { spend: number; revenue: number }>()
  for (const c of campaigns) {
    const key = getKey(c) || 'Unknown'
    const cur = map.get(key) || { spend: 0, revenue: 0 }
    map.set(key, { spend: cur.spend + c.spend, revenue: cur.revenue + c.revenue })
  }
  return Array.from(map.entries())
    .map(([name, { spend, revenue }]) => ({
      name,
      spend:   +spend.toFixed(2),
      revenue: +revenue.toFixed(2),
      profit:  +(revenue - spend).toFixed(2),
      roi:     spend > 0 ? +((revenue - spend) / spend * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.roi - a.roi)
}

export function fmt$(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2
  }).format(n)
}

export function fmtNum(n: number) {
  return new Intl.NumberFormat('en-US').format(n)
}

export function fmtPct(n: number) {
  return n.toFixed(1) + '%'
}

export function roiColor(roi: number) {
  if (roi >= 50)  return 'text-green-400'
  if (roi >= 0)   return 'text-green-300'
  if (roi >= -20) return 'text-yellow-400'
  return 'text-red-400'
}

export function profitColor(profit: number) {
  return profit >= 0 ? 'text-green-400' : 'text-red-400'
}
