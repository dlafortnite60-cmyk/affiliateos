import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageHeader } from '@/components/ui/index'
import { CampaignForm } from '@/components/forms/CampaignForm'

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: campaign }, { data: offers }, { data: funnels }, { data: creatives }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('offers').select('id,name').eq('user_id', user.id),
    supabase.from('funnels').select('id,name').eq('user_id', user.id),
    supabase.from('creatives').select('id,name').eq('user_id', user.id),
  ])

  if (!campaign) notFound()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <PageHeader title="Edit Campaign" description={campaign.campaign_name ?? ''} />
        <div className="p-6 max-w-4xl">
          <div className="card p-6">
            <CampaignForm campaign={campaign} offers={offers??[]} funnels={funnels??[]} creatives={creatives??[]} />
          </div>
        </div>
      </main>
    </div>
  )
}
