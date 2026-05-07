'use client'

import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcFinanceKPIs, calcMonthlyPnL, groupByCategory } from '@/lib/finance'
import { fmt$, fmtNum } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import type { Transaction, Wallet, TransactionCategory, TransactionType } from '@/types/finance'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, ALL_CATEGORIES, PAYMENT_METHODS } from '@/types/finance'
import type { Offer } from '@/types'
import { Button, MetricCard, Alert, StatusBadge } from '@/components/ui/index'

// ─── Props ───────────────────────────────────────────────────
interface Props {
  initialTransactions: Transaction[]
  initialWallet:       Wallet | null
  offers:              Pick<Offer, 'id' | 'name'>[]
  userId:              string
}

// ─── Modal state ──────────────────────────────────────────────
type ModalMode = 'none' | 'wallet' | 'add' | 'edit'

const EMPTY_TX: Omit<Transaction, 'id'|'user_id'|'created_at'|'updated_at'|'offer'> = {
  date: new Date().toISOString().split('T')[0],
  type: 'expense',
  amount: 0,
  currency: 'USD',
  category: 'ad_spend',
  description: '',
  offer_id: null,
  campaign_id: null,
  payment_method: '',
  network: '',
  reference: '',
  notes: '',
}

// ─── Helpers ──────────────────────────────────────────────────
const categoryLabel = (cat: string) => ALL_CATEGORIES.find(c => c.value === cat)?.label ?? cat
const categoryIcon  = (cat: string) => ALL_CATEGORIES.find(c => c.value === cat)?.icon ?? '•'

const PIE_COLORS = ['#58a6ff','#3fb950','#d29922','#f85149','#bc8cff','#e3b341','#79c0ff','#56d364']

