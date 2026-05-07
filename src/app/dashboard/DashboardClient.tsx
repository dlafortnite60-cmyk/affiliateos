'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FilterBar, DEFAULT_FILTERS } from '@/components/ui/FilterBar'
import { MetricCard, Button } from '@/components/ui/index'
import { SpendRevenueChart, ROILineChart, PlatformROIChart, TopPerformersTable } from '@/components/charts'
import { calcDashboardKPIs, calcMetrics, groupByField, fmt$, fmtNum, fmtPct } from '@/lib/metrics'
import { exportCampaignsCSV } from '@/lib/csv'
import type { Campaign, CampaignFilters, Offer, Funnel, Creative } from '@/types'

interface Props {
  initialCampaigns: Campaign[]
  offers:   Pick<Offer, 'id' | 'name'>[]
  funnels:  Pick<Funnel, 'id' | 'name'>[]
  creatives: Pick<Creative, 'id' | 'name'>[]
}

export function DashboardClient({ initialCampaigns, offers, funnels }: Props) {
  const [filters, setFilters] = useState<CampaignFilters>(DEFAULT_FILTERS)

  const filtered = useMemo(() => {
    return initialCampaigns.filter(c => {
      if (filters.dateFrom && c.date < filters.dateFrom) return false
      if (filters.dateTo   && c.date > filters.dateTo)   return false
      if (filters.platform && c.platform !== filters.platform) return false
      if (filters.geo      && !c.geo?.toUpperCase().includes(filters.geo.toUpperCase())) return false
      if (filters.offerId  && c.offer_id !== filters.offerId)  return false
      if (filters.funnelId && c.funnel_id !== filters.funnelId) return false
      return true
    })
  }, [initialCampaigns, filters])

  const kpis = useMemo(() => calcDashboardKPIs(filtered), [filtered])

  // Daily chart data (last 14 days)
  const dailyData = useMemo(() => {
    const map = new Map<string, { spend: number; revenue: number }>()
    filtered.forEach(c => {
      const d = c.date
      const cur = map.get(d) ?? { spend: 0, revenue: 0 }
      map.set(d, { spend: cur.spend + c.spend, revenue: cur.revenue + c.revenue })
    })
    return Array.from(map.entries())
      .sort(([a],[b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, v]) => ({
        date:    date.slice(5),
        spend:   +v.spend.toFixed(2),
        revenue: +v.revenue.toFixed(2),
        profit:  +(v.revenue - v.spend).toFixed(2),
      }))
  }, [filtered])

  const roiData = useMemo(() =>
    dailyData.map(d => ({
      date: d.date,
      roi: d.spend > 0 ? +((d.profit / d.spend) * 100).toFixed(1) : 0,
    })), [dailyData])

  const byPlatform = useMemo(() => groupByField(filtered, c => c.platform ?? 'Unknown'), [filtered])
  const byOffer    = useMemo(() => groupByField(filtered, c => c.offer?.name ?? 'Unknown'), [filtered])
  const byGeo      = useMemo(() => groupByField(filtered, c => c.geo ?? 'Unknown'), [filtered])
  const byFunnel   = useMemo(() => groupByField(filtered, c => c.funnel?.name ?? 'Unknown'), [filtered])

  // Alerts
  const negative = useMemo(() =>
    filtered.filter(c => calcMetrics(c).roi < 0).sort((a,b) => calcMetrics(a).roi - calcMetrics(b).roi),
    [filtered])
  const scaling = useMemo(() =>
    filtered.filter(c => calcMetrics(c).roi > 50 && c.spend > 100).sort((a,b) => calcMetrics(b).roi - calcMetrics(a).roi),
    [filtered])
  const pause = useMemo(() =>
    filtered.filter(c => calcMetrics(c).roi < -20 && c.spend > 50),
    [filtered])

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-100">Dashboard</h1>
          <p className="text-xs text-gray-500">{filtered.length} campaigns · {fmtNum(initialCampaigns.length)} total</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => exportCampaignsCSV(filtered)}>↓ Export CSV</Button>
          <Link href="/campaigns/new"><Button size="sm" variant="primary">+ Add Campaign</Button></Link>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Filters */}
        <FilterBar
          filters={filters} offers={offers} funnels={funnels}
          onChange={setFilters} onClear={() => setFilters(DEFAULT_FILTERS)}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <MetricCard label="Spend"    value={fmt$(kpis.totalSpend)}   sub={`${filtered.length} campaigns`} />
          <MetricCard label="Revenue"  value={fmt$(kpis.totalRevenue)} sub={`${fmtNum(kpis.totalSales)} sales`} />
          <MetricCard label="Profit"   value={fmt$(kpis.totalProfit)}  sub={kpis.totalProfit >= 0 ? '↑ Profitable' : '↓ Loss'} subClass={kpis.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'} />
          <MetricCard label="Avg ROI"  value={fmtPct(kpis.avgROI)}    sub="Return on spend" subClass={kpis.avgROI >= 0 ? 'text-green-400' : 'text-red-400'} />
          <MetricCard label="Clicks"   value={fmtNum(kpis.totalClicks)} />
          <MetricCard label="Leads"    value={fmtNum(kpis.totalLeads)} />
          <MetricCard label="Sales"    value={fmtNum(kpis.totalSales)}  sub={`CPA: ${fmt$(kpis.totalSales ? kpis.totalSpend/kpis.totalSales : 0)}`} />
          <MetricCard label="EPC"      value={fmt$(kpis.avgEPC)}        sub="Earnings/click" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="text-sm font-semibold text-gray-200 mb-0.5">Spend vs Revenue vs Profit</div>
            <div className="text-xs text-gray-500 mb-4">Daily breakdown</div>
            {dailyData.length === 0
              ? <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">No campaign data</div>
              : <SpendRevenueChart data={dailyData} />
            }
          </div>
          <div className="card p-5">
            <div className="text-sm font-semibold text-gray-200 mb-0.5">ROI Trend</div>
            <div className="text-xs text-gray-500 mb-4">Daily return on investment %</div>
            {roiData.length === 0
              ? <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">No data</div>
              : <ROILineChart data={roiData} />
            }
          </div>
        </div>

        {/* Platform ROI + Alerts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="text-sm font-semibold text-gray-200 mb-0.5">ROI by Platform</div>
            <div className="text-xs text-gray-500 mb-4">Aggregated across filtered campaigns</div>
            {byPlatform.length === 0
              ? <div className="h-[200px] flex items-center justify-center text-sm text-gray-500">No data</div>
              : <PlatformROIChart data={byPlatform} />
            }
          </div>

          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#30363d] flex items-center gap-2">
              <span className="text-sm font-semibold text-green-400">🚀 Ready to Scale</span>
              <span className="text-xs bg-green-900/40 text-green-400 border border-green-800/50 px-1.5 py-0.5 rounded-full">{scaling.length}</span>
            </div>
            <div className="divide-y divide-[#21262d]">
              {scaling.length === 0
                ? <div className="px-4 py-4 text-xs text-gray-500">No campaigns ready yet</div>
                : scaling.slice(0,5).map(c => (
                    <div key={c.id} className="px-4 py-2.5 flex justify-between items-center text-xs hover:bg-[#21262d]">
                      <span className="text-gray-300 truncate max-w-[140px]">{c.campaign_name}</span>
                      <span className="text-green-400 font-semibold">{calcMetrics(c).roi.toFixed(1)}%</span>
                    </div>
                  ))
              }
            </div>
            <div className="px-4 py-3 border-t border-[#30363d] flex items-center gap-2 mt-1">
              <span className="text-sm font-semibold text-red-400">📉 Negative ROI</span>
              <span className="text-xs bg-red-900/40 text-red-400 border border-red-800/50 px-1.5 py-0.5 rounded-full">{negative.length}</span>
            </div>
            <div className="divide-y divide-[#21262d]">
              {negative.length === 0
                ? <div className="px-4 py-4 text-xs text-gray-500">All campaigns profitable!</div>
                : negative.slice(0,5).map(c => (
                    <div key={c.id} className="px-4 py-2.5 flex justify-between items-center text-xs hover:bg-[#21262d]">
                      <span className="text-gray-300 truncate max-w-[140px]">{c.campaign_name}</span>
                      <span className="text-red-400 font-semibold">{calcMetrics(c).roi.toFixed(1)}%</span>
                    </div>
                  ))
              }
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#30363d]">
              <div className="text-sm font-semibold text-yellow-400">⏸ Consider Pausing</div>
              <div className="text-xs text-gray-500 mt-0.5">ROI &lt; -20% with $50+ spend</div>
            </div>
            {pause.length === 0
              ? <div className="px-4 py-4 text-xs text-gray-500">Nothing to pause</div>
              : pause.slice(0,5).map(c => (
                  <div key={c.id} className="px-4 py-2.5 flex justify-between items-center text-xs border-b border-[#21262d] last:border-0 hover:bg-[#21262d]">
                    <div>
                      <div className="text-gray-300 truncate max-w-[140px]">{c.campaign_name}</div>
                      <div className="text-gray-500">{c.geo} · {fmt$(c.spend)} spent</div>
                    </div>
                    <span className="text-yellow-400 font-semibold">{calcMetrics(c).roi.toFixed(1)}%</span>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Best performers grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TopPerformersTable title="🏆 Best Offers"    rows={byOffer} />
          <TopPerformersTable title="🌍 Best GEOs"      rows={byGeo} />
          <TopPerformersTable title="🔄 Best Funnels"   rows={byFunnel} />
          <TopPerformersTable title="📣 By Platform"    rows={byPlatform} />
        </div>
      </div>
    </div>
  )
}
