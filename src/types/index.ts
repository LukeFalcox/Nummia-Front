export type ID = string

export interface User {
  id: ID
  name: string
  email: string
  avatarUrl?: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export type AccountType =
  'checking' | 'savings' | 'credit_card' | 'investment' | 'wallet'

export interface Account {
  id: ID
  name: string
  institution: string
  type: AccountType
  balance: number
  /** Para cartões de crédito. */
  creditLimit?: number
  color: string
}

export type TransactionType = 'income' | 'expense'

export interface Category {
  id: ID
  name: string
  type: TransactionType
  color: string
  icon: string
  /** Limite mensal planejado (apenas despesas). */
  monthlyLimit?: number
}

export interface Transaction {
  id: ID
  description: string
  amount: number
  type: TransactionType
  date: string
  categoryId: ID
  accountId: ID
  notes?: string
}

export type TransactionInput = Omit<Transaction, 'id'>

export interface Goal {
  id: ID
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  color: string
}

export type GoalInput = Omit<Goal, 'id'>

export interface MonthlySummary {
  month: string
  income: number
  expense: number
}

export interface CategorySpending {
  categoryId: ID
  name: string
  color: string
  amount: number
  limit?: number
}

export interface DashboardSummary {
  totalBalance: number
  monthIncome: number
  monthExpense: number
  savingsRate: number
  history: Array<MonthlySummary>
  spendingByCategory: Array<CategorySpending>
  recentTransactions: Array<Transaction>
  insights: Array<Insight>
}

export interface Insight {
  id: ID
  level: 'info' | 'warning' | 'success'
  title: string
  description: string
}

export interface ChatMessage {
  id: ID
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}
