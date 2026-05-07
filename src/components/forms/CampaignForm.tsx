'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Alert } from '@/components/ui/index'
import type { Campaign, Offer, Funnel, Creative, Platform } from '@/types'

type FormData = Omit<Campaign, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'offer' | 'funnel' | 'creative'>

const DEFAULTS: FormData = {
  date: new Date().toISOString().split('T')[0],
  platform: 'Meta Ads', campaign_name: '', adset_name: '', ad_name: '',
  geo: '', offer_id: null, funnel_id: null, creative_id: null,
  spend: 0, impressions: 0, clicks: 0, leads: 0, sales: 0, revenue: 0,
  notes: '', source: 'manual', external_id: null,
}

interface Props {
  campaign?: Campaign
  offers:    Pick<Offer, 'id' | 'name'>[]
  funnels:   Pick<Funnel, 'id' | 'name'>[]
  creatives: Pick<Creative, 'id' | 'name'>[]
}

export function CampaignForm({ campaign, offers, funnels, creatives }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const [data, setData]     = useState<FormData>(campaign ?? DEFAULTS)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data.date) { setError('Date is required'); return }
    setSaving(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const payload = {
        ...data, user_id: user.id,
        spend:       +data.spend, impressions: +data.impressions, clicks: +data.clicks,
        leads:       +data.leads, sales:       +data.sales,       revenue: +data.revenue,
        offer_id:    data.offer_id    || null,
        funnel_id:   data.funnel_id   || null,
        creative_id: data.creative_id || null,
      }
      const query = campaign
        ? supabase.from('campaigns').update(payload).eq('id', campaign.id)
        : supabase.from('campaigns').insert(payload)
      const { error: err } = await query
      if (err) throw err
      router.push('/campaigns'); router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!campaign || !confirm('Delete this campaign record?')) return
    setSaving(true)
    await supabase.from('campaigns').delete().eq('id', campaign.id)
    router.push('/campaigns'); router.refresh()
  }

  const numField = (label: string, key: keyof FormData, step = '1') => (
    <div>
      <label className="form-label">{label}</label>
      <input className="form-input" type="number" step={step} min="0"
        value={(data[key] as number) ?? 0}
        onChange={e => set(key, +e.target.value as FormData[typeof key])}
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" required value={data.date}
            onChange={e => set('date', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Platform</label>
          <select className="form-input" value={data.platform ?? ''} onChange={e => set('platform', e.target.value as Platform)}>
            {['Meta Ads','TikTok Ads','Native Ads','Google Ads'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">GEO</label>
          <input className="form-input uppercase" value={data.geo ?? ''} onChange={e => set('geo', e.target.value.toUpperCase())} placeholder="US, UK..." maxLength={5} />
        </div>
        <div>
          <label className="form-label">Campaign Name</label>
          <input className="form-input" value={data.campaign_name ?? ''} onChange={e => set('campaign_name', e.target.value)} placeholder="US_ProBurn_EN_V1" />
        </div>
        <div>
          <label className="form-label">Ad Set Name</label>
          <input className="form-input" value={data.adset_name ?? ''} onChange={e => set('adset_name', e.target.value)} placeholder="Interest_Health_25-45" />
        </div>
        <div>
          <label className="form-label">Ad Name</label>
          <input className="form-input" value={data.ad_name ?? ''} onChange={e => set('ad_name', e.target.value)} placeholder="UGC_Hook1_v3" />
        </div>
        <div>
          <label className="form-label">Related Offer</label>
          <select className="form-input" value={data.offer_id ?? ''} onChange={e => set('offer_id', e.target.value || null)}>
            <option value="">— Select Offer —</option>
            {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Related Funnel</label>
          <select className="form-input" value={data.funnel_id ?? ''} onChange={e => set('funnel_id', e.target.value || null)}>
            <option value="">— Select Funnel —</option>
            {funnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Related Creative</label>
          <select className="form-input" value={data.creative_id ?? ''} onChange={e => set('creative_id', e.target.value || null)}>
            <option value="">— Select Creative —</option>
            {creatives.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Metrics */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Raw Metrics</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {numField('Spend ($)', 'spend', '0.01')}
          {numField('Impressions', 'impressions')}
          {numField('Clicks', 'clicks')}
          {numField('Leads', 'leads')}
          {numField('Sales', 'sales')}
          {numField('Revenue ($)', 'revenue', '0.01')}
        </div>
      </div>

      <div>
        <label className="form-label">Notes</label>
        <textarea className="form-input min-h-16" value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : campaign ? 'Update' : 'Add Campaign'}</Button>
          <Button type="button" onClick={() => router.push('/campaigns')}>Cancel</Button>
        </div>
        {campaign && (
          <Button type="button" variant="danger" onClick={handleDelete} disabled={saving}>Delete</Button>
        )}
      </div>
    </form>
  )
}
