import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { FinanceClient } from './FinanceClient'

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: transactions },
    { data: wallet },
    { data: offers },
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, offer:offers(id,name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('offers')
      .select('id,name')
      .eq('user_id', user.id),
  ])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <FinanceClient
          initialTransactions={transactions ?? []}
          initialWallet={wallet}
          offers={offers ?? []}
          userId={user.id}
        />
      </main>
    </div>
  )
}
