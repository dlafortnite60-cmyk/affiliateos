import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageHeader } from '@/components/ui/index'
import { FunnelForm } from '@/components/forms/FunnelForm'

export default async function NewFunnelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: offers } = await supabase.from('offers').select('id,name').eq('user_id', user.id)
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <PageHeader title="New Funnel" />
        <div className="p-6 max-w-3xl"><div className="card p-6"><FunnelForm offers={offers??[]} /></div></div>
      </main>
    </div>
  )
}
