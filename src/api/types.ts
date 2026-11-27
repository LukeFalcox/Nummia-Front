/**
 * NUMMIA — tipos da API para o Front-End (React + TypeScript).
 * Fonte: Nummia-Back (docs/frontend/types.ts). Mantenha sincronizado com o back-end.
 *
 * Convenções da API:
 * - IDs são UUID (string).
 * - Valores monetários são number com 2 casas (ex.: 1250.5 => R$ 1.250,50). Formate no Front.
 * - Datas: "yyyy-MM-dd" (LocalDate); meses: "yyyy-MM"; instantes: ISO-8601 UTC.
 * - Percentuais vêm de 0 a 100.
 * - Campos nulos NÃO são enviados no JSON (por isso aparecem como opcionais "?").
 */

export type UUID = string
/** "2026-11-27" */
export type ISODate = string
/** "2026-11" */
export type YearMonth = string
/** "2026-11-27T13:45:57.387Z" */
export type ISODateTime = string

// ---------- Erros (RFC 7807 ProblemDetail) ----------

export interface ApiError {
  status: number
  title: string
  detail: string
  instance?: string
  /** Erros por campo em validações (HTTP 400). */
  errors?: Record<string, string>
}

export interface Page<T> {
  content: Array<T>
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// ---------- Autenticação / Usuário ----------

export interface RegisterRequest {
  name: string
  email: string
  /** 8 a 72 caracteres, com letras e números. */
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface User {
  id: UUID
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  currency: string
  monthlyIncome?: number
  aiAssistantEnabled: boolean
  notificationsEnabled: boolean
  createdAt: ISODateTime
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  /** Validade do accessToken em segundos (padrão 900 = 15 min). */
  expiresIn: number
  user: User
}

export interface UpdateProfileRequest {
  name: string
  currency?: string
  monthlyIncome?: number | null
  aiAssistantEnabled?: boolean
  notificationsEnabled?: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// ---------- Contas ----------

export type AccountType =
  'CHECKING' | 'SAVINGS' | 'WALLET' | 'CREDIT_CARD' | 'INVESTMENT' | 'OTHER'

export interface AccountRequest {
  name: string
  type: AccountType
  institution?: string
  initialBalance?: number
  creditLimit?: number
  /** "#RRGGBB" */
  color?: string
  archived?: boolean
}

export interface Account {
  id: UUID
  name: string
  type: AccountType
  institution?: string
  initialBalance: number
  /** Saldo atual calculado pelo Back-End (saldo inicial + movimentações até hoje). */
  currentBalance: number
  creditLimit?: number
  color?: string
  archived: boolean
}

// ---------- Categorias ----------

export type CategoryType = 'INCOME' | 'EXPENSE'

export interface CategoryRequest {
  name: string
  type: CategoryType
  color?: string
  /** Nome do ícone do Lucide (ex.: "utensils"). */
  icon?: string
  archived?: boolean
}

export interface Category {
  id: UUID
  name: string
  type: CategoryType
  color?: string
  icon?: string
  archived: boolean
}

// ---------- Movimentações ----------

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export interface TransactionRequest {
  type: TransactionType
  /** Sempre positivo; o sentido vem do type. */
  amount: number
  description: string
  date: ISODate
  accountId: UUID
  /** Obrigatório apenas para TRANSFER. */
  destinationAccountId?: UUID
  /** Obrigatório para INCOME/EXPENSE (categoria do mesmo tipo). */
  categoryId?: UUID
  notes?: string
  recurring?: boolean
}

export interface Transaction {
  id: UUID
  type: TransactionType
  amount: number
  description: string
  date: ISODate
  account: { id: UUID; name: string }
  destinationAccount?: { id: UUID; name: string }
  category?: { id: UUID; name: string; color?: string; icon?: string }
  notes?: string
  recurring: boolean
  createdAt: ISODateTime
}

export interface TransactionFilters {
  from?: ISODate
  to?: ISODate
  type?: TransactionType
  accountId?: UUID
  categoryId?: UUID
  minAmount?: number
  maxAmount?: number
  recurring?: boolean
  /** Busca na descrição. */
  search?: string
  /** Começa em 0. */
  page?: number
  /** 1 a 100 (padrão 20). */
  size?: number
}

// ---------- Orçamentos ----------

export type BudgetStatus = 'OK' | 'WARNING' | 'EXCEEDED'

export interface BudgetRequest {
  /** Somente categorias de despesa. */
  categoryId: UUID
  month: YearMonth
  limitAmount: number
  /** % de uso para alerta (1-100, padrão 80). */
  alertThreshold?: number
}

export interface Budget {
  id: UUID
  categoryId: UUID
  categoryName: string
  categoryColor?: string
  categoryIcon?: string
  month: YearMonth
  limitAmount: number
  spent: number
  /** Negativo quando o limite foi ultrapassado. */
  remaining: number
  usedPercentage: number
  alertThreshold: number
  status: BudgetStatus
}

// ---------- Metas ----------

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export interface GoalRequest {
  name: string
  description?: string
  targetAmount: number
  /** Apenas na criação: valor já guardado. */
  initialAmount?: number
  /** Não pode estar no passado na criação. */
  deadline?: ISODate
  /** Apenas na edição (ex.: cancelar a meta). */
  status?: GoalStatus
  icon?: string
  color?: string
}

export interface Goal {
  id: UUID
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  remainingAmount: number
  progressPercentage: number
  deadline?: ISODate
  monthsRemaining?: number
  /** Quanto guardar por mês para cumprir o prazo. */
  monthlyAmountNeeded?: number
  status: GoalStatus
  icon?: string
  color?: string
}

export interface ContributionRequest {
  /** Positivo = aporte, negativo = resgate. */
  amount: number
  date?: ISODate
  note?: string
}

export interface Contribution {
  id: UUID
  amount: number
  date: ISODate
  note?: string
}

// ---------- Análises / Dashboard ----------

export type Severity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'

export interface CategoryShare {
  categoryId: UUID
  name: string
  color?: string
  icon?: string
  total: number
  percentage: number
}

export interface FinancialSummary {
  month: YearMonth
  totalBalance: number
  income: number
  expense: number
  result: number
  savingsRate: number
  expensesByCategory: Array<CategoryShare>
  incomesByCategory: Array<CategoryShare>
}

export interface MonthlyTotal {
  month: YearMonth
  income: number
  expense: number
  result: number
}

export interface CategoryComparison {
  categoryId: UUID
  name: string
  color?: string
  current: number
  previous: number
  difference: number
  changePercentage?: number
  trend: 'UP' | 'DOWN' | 'STABLE' | 'NEW'
}

export interface PeriodComparison {
  currentMonth: YearMonth
  previousMonth: YearMonth
  currentIncome: number
  previousIncome: number
  currentExpense: number
  previousExpense: number
  expenseChangePercentage?: number
  categories: Array<CategoryComparison>
}

export interface Anomaly {
  transactionId: UUID
  description: string
  date: ISODate
  categoryName: string
  amount: number
  categoryAverage: number
  reason: string
}

export interface Recommendation {
  type: string
  severity: Severity
  title: string
  message: string
}

export interface BudgetSuggestion {
  categoryId: UUID
  categoryName: string
  averageMonthlySpending: number
  suggestedLimit: number
  currentLimit?: number
}

export interface Dashboard {
  summary: FinancialSummary
  monthlyEvolution: Array<MonthlyTotal>
  accounts: Array<Account>
  budgets: Array<Budget>
  goals: Array<Goal>
  recentTransactions: Array<Transaction>
  unreadNotifications: number
}

// ---------- Assistente de IA ----------

export interface ChatResponse {
  messageId: UUID
  reply: string
  /** REMOTE = serviço de IA; LOCAL = respostas por regras. */
  source: 'REMOTE' | 'LOCAL'
  suggestions: Array<string>
  createdAt: ISODateTime
}

export interface AssistantMessage {
  id: UUID
  role: 'USER' | 'ASSISTANT'
  content: string
  source?: 'REMOTE' | 'LOCAL'
  createdAt: ISODateTime
}

// ---------- Notificações ----------

export type NotificationType =
  | 'BUDGET_WARNING'
  | 'BUDGET_EXCEEDED'
  | 'GOAL_NEAR'
  | 'GOAL_COMPLETED'
  | 'RECURRING_EXPENSE'
  | 'MONTHLY_SUMMARY'
  | 'INSIGHT'

export interface Notification {
  id: UUID
  type: NotificationType
  severity: Severity
  title: string
  message: string
  read: boolean
  createdAt: ISODateTime
}
