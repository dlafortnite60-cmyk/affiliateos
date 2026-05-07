'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Alert } from '@/components/ui/index'
import type { Funnel, Offer } from '@/types'

type FormData = Omit<Funnel, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'offer'>
const DEFAULTS: FormData = {
  name: '', offer_id: null, funnel_type: 'Direct landing page', angle: '',
  lp_url: '', prelp_url: '', language: 'EN', status: 'Active', notes: '',
}

export function FunnelForm({ funnel, offers }: { funnel?: Funnel; offers: Pick<Offer,'id'|'name'>[] }) {
  const router   = useRouter()
  const supabase = createClient()
  const [data, setData]     = useState<FormData>(funnel ?? DEFAULTS)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(key: keyof FormData, value: string | null) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const payload = { ...data, user_id: user.id, offer_id: data.offer_id || null }
      const { error: err } = funnel
        ? await supabase.from('funnels').update(payload).eq('id', funnel.id)
        : await supabase.from('funnels').insert(payload)
      if (err) throw err
      router.push('/funnels'); router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!funnel || !confirm('Delete this funnel?')) return
    await supabase.from('funnels').delete().eq('id', funnel.id)
    router.push('/funnels'); router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert type="error" message={error} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="form-label">Funnel Name *</label>
          <input className="form-input" value={data.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Advertorial EN v2" required />
        </div>
        <div>
          <label className="form-label">Related Offer</label>
          <select className="form-input" value={data.offer_id ?? ''} onChange={e => set('offer_id', e.target.value || null)}>
            <option value="">— Select Offer —</option>
            {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Funnel Type</label>
          <select className="form-input" value={data.funnel_type ?? ''} onChange={e => set('funnel_type', e.target.value)}>
            {['Direct landing page','Advertorial','Quiz','VSL','Webinar','Leadgen'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Angle</label>
          <input className="form-input" value={data.angle ?? ''} onChange={e => set('angle', e.target.value)} placeholder="e.g. Doctors reveal secret fat burner" />
        </div>
        <div>
          <label className="form-label">Landing Page URL</label>
          <input className="form-input" type="url" value={data.lp_url ?? ''} onChange={e => set('lp_url', e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className="form-label">Pre-landing URL</label>
          <input className="form-input" type="url" value={data.prelp_url ?? ''} onChange={e => set('prelp_url', e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className="form-label">Language</label>
          <input className="form-input" value={data.language ?? ''} onChange={e => set('language', e.target.value)} placeholder="EN, ES, DE..." />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" value={data.status} onChange={e => set('status', e.target.value)}>
            {['Active','Testing','Paused','Inactive'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Notes</label>
          <textarea className="form-input min-h-20" value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : funnel ? 'Update' : 'Create Funnel'}</Button>
          <Button type="button" onClick={() => router.push('/funnels')}>Cancel</Button>
        </div>
        {funnel && <Button type="button" variant="danger" onClick={handleDelete}>Delete</Button>}
      </div>
    </form>
  )
}
