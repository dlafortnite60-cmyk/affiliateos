import { cn } from '@/lib/utils'

// ─── Badge ───────────────────────────────────────────────────
type BadgeVariant = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'

const badgeClasses: Record<BadgeVariant, string> = {
  blue:   'bg-blue-900/40 text-blue-400 border-blue-800/50',
  green:  'bg-green-900/40 text-green-400 border-green-800/50',
  red:    'bg-red-900/40 text-red-400 border-red-800/50',
  yellow: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50',
  purple: 'bg-purple-900/40 text-purple-400 border-purple-800/50',
  gray:   'bg-gray-800 text-gray-400 border-gray-700',
}

export function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border', badgeClasses[variant])}>
      {children}
    </span>
  )
}

// ─── Status badges ───────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    New: 'blue', Testing: 'yellow', Scaling: 'green', Paused: 'gray',
    Dead: 'red', Active: 'green', Inactive: 'gray', Winner: 'green',
    Loser: 'red',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>
}

// ─── Button ──────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}

const btnBase = 'inline-flex items-center gap-1.5 font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50'
const btnVariants = {
  default:  'bg-[#21262d] border border-[#484f58] text-gray-300 hover:bg-[#30363d]',
  primary:  'bg-blue-600 border border-blue-500 text-white hover:bg-blue-700',
  danger:   'bg-red-900/30 border border-red-800 text-red-400 hover:bg-red-900/50',
  ghost:    'text-gray-400 hover:text-gray-200 hover:bg-[#21262d]',
}
const btnSizes = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
}

export function Button({ variant = 'default', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(btnBase, btnVariants[variant], btnSizes[size], className)}
      {...props}
    />
  )
}

// ─── PageHeader ──────────────────────────────────────────────
export function PageHeader({
  title, description, actions
}: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-base font-semibold text-gray-100">{title}</h1>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────
export function EmptyState({ title, description, action }: {
  title: string; description: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-4xl mb-3">📭</div>
      <h3 className="font-medium text-gray-200 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  )
}

// ─── Metric Card ─────────────────────────────────────────────
export function MetricCard({ label, value, sub, subClass }: {
  label: string; value: string; sub?: string; subClass?: string
}) {
  return (
    <div className="metric-card">
      <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">{label}</div>
      <div className="text-2xl font-bold text-gray-100 tracking-tight">{value}</div>
      {sub && <div className={cn('text-xs mt-1', subClass ?? 'text-gray-500')}>{sub}</div>}
    </div>
  )
}

// ─── Loading spinner ─────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-[#30363d] border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
}

// ─── Alert ───────────────────────────────────────────────────
export function Alert({ type, message }: { type: 'error' | 'success' | 'warning'; message: string }) {
  const cls = {
    error:   'bg-red-900/30 border-red-800 text-red-400',
    success: 'bg-green-900/30 border-green-800 text-green-400',
    warning: 'bg-yellow-900/30 border-yellow-800 text-yellow-400',
  }
  return (
    <div className={cn('px-4 py-3 rounded-lg border text-sm', cls[type])}>
      {message}
    </div>
  )
}
