import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageHeader } from '@/components/ui/index'
import { CampaignForm } from '@/components/forms/CampaignForm'

export default async function NewCampaignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: offers }, { data: funnels }, { data: creatives }] = await Promise.all([
    supabase.from('offers').select('id,name').eq('user_id', user.id),
    supabase.from('funnels').select('id,name').eq('user_id', user.id),
    supabase.from('creatives').select('id,name').eq('user_id', user.id),
  ])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <PageHeader title="Add Campaign Metrics" description="Log a new campaign performance entry" />
        <div className="p-6 max-w-4xl">
          <div className="card p-6">
            <CampaignForm offers={offers??[]} funnels={funnels??[]} creatives={creatives??[]} />
          </div>
        </div>
      </main>
    </div>
  )
}