export function FinanceClient({ initialTransactions, initialWallet, offers, userId }: Props) {
  const supabase = createClient()

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [wallet, setWallet]             = useState<Wallet | null>(initialWallet)
  const [modal, setModal]               = useState<ModalMode>('none')
  const [editTx, setEditTx]             = useState<Transaction | null>(null)
  const [formData, setFormData]         = useState({ ...EMPTY_TX })
  const [walletBalance, setWalletBalance] = useState(String(initialWallet?.starting_balance ?? ''))
  const [walletNotes, setWalletNotes]   = useState(initialWallet?.notes ?? '')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [filterType, setFilterType]     = useState<'all'|'income'|'expense'>('all')
  const [filterCat, setFilterCat]       = useState('')
  const [filterFrom, setFilterFrom]     = useState('')
  const [filterTo, setFilterTo]         = useState('')
  const [tab, setTab]                   = useState<'overview'|'transactions'>('overview')

  // ── KPIs ──────────────────────────────────────────────────
  const kpis     = useMemo(() => calcFinanceKPIs(transactions, wallet), [transactions, wallet])
  const monthly  = useMemo(() => calcMonthlyPnL(transactions), [transactions])
  const byExpCat = useMemo(() => groupByCategory(transactions, 'expense'), [transactions])
  const byIncCat = useMemo(() => groupByCategory(transactions, 'income'), [transactions])

  // ── Filtered transactions ──────────────────────────────────
  const filtered = useMemo(() => transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (filterCat  && t.category !== filterCat)        return false
    if (filterFrom && t.date < filterFrom)              return false
    if (filterTo   && t.date > filterTo)                return false
    return true
  }), [transactions, filterType, filterCat, filterFrom, filterTo])

  // ── Wallet save ────────────────────────────────────────────
  async function saveWallet() {
    setSaving(true); setError('')
    try {
      const bal = parseFloat(walletBalance) || 0
      if (wallet) {
        const { data, error: e } = await supabase.from('wallets')
          .update({ starting_balance: bal, notes: walletNotes, user_id: userId })
          .eq('id', wallet.id).select().single()
        if (e) throw e
        setWallet(data)
      } else {
        const { data, error: e } = await supabase.from('wallets')
          .insert({ user_id: userId, starting_balance: bal, notes: walletNotes })
          .select().single()
        if (e) throw e
        setWallet(data)
      }
      setModal('none')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  // ── Transaction save ───────────────────────────────────────
  async function saveTx() {
    setSaving(true); setError('')
    try {
      const payload = {
        ...formData,
        user_id:    userId,
        amount:     parseFloat(String(formData.amount)) || 0,
        offer_id:   formData.offer_id   || null,
        network:    formData.network    || null,
        reference:  formData.reference  || null,
        payment_method: formData.payment_method || null,
        description: formData.description || null,
        notes:       formData.notes || null,
      }
      if (payload.amount <= 0) throw new Error('Amount must be greater than 0')

      if (editTx) {
        const { data, error: e } = await supabase.from('transactions')
          .update(payload).eq('id', editTx.id).select('*, offer:offers(id,name)').single()
        if (e) throw e
        setTransactions(prev => prev.map(t => t.id === editTx.id ? data : t))
      } else {
        const { data, error: e } = await supabase.from('transactions')
          .insert(payload).select('*, offer:offers(id,name)').single()
        if (e) throw e
        setTransactions(prev => [data, ...prev])
      }
      setModal('none'); setEditTx(null)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function deleteTx(id: string) {
    if (!confirm('Delete this transaction?')) return
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  function openAdd(type: TransactionType = 'expense') {
    setFormData({ ...EMPTY_TX, type, category: type === 'expense' ? 'ad_spend' : 'affiliate_payout' })
    setEditTx(null); setError(''); setModal('add')
  }
  function openEdit(tx: Transaction) {
    setFormData({ ...tx }); setEditTx(tx); setError(''); setModal('edit')
  }

  const balanceColor = kpis.currentBalance >= (kpis.startingBalance * 0.5) ? 'text-green-400'
    : kpis.currentBalance >= 0 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div>
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-100">Finance Tracker</h1>
          <p className="text-xs text-gray-500">{transactions.length} transactions</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setWalletBalance(String(wallet?.starting_balance ?? '')); setWalletNotes(wallet?.notes ?? ''); setModal('wallet') }}>
            ⚙ {wallet ? 'Edit Wallet' : 'Setup Wallet'}
          </Button>
          <Button size="sm" variant="primary" onClick={() => openAdd('income')}>+ Income</Button>
          <Button size="sm" variant="danger"  onClick={() => openAdd('expense')}>− Expense</Button>
        </div>
      </div>

      {/* ── No wallet banner ── */}
      {!wallet && (
        <div className="mx-6 mt-4 bg-blue-900/20 border border-blue-700 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-blue-300">Настрой стартовый баланс</div>
            <div className="text-xs text-blue-400 mt-0.5">Укажи сколько ты вложил в тесты — это твоя точка отсчёта для отслеживания ROI.</div>
          </div>
          <Button size="sm" variant="primary" onClick={() => setModal('wallet')}>Настроить</Button>
        </div>
      )}

      <div className="p-6 space-y-5">
        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-lg p-1 w-fit">
          {(['overview','transactions'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
                tab === t ? 'bg-[#21262d] text-gray-100' : 'text-gray-500 hover:text-gray-300'
              )}>{t === 'overview' ? 'Обзор' : 'Транзакции'}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="metric-card col-span-2 sm:col-span-1">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Текущий баланс</div>
                <div className={cn('text-3xl font-bold tracking-tight', balanceColor)}>{fmt$(kpis.currentBalance)}</div>
                <div className="text-xs text-gray-500 mt-1">Старт: {fmt$(kpis.startingBalance)}</div>
                <div className="mt-2 h-1.5 bg-[#30363d] rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', kpis.recoveryPct >= 100 ? 'bg-green-500' : kpis.recoveryPct >= 50 ? 'bg-yellow-500' : 'bg-red-500')}
                    style={{ width: `${Math.min(Math.max(kpis.recoveryPct, 0), 100)}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{kpis.recoveryPct}% от старта</div>
              </div>
              <MetricCard label="Всего доходов"  value={fmt$(kpis.totalIncome)}
                sub={`Выплаты: ${fmt$(kpis.payoutsTotal)}`} subClass="text-green-400" />
              <MetricCard label="Всего расходов" value={fmt$(kpis.totalExpense)}
                sub={`Реклама: ${fmt$(kpis.adSpendTotal)}`} subClass="text-red-400" />
              <MetricCard label="Чистая прибыль" value={fmt$(kpis.netProfit)}
                sub={`ROI: ${kpis.roi}%`}
                subClass={kpis.netProfit >= 0 ? 'text-green-400' : 'text-red-400'} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Рекламный спенд"  value={fmt$(kpis.adSpendTotal)}   sub="Все платформы" />
              <MetricCard label="Сервисы / Прочее" value={fmt$(kpis.servicesTotal)}  sub="Трекер, хостинг, VPN..." />
              <MetricCard label="Burn Rate (день)"  value={fmt$(kpis.burnRateDaily)}  sub="Среднее за 30 дней" subClass="text-yellow-400" />
              <MetricCard label="ROI"               value={kpis.roi + '%'}
                sub={kpis.roi >= 0 ? '↑ В плюсе' : '↓ В минусе'}
                subClass={kpis.roi >= 0 ? 'text-green-400' : 'text-red-400'} />
            </div>

            {/* ── Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Monthly P&L bar */}
              <div className="card p-5">
                <div className="text-sm font-semibold text-gray-200 mb-0.5">Доходы vs Расходы по месяцам</div>
                <div className="text-xs text-gray-500 mb-4">Monthly P&L</div>
                {monthly.length === 0
                  ? <div className="h-52 flex items-center justify-center text-sm text-gray-500">Нет данных</div>
                  : (
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={monthly} margin={{ top:4, right:4, left:0, bottom:0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                        <XAxis dataKey="month" tick={{ fill:'#6e7681', fontSize:11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill:'#6e7681', fontSize:11 }} tickLine={false} axisLine={false} tickFormatter={v=>'$'+v} />
                        <Tooltip contentStyle={{ background:'#161b22', border:'1px solid #30363d', borderRadius:8, fontSize:12 }}
                          formatter={(v: number) => [fmt$(v)]} />
                        <Bar dataKey="totalIncome"  name="Доход"   fill="#3fb950" radius={[3,3,0,0]} />
                        <Bar dataKey="totalExpense" name="Расход"  fill="#f85149" radius={[3,3,0,0]} />
                        <Bar dataKey="netProfit"    name="Прибыль" fill="#58a6ff" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                }
              </div>

              {/* Expense breakdown pie */}
              <div className="card p-5">
                <div className="text-sm font-semibold text-gray-200 mb-0.5">Структура расходов</div>
                <div className="text-xs text-gray-500 mb-4">По категориям</div>
                {byExpCat.length === 0
                  ? <div className="h-52 flex items-center justify-center text-sm text-gray-500">Нет расходов</div>
                  : (
                    <div className="flex gap-4 items-center">
                      <ResponsiveContainer width="55%" height={180}>
                        <PieChart>
                          <Pie data={byExpCat} dataKey="amount" nameKey="category"
                            cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                            {byExpCat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background:'#161b22', border:'1px solid #30363d', borderRadius:8, fontSize:12 }}
                            formatter={(v: number, name: string) => [fmt$(v), categoryLabel(name)]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-1.5">
                        {byExpCat.slice(0,6).map((row, i) => (
                          <div key={row.category} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <span className="text-gray-400 truncate max-w-[100px]">{categoryLabel(row.category)}</span>
                            </div>
                            <span className="text-gray-300 font-medium">{fmt$(row.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }
              </div>
            </div>

            {/* ── Quick summary ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TopCategoryTable title="💸 Топ расходы" rows={byExpCat} />
              <TopCategoryTable title="💰 Источники дохода" rows={byIncCat} />
            </div>
          </>
        )}

        {tab === 'transactions' && (
          <>
            {/* ── Filters ── */}
            <div className="flex flex-wrap gap-3 bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest self-center">Фильтр</span>
              <select className="form-input !w-auto text-xs py-1.5" value={filterType} onChange={e => setFilterType(e.target.value as typeof filterType)}>
                <option value="all">Все</option>
                <option value="income">Доходы</option>
                <option value="expense">Расходы</option>
              </select>
              <select className="form-input !w-auto text-xs py-1.5" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">Все категории</option>
                <optgroup label="Доходы">{INCOME_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</optgroup>
                <optgroup label="Расходы">{EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</optgroup>
              </select>
              <input type="date" className="form-input !w-auto text-xs py-1.5" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
              <span className="text-gray-600 text-xs self-center">→</span>
              <input type="date" className="form-input !w-auto text-xs py-1.5" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
              <button onClick={() => { setFilterType('all'); setFilterCat(''); setFilterFrom(''); setFilterTo('') }}
                className="text-xs text-gray-500 hover:text-red-400 px-2 rounded hover:bg-red-900/20 transition-colors">✕ Сбросить</button>
            </div>

            <div className="text-xs text-gray-500 mb-1">{filtered.length} транзакций</div>

            {/* ── Table ── */}
            <div className="card overflow-hidden">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  <div className="text-3xl mb-2">📭</div>
                  Нет транзакций. Нажми «+ Income» или «− Expense».
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Дата</th><th>Тип</th><th>Категория</th><th>Описание</th>
                        <th>Сеть / Платформа</th><th>Оффер</th><th>Метод оплаты</th>
                        <th className="text-right">Сумма</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(tx => (
                        <tr key={tx.id}>
                          <td className="font-mono text-xs">{tx.date}</td>
                          <td>
                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
                              tx.type === 'income'
                                ? 'bg-green-900/40 text-green-400 border-green-800/50'
                                : 'bg-red-900/40 text-red-400 border-red-800/50'
                            )}>
                              {tx.type === 'income' ? '↑ Доход' : '↓ Расход'}
                            </span>
                          </td>
                          <td>
                            <span className="flex items-center gap-1.5 text-sm">
                              <span>{categoryIcon(tx.category)}</span>
                              <span className="text-gray-300">{categoryLabel(tx.category)}</span>
                            </span>
                          </td>
                          <td className="text-gray-400 max-w-[160px] truncate">{tx.description || '—'}</td>
                          <td className="text-gray-400">{tx.network || '—'}</td>
                          <td className="text-blue-400 text-xs">{(tx.offer as any)?.name || '—'}</td>
                          <td className="text-gray-400 text-xs">{tx.payment_method || '—'}</td>
                          <td className={cn('text-right font-semibold text-sm',
                            tx.type === 'income' ? 'text-green-400' : 'text-red-400'
                          )}>
                            {tx.type === 'income' ? '+' : '−'}{fmt$(tx.amount)}
                          </td>
                          <td>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" onClick={() => openEdit(tx)}>✏</Button>
                              <Button size="sm" variant="danger" onClick={() => deleteTx(tx.id)}>✕</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* WALLET MODAL */}
      {/* ─────────────────────────────────────────────────────── */}
      {modal === 'wallet' && (
        <ModalOverlay onClose={() => setModal('none')}>
          <div className="text-base font-semibold text-gray-100 mb-4">💼 Настройка кошелька</div>
          {error && <Alert type="error" message={error} />}
          <div className="space-y-4 mt-4">
            <div>
              <label className="form-label">Стартовый баланс (сколько вложил в тесты, USD)</label>
              <input className="form-input text-lg font-semibold" type="number" step="0.01" min="0"
                value={walletBalance} onChange={e => setWalletBalance(e.target.value)}
                placeholder="1000.00" autoFocus />
              <div className="text-xs text-gray-500 mt-1.5">Это твоя точка отсчёта. Приложение будет показывать сколько ты уже отбил.</div>
            </div>
            <div>
              <label className="form-label">Заметки (опционально)</label>
              <textarea className="form-input" rows={2} value={walletNotes} onChange={e => setWalletNotes(e.target.value)} placeholder="Напр: вложил 1000 USDT в мае 2025" />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button variant="primary" onClick={saveWallet} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
            <Button onClick={() => setModal('none')}>Отмена</Button>
          </div>
        </ModalOverlay>
      )}

      {/* ─────────────────────────────────────────────────────── */}
      {/* ADD / EDIT TRANSACTION MODAL */}
      {/* ─────────────────────────────────────────────────────── */}
      {(modal === 'add' || modal === 'edit') && (
        <ModalOverlay onClose={() => { setModal('none'); setEditTx(null) }}>
          <div className="text-base font-semibold text-gray-100 mb-1">
            {modal === 'edit' ? 'Редактировать' : formData.type === 'income' ? '↑ Добавить доход' : '↓ Добавить расход'}
          </div>
          {error && <div className="mt-3"><Alert type="error" message={error} /></div>}
          <div className="space-y-4 mt-4">
            {/* Type toggle */}
            {modal === 'add' && (
              <div className="flex gap-2">
                {(['income','expense'] as const).map(t => (
                  <button key={t} onClick={() => {
                    const cat = t === 'income' ? 'affiliate_payout' : 'ad_spend'
                    setFormData(p => ({ ...p, type: t, category: cat as TransactionCategory }))
                  }}
                    className={cn('flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                      formData.type === t
                        ? t === 'income' ? 'bg-green-900/40 border-green-600 text-green-400' : 'bg-red-900/40 border-red-600 text-red-400'
                        : 'border-[#30363d] text-gray-500 hover:border-[#484f58]'
                    )}>
                    {t === 'income' ? '↑ Доход' : '↓ Расход'}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Дата *</label>
                <input className="form-input" type="date" value={formData.date}
                  onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Сумма (USD) *</label>
                <input className="form-input" type="number" step="0.01" min="0"
                  value={formData.amount || ''} placeholder="0.00"
                  onChange={e => setFormData(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>

            <div>
              <label className="form-label">Категория *</label>
              <select className="form-input" value={formData.category}
                onChange={e => setFormData(p => ({ ...p, category: e.target.value as TransactionCategory }))}>
                {formData.type === 'income'
                  ? INCOME_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)
                  : EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)
                }
              </select>
            </div>

            <div>
              <label className="form-label">Описание</label>
              <input className="form-input" value={formData.description ?? ''}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder={formData.type === 'income' ? 'Напр: Выплата за апрель' : 'Напр: Meta Ads — кампания US'} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">{formData.type === 'income' ? 'Партнёрская сеть' : 'Платформа / Сервис'}</label>
                <input className="form-input" value={formData.network ?? ''}
                  onChange={e => setFormData(p => ({ ...p, network: e.target.value }))}
                  placeholder={formData.type === 'income' ? 'MaxBounty, ClickBank...' : 'Meta Ads, Keitaro...'} />
              </div>
              <div>
                <label className="form-label">Метод оплаты</label>
                <select className="form-input" value={formData.payment_method ?? ''}
                  onChange={e => setFormData(p => ({ ...p, payment_method: e.target.value }))}>
                  <option value="">— Выбрать —</option>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Связанный оффер</label>
                <select className="form-input" value={formData.offer_id ?? ''}
                  onChange={e => setFormData(p => ({ ...p, offer_id: e.target.value || null }))}>
                  <option value="">— Не выбрано —</option>
                  {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Референс / Invoice #</label>
                <input className="form-input" value={formData.reference ?? ''}
                  onChange={e => setFormData(p => ({ ...p, reference: e.target.value }))}
                  placeholder="INV-0042, TX-123..." />
              </div>
            </div>

            <div>
              <label className="form-label">Заметки</label>
              <textarea className="form-input" rows={2} value={formData.notes ?? ''}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-2">
              <Button variant="primary" onClick={saveTx} disabled={saving}>
                {saving ? 'Сохранение...' : modal === 'edit' ? 'Обновить' : 'Добавить'}
              </Button>
              <Button onClick={() => { setModal('none'); setEditTx(null) }}>Отмена</Button>
            </div>
            {editTx && (
              <Button variant="danger" onClick={() => { deleteTx(editTx.id); setModal('none'); setEditTx(null) }}>
                Удалить
              </Button>
            )}
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto p-6 shadow-2xl">
        {children}
      </div>
    </div>
  )
}

function TopCategoryTable({ title, rows }: { title: string; rows: { category: string; amount: number }[] }) {
  if (rows.length === 0) return (
    <div className="card p-5">
      <div className="text-sm font-semibold text-gray-200 mb-3">{title}</div>
      <div className="text-xs text-gray-500 py-4 text-center">Нет данных</div>
    </div>
  )
  const total = rows.reduce((s, r) => s + r.amount, 0)
  return (
    <div className="card p-5">
      <div className="text-sm font-semibold text-gray-200 mb-3">{title}</div>
      <div className="space-y-2.5">
        {rows.map(row => (
          <div key={row.category}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">{categoryIcon(row.category)} {categoryLabel(row.category)}</span>
              <span className="text-gray-400 font-medium">{fmt$(row.amount)} <span className="text-gray-600">({total > 0 ? Math.round(row.amount/total*100) : 0}%)</span></span>
            </div>
            <div className="h-1 bg-[#30363d] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${total > 0 ? (row.amount/total*100) : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
