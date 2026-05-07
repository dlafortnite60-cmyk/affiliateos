'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Alert } from '@/components/ui/index'
import type { Offer } from '@/types'

type OfferFormData = Omit<Offer, 'id' | 'user_id' | 'created_at' | 'updated_at'>

const DEFAULTS: OfferFormData = {
  name: '', network: '', geo: '', language: '', vertical: 'Health',
  product_type: '', payout: null, flow_type: 'CPS', offer_url: '',
  status: 'New', notes: '',
}

export function OfferForm({ offer }: { offer?: Offer }) {
  const router   = useRouter()
  const supabase = createClient()
  const [data, setData]   = useState<OfferFormData>(offer ?? DEFAULTS)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function set(key: keyof OfferFormData, value: string | number | null) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data.name.trim()) { setError('Offer name is required'); return }
    setSaving(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const payload = { ...data, user_id: user.id, payout: data.payout ? +data.payout : null }
      const query = offer
        ? supabase.from('offers').update(payload).eq('id', offer.id)
        : supabase.from('offers').insert(payload)
      const { error: err } = await query
      if (err) throw err
      router.push('/offers')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!offer || !confirm('Delete this offer? This cannot be undone.')) return
    setSaving(true)
    await supabase.from('offers').delete().eq('id', offer.id)
    router.push('/offers'); router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="form-label">Offer Name *</label>
          <input className="form-input" value={data.name} onChange={e => set('name', e.target.value)} placeholder="e.g. ProBurn Weight Loss" required />
        </div>
        <div>
          <label className="form-label">Network / Advertiser</label>
          <input className="form-input" value={data.network ?? ''} onChange={e => set('network', e.target.value)} placeholder="MaxBounty, ClickBank..." />
        </div>
        <div>
          <label className="form-label">GEO</label>
          <input className="form-input" value={data.geo ?? ''} onChange={e => set('geo', e.target.value)} placeholder="US, UK, DE..." />
        </div>
        <div>
          <label className="form-label">Language</label>
          <input className="form-input" value={data.language ?? ''} onChange={e => set('language', e.target.value)} placeholder="EN, ES, DE..." />
        </div>
        <div>
          <label className="form-label">Vertical</label>
          <select className="form-input" value={data.vertical ?? ''} onChange={e => set('vertical', e.target.value)}>
            {['Health','Wellness','Nutraceuticals','Ecommerce','Finance','Dating','Other'].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Product Type</label>
          <input className="form-input" value={data.product_type ?? ''} onChange={e => set('product_type', e.target.value)} placeholder="Supplement, SkinCare..." />
        </div>
        <div>
          <label className="form-label">Payout ($)</label>
          <input className="form-input" type="number" step="0.01" value={data.payout ?? ''} onChange={e => set('payout', e.target.value ? +e.target.value : null)} placeholder="0.00" />
        </div>
        <div>
          <label className="form-label">Flow Type</label>
          <select className="form-input" value={data.flow_type ?? ''} onChange={e => set('flow_type', e.target.value as Offer['flow_type'])}>
            {['COD','CPS','CPL','Subscription'].map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" value={data.status} onChange={e => set('status', e.target.value as Offer['status'])}>
            {['New','Testing','Scaling','Paused','Dead'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Offer URL</label>
          <input className="form-input" value={data.offer_url ?? ''} onChange={e => set('offer_url', e.target.value)} placeholder="https://..." />
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Notes</label>
          <textarea className="form-input min-h-20" value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : offer ? 'Update Offer' : 'Create Offer'}</Button>
          <Button type="button" onClick={() => router.push('/offers')}>Cancel</Button>
        </div>
        {offer && (
          <Button type="button" variant="danger" onClick={handleDelete} disabled={saving}>Delete Offer</Button>
        )}
      </div>
    </form>
  )
}
