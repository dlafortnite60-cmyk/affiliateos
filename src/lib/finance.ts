import type { Transaction, Wallet, FinanceKPIs, MonthlyPnL } from '@/types/finance'

export function calcFinanceKPIs(transactions: Transaction[], wallet: Wallet | null): FinanceKPIs {
  const startingBalance = wallet?.starting_balance ?? 0

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const netProfit    = totalIncome - totalExpense
  const currentBalance = startingBalance + netProfit

  const adSpendTotal  = transactions.filter(t => t.category === 'ad_spend').reduce((s, t) => s + t.amount, 0)
  const servicesTotal = transactions.filter(t => t.type === 'expense' && t.category !== 'ad_spend').reduce((s, t) => s + t.amount, 0)
  const payoutsTotal  = transactions.filter(t => t.category === 'affiliate_payout').reduce((s, t) => s + t.amount, 0)

  // Burn rate: avg daily expense over last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoff = thirtyDaysAgo.toISOString().split('T')[0]
  const recentExpenses = transactions.filter(t => t.type === 'expense' && t.date >= cutoff).reduce((s, t) => s + t.amount, 0)
  const burnRateDaily = +(recentExpenses / 30).toFixed(2)

  return {
    startingBalance:  +startingBalance.toFixed(2),
    totalIncome:      +totalIncome.toFixed(2),
    totalExpense:     +totalExpense.toFixed(2),
    netProfit:        +netProfit.toFixed(2),
    currentBalance:   +currentBalance.toFixed(2),
    roi:              startingBalance > 0 ? +(netProfit / startingBalance * 100).toFixed(1) : 0,
    recoveryPct:      startingBalance > 0 ? +(currentBalance / startingBalance * 100).toFixed(1) : 0,
    adSpendTotal:     +adSpendTotal.toFixed(2),
    servicesTotal:    +servicesTotal.toFixed(2),
    payoutsTotal:     +payoutsTotal.toFixed(2),
    burnRateDaily,
  }
}

export function calcMonthlyPnL(transactions: Transaction[]): MonthlyPnL[] {
  const map = new Map<string, { income: number; expense: number }>()
  for (const t of transactions) {
    const month = t.date.slice(0, 7) // YYYY-MM
    const cur = map.get(month) ?? { income: 0, expense: 0 }
    if (t.type === 'income')  cur.income  += t.amount
    else                       cur.expense += t.amount
    map.set(month, cur)
  }
  return Array.from(map.entries())
    .map(([month, v]) => ({
      month,
      totalIncome:  +v.income.toFixed(2),
      totalExpense: +v.expense.toFixed(2),
      netProfit:    +(v.income - v.expense).toFixed(2),
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export function groupByCategory(transactions: Transaction[], type: 'income' | 'expense') {
  const map = new Map<string, number>()
  transactions.filter(t => t.type === type).forEach(t => {
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
  })
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount: +amount.toFixed(2) }))
    .sort((a, b) => b.amount - a.amount)
}
