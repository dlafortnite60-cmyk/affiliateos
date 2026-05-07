'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FilterBar, DEFAULT_FILTERS } from '@/components/ui/FilterBar'
import { Button } from '@/components/ui/index'
import { calcMetrics, fmt$, fmtNum, fmtPct } from '@/lib/metrics'
import { exportCampaignsCSV } from '@/lib/csv'
import { cn } from '@/lib/utils'
import type { Campaign, CampaignFilters, Offer, Funnel } from '@/types'

interface Props {
  campaigns: Campaign[]
  offers:    Pick<Offer, 'id' | 'name'>[]
  funnels:   Pick<Funnel, 'id' | 'name'>[]
}

export function CampaignsTableClient({ campaigns, offers, funnels }: Props) {
  const [filters, setFilters] = useState<CampaignFilters>(DEFAULT_FILTERS)

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      if (filters.dateFrom && c.date < filters.dateFrom) return false
      if (filters.dateTo   && c.date > filters.dateTo)   return false
      if (filters.platform && c.platform !== filters.platform) return false
      if (filters.geo      && !c.geo?.toUpperCase().includes(filters.geo)) return false
      if (filters.offerId  && c.offer_id !== filters.offerId)  return false
      if (filters.funnelId && c.funnel_id !== filters.funnelId) return false
      return true
    })
  }, [campaigns, filters])

  return (
    <div className="space-y-4">
      <FilterBar
        filters={filters} offers={offers} funnels={funnels}
        onChange={setFilters} onClear={() => setFilters(DEFAULT_FILTERS)}
      />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{filtered.length} of {campaigns.length} campaigns</span>
        <Button size="sm" onClick={() => exportCampaignsCSV(filtered)}>↓ Export CSV</Button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table text-xs">
            <thead>
              <tr>
                <th>Date</th><th>Platform</th><th>Campaign</th><th>GEO</th><th>Offer</th>
                <th className="text-right">Spend</th><th className="text-right">Impr.</th><th className="text-right">Clicks</th>
                <th className="text-right">CTR</th><th className="text-right">CPC</th><th className="text-right">CPM</th>
                <th className="text-right">Leads</th><th className="text-right">Sales</th><th className="text-right">CVR</th><th className="text-right">CPA</th>
                <th className="text-right">Revenue</th><th className="text-right">Profit</th><th className="text-right">ROI</th><th className="text-right">EPC</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const m = calcMetrics(c)
                return (
                  <tr key={c.id}>
                    <td className="font-mono text-xs">{c.date}</td>
                    <td><span className="text-blue-400 text-xs">{c.platform}</span></td>
                    <td>
                      <div className="font-medium max-w-[140px] truncate">{c.campaign_name || '—'}</div>
                      <div className="text-gray-500 text-xs truncate max-w-[140px]">{c.adset_name}</div>
                    </td>
                    <td className="font-semibold">{c.geo || '—'}</td>
                    <td className="text-blue-400 max-w-[100px] truncate">{c.offer?.name || '—'}</td>
                    <td className="text-right font-medium">{fmt$(c.spend)}</td>
                    <td className="text-right text-gray-400">{fmtNum(c.impressions)}</td>
                    <td className="text-right text-gray-400">{fmtNum(c.clicks)}</td>
                    <td className="text-right">{fmtPct(m.ctr)}</td>
                    <td className="text-right">{fmt$(m.cpc)}</td>
                    <td className="text-right">{fmt$(m.cpm)}</td>
                    <td className="text-right text-gray-400">{fmtNum(c.leads)}</td>
                    <td className="text-right text-gray-400">{fmtNum(c.sales)}</td>
                    <td className="text-right">{fmtPct(m.cvr)}</td>
                    <td className="text-right">{fmt$(m.cpa)}</td>
                    <td className="text-right text-green-400 font-medium">{fmt$(c.revenue)}</td>
                    <td className={cn('text-right font-semibold', m.profit >= 0 ? 'text-green-400' : 'text-red-400')}>{fmt$(m.profit)}</td>
                    <td className={cn('text-right font-bold', m.roi >= 50 ? 'text-green-400' : m.roi >= 0 ? 'text-green-300' : m.roi >= -20 ? 'text-yellow-400' : 'text-red-400')}>{m.roi.toFixed(1)}%</td>
                    <td className="text-right text-gray-400">{fmt$(m.epc)}</td>
                    <td>
                      <Link href={`/campaigns/${c.id}`}>
                        <Button size="sm">Edit</Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
