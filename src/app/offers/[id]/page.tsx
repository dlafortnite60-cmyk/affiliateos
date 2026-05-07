import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageHeader } from '@/components/ui/index'
import { OfferForm } from '@/components/forms/OfferForm'

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: offer } = await supabase.from('offers').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!offer) notFound()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <PageHeader title={`Edit: ${offer.name}`} description="Update offer details" />
        <div className="p-6 max-w-3xl">
          <div className="card p-6"><OfferForm offer={offer} /></div>
        </div>
      </main>
    </div>
  )
}
