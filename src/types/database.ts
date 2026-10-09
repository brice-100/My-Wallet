export type CurrencyCode =
  | 'XOF'
  | 'XAF'
  | 'GNF'
  | 'CDF'
  | 'MAD'
  | 'DZD'
  | 'TND'
  | 'NGN'
  | 'GHS'
  | 'KES'
  | 'EUR'
  | 'USD'

export type UserPlan = 'free' | 'premium'
export type UserRole = 'user' | 'admin'
export type UserStatus = 'active' | 'suspended' | 'deleted'

export type WalletType = 'cash' | 'mobile_money' | 'bank'
export type CategoryType = 'income' | 'expense'
export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer_in'
  | 'transfer_out'
  | 'opening'
export type TransactionSource = 'manual' | 'sms' | 'import'
export type BudgetPeriod = 'monthly' | 'yearly'

export interface Profile {
  id: string
  full_name: string | null
  currency: CurrencyCode
  pay_day: number
  plan: UserPlan
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface Wallet {
  id: string
  user_id: string
  name: string
  type: WalletType
  provider: string | null
  archived: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: CategoryType
  icon: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Transaction {
  id: string
  user_id: string
  wallet_id: string
  category_id: string | null
  amount: number // Entier en unité minimale (ex: 5000 FCFA)
  type: TransactionType
  occurred_at: string
  note: string | null
  transfer_group_id: string | null
  source: TransactionSource
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Jointures optionnelles pour affichage
  wallet?: Wallet
  category?: Category
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  period: BudgetPeriod
  created_at: string
  updated_at: string
  deleted_at: string | null
  category?: Category
}

// Interfaces des Vues SQL
export interface WalletBalanceView {
  wallet_id: string
  user_id: string
  name: string
  type: WalletType
  provider: string | null
  archived: boolean
  balance: number
}

export interface GlobalBalanceView {
  user_id: string
  balance: number
}

export interface MonthlyFlowView {
  user_id: string
  month: string // format YYYY-MM-DD
  income: number
  expense: number
}

export interface SpendingByCategoryMonthView {
  user_id: string
  month: string
  category_id: string | null
  category_name: string | null
  total: number
}

export interface BudgetProgressView {
  budget_id: string
  user_id: string
  category_id: string
  category_name: string
  period: BudgetPeriod
  budget_amount: number
  spent: number
  percent_used: number
}

// -------------------------------------------------------------
// Tontines & Dettes Informelles (Cahier des charges bmad-build V1.5)
// -------------------------------------------------------------
export type TontineFrequency = 'weekly' | 'biweekly' | 'monthly'
export type TontineStatus = 'active' | 'completed' | 'archived'

export interface Tontine {
  id: string
  user_id: string
  name: string
  contribution_amount: number // en FCFA (ex: 25000)
  frequency: TontineFrequency
  members_count: number // ex: 10
  my_turn_month: string // ex: "Novembre 2026"
  total_pool: number // contribution_amount * members_count
  contributed_so_far: number // cotisations versées par l'utilisateur
  next_due_date: string // ex: "2026-11-05"
  status: TontineStatus
  wallet_id?: string | null
  created_at: string
}

export type DebtType = 'lent' | 'borrowed' // lent = On me doit (créance), borrowed = Je dois (dette)
export type DebtStatus = 'pending' | 'settled'

export interface Debt {
  id: string
  user_id: string
  type: DebtType
  person_name: string
  amount: number
  paid_amount: number
  due_date: string | null
  note: string | null
  status: DebtStatus
  wallet_id?: string | null
  created_at: string
}
