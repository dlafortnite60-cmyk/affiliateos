import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageHeader } from '@/components/ui/index'
import { FunnelForm } from '@/components/forms/FunnelForm'

export default async function EditFunnelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: funnel }, { data: offers }] = await Promise.all([
    supabase.from('funnels').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('offers').select('id,name').eq('user_id', user.id),
  ])
  if (!funnel) notFound()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <PageHeader title={`Edit: ${funnel.name}`} />
        <div className="p-6 max-w-3xl"><div className="card p-6"><FunnelForm funnel={funnel} offers={offers??[]} /></div></div>
      </main>
    </div>
  )
}
