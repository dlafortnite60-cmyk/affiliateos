import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageHeader } from '@/components/ui/index'
import { CreativeForm } from '@/components/forms/CreativeForm'

export default async function NewCreativePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: offers }, { data: funnels }] = await Promise.all([
    supabase.from('offers').select('id,name').eq('user_id', user.id),
    supabase.from('funnels').select('id,name').eq('user_id', user.id),
  ])
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <PageHeader title="New Creative" />
        <div className="p-6 max-w-3xl"><div className="card p-6"><CreativeForm offers={offers??[]} funnels={funnels??[]} /></div></div>
      </main>
    </div>
  )
}
