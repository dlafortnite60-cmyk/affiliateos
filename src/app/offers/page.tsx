import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBadge, Badge, Button, EmptyState, PageHeader } from '@/components/ui/index'
import { fmt$ } from '@/lib/metrics'

export default async function OffersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <PageHeader
          title="Offers"
          description={`${offers?.length ?? 0} total offers`}
          actions={<Link href="/offers/new"><Button variant="primary" size="sm">+ New Offer</Button></Link>}
        />
        <div className="p-6">
          {!offers?.length ? (
            <EmptyState
              title="No offers yet"
              description="Add your first affiliate offer to start tracking performance."
              action={<Link href="/offers/new"><Button variant="primary">+ Add First Offer</Button></Link>}
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Offer</th><th>Network</th><th>GEO</th><th>Vertical</th>
                      <th>Payout</th><th>Flow</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map(offer => (
                      <tr key={offer.id}>
                        <td>
                          <div className="font-medium text-gray-100">{offer.name}</div>
                          <div className="text-xs text-gray-500">{offer.product_type}</div>
                        </td>
                        <td className="text-gray-400">{offer.network ?? '—'}</td>
                        <td>{offer.geo ?? '—'}</td>
                        <td>{offer.vertical ? <Badge variant="purple">{offer.vertical}</Badge> : '—'}</td>
                        <td className="font-semibold text-green-400">{offer.payout ? fmt$(offer.payout) : '—'}</td>
                        <td>{offer.flow_type ? <Badge variant="blue">{offer.flow_type}</Badge> : '—'}</td>
                        <td><StatusBadge status={offer.status} /></td>
                        <td>
                          <div className="flex gap-1">
                            <Link href={`/offers/${offer.id}`}>
                              <Button size="sm">Edit</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
