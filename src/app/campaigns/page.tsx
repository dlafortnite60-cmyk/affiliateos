import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageHeader, Button, EmptyState, Badge } from '@/components/ui/index'
import { CampaignsTableClient } from './CampaignsTableClient'

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: campaigns }, { data: offers }, { data: funnels }] = await Promise.all([
    supabase.from('campaigns')
      .select('*, offer:offers(id,name), funnel:funnels(id,name), creative:creatives(id,name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(500),
    supabase.from('offers').select('id,name').eq('user_id', user.id),
    supabase.from('funnels').select('id,name').eq('user_id', user.id),
  ])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <PageHeader
          title="Campaign Metrics"
          description="Daily performance data with auto-calculated KPIs"
          actions={
            <div className="flex gap-2">
              <Link href="/import"><Button size="sm">⬆ Import CSV</Button></Link>
              <Link href="/campaigns/new"><Button variant="primary" size="sm">+ Add Campaign</Button></Link>
            </div>
          }
        />
        <div className="p-6">
          {!campaigns?.length ? (
            <EmptyState
              title="No campaign data yet"
              description="Add campaigns manually or import a CSV from Meta Ads, TikTok, or your affiliate network."
              action={
                <div className="flex gap-2 justify-center">
                  <Link href="/campaigns/new"><Button variant="primary">+ Add Manually</Button></Link>
                  <Link href="/import"><Button>⬆ Import CSV</Button></Link>
                </div>
              }
            />
          ) : (
            <CampaignsTableClient
              campaigns={campaigns ?? []}
              offers={offers ?? []}
              funnels={funnels ?? []}
            />
          )}
        </div>
      </main>
    </div>
  )
}
