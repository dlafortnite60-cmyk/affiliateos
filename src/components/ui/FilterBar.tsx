'use client'

import { type CampaignFilters } from '@/types'

interface FilterBarProps {
  filters: CampaignFilters
  offers:  { id: string; name: string }[]
  funnels: { id: string; name: string }[]
  onChange: (filters: CampaignFilters) => void
  onClear:  () => void
}

const PLATFORMS = ['Meta Ads', 'TikTok Ads', 'Native Ads', 'Google Ads']

export function FilterBar({ filters, offers, funnels, onChange, onClear }: FilterBarProps) {
  function set(key: keyof CampaignFilters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 mb-5">
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Filter</span>

      <input
        type="date" className="form-input !w-auto text-xs py-1.5"
        value={filters.dateFrom} onChange={e => set('dateFrom', e.target.value)}
      />
      <span className="text-gray-600 text-xs">→</span>
      <input
        type="date" className="form-input !w-auto text-xs py-1.5"
        value={filters.dateTo} onChange={e => set('dateTo', e.target.value)}
      />

      <select className="form-input !w-auto text-xs py-1.5" value={filters.platform} onChange={e => set('platform', e.target.value)}>
        <option value="">All Platforms</option>
        {PLATFORMS.map(p => <option key={p}>{p}</option>)}
      </select>

      <input
        type="text" placeholder="GEO (US, UK...)" maxLength={5}
        className="form-input !w-28 text-xs py-1.5 uppercase"
        value={filters.geo} onChange={e => set('geo', e.target.value.toUpperCase())}
      />

      <select className="form-input !w-auto text-xs py-1.5" value={filters.offerId} onChange={e => set('offerId', e.target.value)}>
        <option value="">All Offers</option>
        {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>

      <select className="form-input !w-auto text-xs py-1.5" value={filters.funnelId} onChange={e => set('funnelId', e.target.value)}>
        <option value="">All Funnels</option>
        {funnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>

      <button
        onClick={onClear}
        className="text-xs text-gray-500 hover:text-red-400 px-2 py-1.5 rounded hover:bg-red-900/20 transition-colors"
      >
        ✕ Clear
      </button>
    </div>
  )
}

export const DEFAULT_FILTERS: CampaignFilters = {
  dateFrom: '', dateTo: '', platform: '', geo: '', offerId: '', funnelId: '', creativeId: '',
}
