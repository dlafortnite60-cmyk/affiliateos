import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBadge, Badge, Button, EmptyState, PageHeader } from '@/components/ui/index'

export default async function FunnelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: funnels } = await supabase
    .from('funnels')
    .select('*, offer:offers(id,name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <PageHeader
          title="Funnels"
          description="Landing pages, advertorials, quizzes, VSLs"
          actions={<Link href="/funnels/new"><Button variant="primary" size="sm">+ New Funnel</Button></Link>}
        />
        <div className="p-6">
          {!funnels?.length ? (
            <EmptyState
              title="No funnels yet"
              description="Track your landing pages and pre-landers for each offer."
              action={<Link href="/funnels/new"><Button variant="primary">+ Add First Funnel</Button></Link>}
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr><th>Funnel</th><th>Offer</th><th>Type</th><th>Angle</th><th>Language</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {funnels.map(f => (
                      <tr key={f.id}>
                        <td>
                          <div className="font-medium text-gray-100">{f.name}</div>
                          {f.lp_url && <a href={f.lp_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">↗ LP</a>}
                        </td>
                        <td className="text-blue-400">{(f.offer as any)?.name ?? '—'}</td>
                        <td>{f.funnel_type ? <Badge variant="purple">{f.funnel_type}</Badge> : '—'}</td>
                        <td className="text-gray-400 max-w-[180px] truncate">{f.angle ?? '—'}</td>
                        <td>{f.language ?? '—'}</td>
                        <td><StatusBadge status={f.status} /></td>
                        <td><Link href={`/funnels/${f.id}`}><Button size="sm">Edit</Button></Link></td>
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
