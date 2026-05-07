import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: campaigns }, { data: offers }, { data: funnels }, { data: creatives }] = await Promise.all([
    supabase.from('campaigns').select('*, offer:offers(id,name), funnel:funnels(id,name), creative:creatives(id,name)').eq('user_id', user.id).order('date', { ascending: false }),
    supabase.from('offers').select('id,name,geo,vertical,status').eq('user_id', user.id),
    supabase.from('funnels').select('id,name,status').eq('user_id', user.id),
    supabase.from('creatives').select('id,name,status').eq('user_id', user.id),
  ])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <DashboardClient
          initialCampaigns={campaigns ?? []}
          offers={offers ?? []}
          funnels={funnels ?? []}
          creatives={creatives ?? []}
        />
      </main>
    </div>
  )
}
