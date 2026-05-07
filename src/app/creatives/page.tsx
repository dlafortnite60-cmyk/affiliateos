import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBadge, Badge, Button, EmptyState, PageHeader } from '@/components/ui/index'

export default async function CreativesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: creatives } = await supabase
    .from('creatives')
    .select('*, offer:offers(id,name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <PageHeader
          title="Creatives"
          description="Ad creatives across all platforms"
          actions={<Link href="/creatives/new"><Button variant="primary" size="sm">+ New Creative</Button></Link>}
        />
        <div className="p-6">
          {!creatives?.length ? (
            <EmptyState
              title="No creatives yet"
              description="Track your video, static, UGC and other ad creatives."
              action={<Link href="/creatives/new"><Button variant="primary">+ Add First Creative</Button></Link>}
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr><th>Creative</th><th>Offer</th><th>Platform</th><th>Format</th><th>Hook</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {creatives.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div className="font-medium">{c.name}</div>
                          {c.file_url && <a href={c.file_url} target="_blank" rel="noopener" className="text-xs text-blue-400">↗ Preview</a>}
                        </td>
                        <td className="text-blue-400">{(c.offer as any)?.name ?? '—'}</td>
                        <td><Badge variant="blue">{c.platform ?? '—'}</Badge></td>
                        <td><Badge variant="gray">{c.format ?? '—'}</Badge></td>
                        <td className="text-gray-400 max-w-[160px] truncate">{c.hook ?? '—'}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td><Link href={`/creatives/${c.id}`}><Button size="sm">Edit</Button></Link></td>
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
