'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',        icon: '⊞',  section: 'Overview' },
  { href: '/offers',     label: 'Offers',            icon: '📣', section: 'Management' },
  { href: '/funnels',    label: 'Funnels',           icon: '⚗',  section: null },
  { href: '/creatives',  label: 'Creatives',         icon: '🎨', section: null },
  { href: '/campaigns',  label: 'Campaign Metrics',  icon: '📈', section: 'Campaigns' },
  { href: '/import',     label: 'CSV Import',        icon: '⬆',  section: null },
  { href: '/finance',    label: 'Finance Tracker',   icon: '💰', section: 'Finance' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 min-w-56 bg-[#161b22] border-r border-[#30363d] flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#30363d] flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs">A</div>
        <div>
          <div className="font-semibold text-gray-100 text-sm leading-none">AffiliateOS</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Perf Hub</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <div key={item.href as any}>
            {item.section && (
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 mt-1">{item.section}</div>
            )}
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors',
                pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  ? 'bg-blue-600/20 text-blue-400 font-medium'
                  : 'text-gray-400 hover:bg-[#21262d] hover:text-gray-200'
              )}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-[#30363d]">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <span>↩</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
