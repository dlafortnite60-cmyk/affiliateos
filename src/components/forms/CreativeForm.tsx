'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Alert } from '@/components/ui/index'
import type { Creative, Offer, Funnel } from '@/types'

type FormData = Omit<Creative, 'id'|'user_id'|'created_at'|'updated_at'|'offer'|'funnel'>
const DEFAULTS: FormData = {
  name:'', offer_id:null, funnel_id:null, platform:'Meta Ads',
  format:'Video', hook:'', angle:'', file_url:'', status:'New', notes:'',
}

export function CreativeForm({ creative, offers, funnels }: {
  creative?: Creative
  offers:  Pick<Offer,'id'|'name'>[]
  funnels: Pick<Funnel,'id'|'name'>[]
}) {
  const router=useRouter(); const supabase=createClient()
  const [data,setData]=useState<FormData>(creative??DEFAULTS)
  const [error,setError]=useState(''); const [saving,setSaving]=useState(false)

  function set(k: keyof FormData, v: string|null){setData(p=>({...p,[k]:v}))}

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault(); if(!data.name.trim()){setError('Name required');return}
    setSaving(true); setError('')
    try {
      const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error('Not authenticated')
      const payload={...data,user_id:user.id,offer_id:data.offer_id||null,funnel_id:data.funnel_id||null}
      const {error:err}=creative
        ? await supabase.from('creatives').update(payload).eq('id',creative.id)
        : await supabase.from('creatives').insert(payload)
      if(err) throw err
      router.push('/creatives'); router.refresh()
    } catch(err:unknown){setError(err instanceof Error?err.message:'Save failed')}
    finally{setSaving(false)}
  }

  async function handleDelete(){
    if(!creative||!confirm('Delete?'))return
    await supabase.from('creatives').delete().eq('id',creative.id)
    router.push('/creatives'); router.refresh()
  }

  return(
    <form onSubmit={handleSubmit} className="space-y-6">
      {error&&<Alert type="error" message={error}/>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><label className="form-label">Creative Name *</label>
          <input className="form-input" value={data.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. UGC_Hook1_ProBurn_v3" required/></div>
        <div><label className="form-label">Related Offer</label>
          <select className="form-input" value={data.offer_id??''} onChange={e=>set('offer_id',e.target.value||null)}>
            <option value="">— Select Offer —</option>{offers.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
        <div><label className="form-label">Related Funnel</label>
          <select className="form-input" value={data.funnel_id??''} onChange={e=>set('funnel_id',e.target.value||null)}>
            <option value="">— Select Funnel —</option>{funnels.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
        <div><label className="form-label">Platform</label>
          <select className="form-input" value={data.platform??''} onChange={e=>set('platform',e.target.value)}>
            {['Meta Ads','TikTok Ads','Native Ads','Google Ads'].map(p=><option key={p}>{p}</option>)}</select></div>
        <div><label className="form-label">Format</label>
          <select className="form-input" value={data.format??''} onChange={e=>set('format',e.target.value)}>
            {['Video','Static','Carousel','UGC','Text'].map(f=><option key={f}>{f}</option>)}</select></div>
        <div className="md:col-span-2"><label className="form-label">Hook</label>
          <input className="form-input" value={data.hook??''} onChange={e=>set('hook',e.target.value)} placeholder="e.g. I lost 30lbs doing this every morning..."/></div>
        <div className="md:col-span-2"><label className="form-label">Main Angle</label>
          <input className="form-input" value={data.angle??''} onChange={e=>set('angle',e.target.value)} placeholder="e.g. Transformation / Pain-to-Solution"/></div>
        <div className="md:col-span-2"><label className="form-label">Creative File URL / Preview Link</label>
          <input className="form-input" value={data.file_url??''} onChange={e=>set('file_url',e.target.value)} placeholder="https://drive.google.com/..."/></div>
        <div><label className="form-label">Status</label>
          <select className="form-input" value={data.status} onChange={e=>set('status',e.target.value)}>
            {['New','Testing','Winner','Loser','Paused'].map(s=><option key={s}>{s}</option>)}</select></div>
        <div className="md:col-span-2"><label className="form-label">Notes</label>
          <textarea className="form-input min-h-20" value={data.notes??''} onChange={e=>set('notes',e.target.value)}/></div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={saving}>{saving?'Saving...':creative?'Update':'Create Creative'}</Button>
          <Button type="button" onClick={()=>router.push('/creatives')}>Cancel</Button>
        </div>
        {creative&&<Button type="button" variant="danger" onClick={handleDelete}>Delete</Button>}
      </div>
    </form>
  )
}
