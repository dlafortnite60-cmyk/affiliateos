// ============================================================
// Finance Tracker Types
// ============================================================

export type TransactionType = 'income' | 'expense'

export type IncomeCategory =
  | 'affiliate_payout'
  | 'bonus'
  | 'refund'
  | 'other_income'

export type ExpenseCategory =
  | 'ad_spend'
  | 'tracker'
  | 'hosting'
  | 'domain'
  | 'spy_tool'
  | 'vpn'
  | 'creative'
  | 'team'
  | 'software'
  | 'other_expense'

export type TransactionCategory = IncomeCategory | ExpenseCategory

export interface Wallet {
  id:               string
  user_id:          string
  starting_balance: number
  currency:         string
  notes:            string | null
  created_at:       string
  updated_at:       string
}

export interface Transaction {
  id:             string
  user_id:        string
  date:           string
  type:           TransactionType
  amount:         number
  currency:       string
  category:       TransactionCategory
  description:    string | null
  offer_id:       string | null
  campaign_id:    string | null
  payment_method: string | null
  network:        string | null
  reference:      string | null
  notes:          string | null
  created_at:     string
  updated_at:     string
  // joined
  offer?:         { id: string; name: string } | null
}

// ============================================================
// Finance KPIs
// ============================================================
export interface FinanceKPIs {
  startingBalance:  number
  totalIncome:      number
  totalExpense:     number
  netProfit:        number
  currentBalance:   number   // startingBalance + totalIncome - totalExpense
  roi:              number   // netProfit / startingBalance * 100
  recoveryPct:      number   // currentBalance / startingBalance * 100
  adSpendTotal:     number
  servicesTotal:    number
  payoutsTotal:     number
  burnRateDaily:    number   // avg daily expenses over last 30 days
}

export interface MonthlyPnL {
  month:         string   // YYYY-MM
  totalIncome:   number
  totalExpense:  number
  netProfit:     number
}

// ============================================================
// Category metadata
// ============================================================
export const INCOME_CATEGORIES: { value: IncomeCategory; label: string; icon: string }[] = [
  { value: 'affiliate_payout', label: 'Affiliate Payout',  icon: '💰' },
  { value: 'bonus',            label: 'Bonus',             icon: '🎁' },
  { value: 'refund',           label: 'Refund',            icon: '↩️' },
  { value: 'other_income',     label: 'Other Income',      icon: '➕' },
]

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'ad_spend',     label: 'Ad Spend',          icon: '📣' },
  { value: 'tracker',      label: 'Tracker (Keitaro…)', icon: '📡' },
  { value: 'hosting',      label: 'Hosting / Server',  icon: '🖥' },
  { value: 'domain',       label: 'Domain',            icon: '🌐' },
  { value: 'spy_tool',     label: 'SPY Tool',          icon: '🔍' },
  { value: 'vpn',          label: 'VPN / Proxy',       icon: '🔒' },
  { value: 'creative',     label: 'Creative / Design', icon: '🎨' },
  { value: 'team',         label: 'Team / Freelancer', icon: '👥' },
  { value: 'software',     label: 'Software / SaaS',   icon: '💻' },
  { value: 'other_expense',label: 'Other Expense',     icon: '➖' },
]

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

export const PAYMENT_METHODS = [
  'Payoneer', 'Wire Transfer', 'Crypto (USDT)', 'Crypto (BTC)',
  'PayPal', 'Credit Card', 'Debit Card', 'Cash', 'Other',
]
