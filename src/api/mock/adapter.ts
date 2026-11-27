/**
 * Back-end simulado para o modo demonstração. Implementa os mesmos endpoints,
 * formatos e erros (ProblemDetail) do Nummia-Back, em memória, para que as telas
 * funcionem sem servidor (ex.: GitHub Pages). NÃO é usado com VITE_API_URL definida.
 */
import { AxiosError, AxiosHeaders } from 'axios'
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import type {
  Account,
  AccountRequest,
  Anomaly,
  AuthResponse,
  Budget,
  BudgetRequest,
  BudgetSuggestion,
  CategoryComparison,
  CategoryRequest,
  CategoryShare,
  ChatResponse,
  FinancialSummary,
  Goal,
  GoalRequest,
  MonthlyTotal,
  Page,
  PeriodComparison,
  Recommendation,
  Transaction,
  TransactionRequest,
} from '../types'
import { db, toISODate, toYearMonth, uuid } from './db'
import type { StoredAccount, StoredGoal, StoredTransaction } from './db'

// ---------- infraestrutura ----------

class HttpError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public errors?: Record<string, string>,
  ) {
    super(detail)
  }
}

const titles: Record<number, string> = {
  400: 'Dados inválidos',
  401: 'Não autorizado',
  404: 'Não encontrado',
  409: 'Conflito',
  422: 'Regra de negócio violada',
}

function validate(errors: Record<string, string>) {
  if (Object.keys(errors).length > 0)
    throw new HttpError(400, 'Um ou mais campos são inválidos.', errors)
}

const round2 = (n: number) => Math.round(n * 100) / 100
const round1 = (n: number) => Math.round(n * 10) / 10
const today = () => toISODate(new Date())
const currentMonth = () => toYearMonth(new Date())

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  return toYearMonth(new Date(y, m - 1 + delta, 1))
}

function compact<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
  ) as T
}

// ---------- cálculos (no produto real, feitos pelo Back-End) ----------

function balanceOf(account: StoredAccount) {
  const limit = today()
  let balance = account.initialBalance
  for (const t of db.transactions) {
    if (t.date > limit) continue
    if (t.accountId === account.id)
      balance += t.type === 'INCOME' ? t.amount : -t.amount
    if (t.type === 'TRANSFER' && t.destinationAccountId === account.id)
      balance += t.amount
  }
  return round2(balance)
}

const toAccount = (a: StoredAccount): Account =>
  compact({ ...a, currentBalance: balanceOf(a) })

function findAccount(id: string) {
  const account = db.accounts.find((a) => a.id === id)
  if (!account) throw new HttpError(404, 'Conta não encontrada.')
  return account
}

function findCategory(id: string) {
  const category = db.categories.find((c) => c.id === id)
  if (!category) throw new HttpError(404, 'Categoria não encontrada.')
  return category
}

function toTransaction(t: StoredTransaction): Transaction {
  const { accountId, destinationAccountId, categoryId, ...rest } = t
  const account = db.accounts.find((a) => a.id === accountId)
  const destination = db.accounts.find((a) => a.id === destinationAccountId)
  const category = db.categories.find((c) => c.id === categoryId)
  return compact({
    ...rest,
    account: { id: accountId, name: account?.name ?? '—' },
    destinationAccount: destination
      ? { id: destination.id, name: destination.name }
      : undefined,
    category: category
      ? compact({
          id: category.id,
          name: category.name,
          color: category.color,
          icon: category.icon,
        })
      : undefined,
  })
}

const inMonth = (month: string) =>
  db.transactions.filter((t) => t.date.startsWith(month))

function totals(month: string) {
  const items = inMonth(month)
  const income = round2(
    items.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
  )
  const expense = round2(
    items.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
  )
  return { income, expense, result: round2(income - expense) }
}

function shares(
  month: string,
  type: 'INCOME' | 'EXPENSE',
): Array<CategoryShare> {
  const items = inMonth(month).filter((t) => t.type === type)
  const total = items.reduce((s, t) => s + t.amount, 0)
  const byCategory = new Map<string, number>()
  for (const t of items)
    byCategory.set(
      t.categoryId!,
      (byCategory.get(t.categoryId!) ?? 0) + t.amount,
    )
  return [...byCategory.entries()]
    .map(([categoryId, value]) => {
      const c = findCategory(categoryId)
      return compact({
        categoryId,
        name: c.name,
        color: c.color,
        icon: c.icon,
        total: round2(value),
        percentage: total ? round1((value / total) * 100) : 0,
      })
    })
    .sort((a, b) => b.total - a.total)
}

function summary(month: string): FinancialSummary {
  const { income, expense, result } = totals(month)
  return {
    month,
    totalBalance: round2(
      db.accounts
        .filter((a) => !a.archived)
        .reduce((s, a) => s + balanceOf(a), 0),
    ),
    income,
    expense,
    result,
    savingsRate: income ? round1((result / income) * 100) : 0,
    expensesByCategory: shares(month, 'EXPENSE'),
    incomesByCategory: shares(month, 'INCOME'),
  }
}

function evolution(until: string, months: number): Array<MonthlyTotal> {
  return Array.from({ length: months }, (_, i) => {
    const month = shiftMonth(until, i - months + 1)
    return { month, ...totals(month) }
  })
}

function spentIn(categoryId: string, month: string) {
  return inMonth(month)
    .filter((t) => t.type === 'EXPENSE' && t.categoryId === categoryId)
    .reduce((s, t) => s + t.amount, 0)
}

function toBudget(b: (typeof db.budgets)[number]): Budget {
  const c = findCategory(b.categoryId)
  const spent = round2(spentIn(b.categoryId, b.month))
  const usedPercentage = b.limitAmount
    ? round1((spent / b.limitAmount) * 100)
    : 0
  return compact({
    ...b,
    categoryName: c.name,
    categoryColor: c.color,
    categoryIcon: c.icon,
    spent,
    remaining: round2(b.limitAmount - spent),
    usedPercentage,
    status:
      usedPercentage > 100
        ? 'EXCEEDED'
        : usedPercentage >= b.alertThreshold
          ? 'WARNING'
          : 'OK',
  })
}

function toGoal(g: StoredGoal): Goal {
  const { contributions: _contributions, ...rest } = g
  const remainingAmount = round2(Math.max(0, g.targetAmount - g.currentAmount))
  let monthsRemaining: number | undefined
  let monthlyAmountNeeded: number | undefined
  if (g.deadline && g.status === 'ACTIVE') {
    const [y, m] = g.deadline.split('-').map(Number)
    const now = new Date()
    monthsRemaining = Math.max(
      0,
      (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth()),
    )
    monthlyAmountNeeded = round2(remainingAmount / Math.max(1, monthsRemaining))
  }
  return compact({
    ...rest,
    remainingAmount,
    progressPercentage: round1(
      Math.min(100, (g.currentAmount / g.targetAmount) * 100),
    ),
    monthsRemaining,
    monthlyAmountNeeded,
  })
}

function comparison(month: string): PeriodComparison {
  const previousMonth = shiftMonth(month, -1)
  const cur = totals(month)
  const prev = totals(previousMonth)
  const categories: Array<CategoryComparison> = db.categories
    .filter((c) => c.type === 'EXPENSE')
    .map((c) => {
      const current = round2(spentIn(c.id, month))
      const previous = round2(spentIn(c.id, previousMonth))
      const changePercentage = previous
        ? round1(((current - previous) / previous) * 100)
        : undefined
      const trend: CategoryComparison['trend'] = !previous
        ? 'NEW'
        : Math.abs(changePercentage!) < 5
          ? 'STABLE'
          : current > previous
            ? 'UP'
            : 'DOWN'
      return compact({
        categoryId: c.id,
        name: c.name,
        color: c.color,
        current,
        previous,
        difference: round2(current - previous),
        changePercentage,
        trend,
      })
    })
    .filter((c) => c.current > 0 || c.previous > 0)
  return compact({
    currentMonth: month,
    previousMonth,
    currentIncome: cur.income,
    previousIncome: prev.income,
    currentExpense: cur.expense,
    previousExpense: prev.expense,
    expenseChangePercentage: prev.expense
      ? round1(((cur.expense - prev.expense) / prev.expense) * 100)
      : undefined,
    categories,
  })
}

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    n,
  )

function recommendations(month: string): Array<Recommendation> {
  const list: Array<Recommendation> = []
  for (const b of db.budgets.filter((x) => x.month === month).map(toBudget)) {
    if (b.status === 'EXCEEDED')
      list.push({
        type: 'BUDGET_EXCEEDED',
        severity: 'CRITICAL',
        title: `Orçamento de ${b.categoryName} estourado`,
        message: `Você gastou ${brl(b.spent)} de um limite de ${brl(b.limitAmount)}.`,
      })
    else if (b.status === 'WARNING')
      list.push({
        type: 'BUDGET_WARNING',
        severity: 'WARNING',
        title: `${b.categoryName} perto do limite`,
        message: `Já foram usados ${Math.round(b.usedPercentage)}% do orçamento.`,
      })
  }
  for (const c of comparison(month).categories) {
    if (c.trend === 'UP' && (c.changePercentage ?? 0) >= 25)
      list.push({
        type: 'SPENDING_INCREASE',
        severity: 'WARNING',
        title: `Gastos com ${c.name} subiram`,
        message: `Aumento de ${Math.round(c.changePercentage!)}% em relação ao mês anterior.`,
      })
  }
  const s = summary(month)
  if (s.savingsRate >= 20)
    list.push({
      type: 'GOOD_SAVINGS',
      severity: 'SUCCESS',
      title: 'Boa taxa de poupança',
      message: `Você guardou ${Math.round(s.savingsRate)}% das receitas neste mês. Continue assim!`,
    })
  return list
}

// ---------- autenticação ----------

let tokenSeq = 0
function issueTokens(): AuthResponse {
  tokenSeq++
  return {
    accessToken: `mock-access-${tokenSeq}`,
    refreshToken: `mock-refresh-${tokenSeq}`,
    tokenType: 'Bearer',
    expiresIn: 900,
    user: { ...db.user },
  }
}

const passwordRule = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/
const emailRule = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ---------- rotas ----------

interface Ctx {
  params: Record<string, string | undefined>
  body: Record<string, unknown>
  match: RegExpMatchArray
}
type Handler = (ctx: Ctx) => unknown
const routes: Array<[string, RegExp, Handler, { public?: boolean }?]> = []
const route = (
  method: string,
  path: string,
  handler: Handler,
  opts?: { public?: boolean },
) =>
  routes.push([
    method,
    new RegExp(`^${path.replace(/:id/g, '([\\w-]+)')}$`),
    handler,
    opts,
  ])

// Auth
route(
  'post',
  '/auth/register',
  ({ body }) => {
    const errors: Record<string, string> = {}
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()
    const password = String(body.password ?? '')
    if (!name) errors.name = 'não deve estar em branco'
    if (!emailRule.test(email))
      errors.email = 'deve ser um endereço de e-mail bem formado'
    if (!passwordRule.test(password))
      errors.password = 'deve ter de 8 a 72 caracteres, com letras e números'
    validate(errors)
    Object.assign(db.user, { name, email })
    db.password = password
    return issueTokens()
  },
  { public: true },
)

route(
  'post',
  '/auth/login',
  ({ body }) => {
    const errors: Record<string, string> = {}
    if (!String(body.email ?? '').trim())
      errors.email = 'não deve estar em branco'
    if (!String(body.password ?? ''))
      errors.password = 'não deve estar em branco'
    validate(errors)
    // Modo demonstração: aceita qualquer e-mail com senha de 8+ caracteres.
    if (String(body.password).length < 8)
      throw new HttpError(401, 'E-mail ou senha inválidos.')
    db.user.email = String(body.email).trim()
    return issueTokens()
  },
  { public: true },
)

route(
  'post',
  '/auth/refresh',
  ({ body }) => {
    if (!String(body.refreshToken ?? '').startsWith('mock-refresh-'))
      throw new HttpError(401, 'Sessão expirada.')
    return issueTokens()
  },
  { public: true },
)

route('post', '/auth/logout', () => undefined, { public: true })

// Usuário
route('get', '/users/me', () => db.user)
route('put', '/users/me', ({ body }) => {
  if (!String(body.name ?? '').trim())
    validate({ name: 'não deve estar em branco' })
  Object.assign(
    db.user,
    compact({
      name: String(body.name).trim(),
      currency: body.currency as string | undefined,
      aiAssistantEnabled: body.aiAssistantEnabled as boolean | undefined,
      notificationsEnabled: body.notificationsEnabled as boolean | undefined,
    }),
  )
  db.user.monthlyIncome =
    (body.monthlyIncome as number | null | undefined) ?? undefined
  return compact({ ...db.user })
})
route('put', '/users/me/password', ({ body }) => {
  if (!passwordRule.test(String(body.newPassword ?? '')))
    validate({
      newPassword: 'deve ter de 8 a 72 caracteres, com letras e números',
    })
  if (body.currentPassword !== db.password)
    throw new HttpError(
      422,
      'A senha atual está incorreta. (Demo: use "demo1234" ou a senha do cadastro.)',
    )
  db.password = String(body.newPassword)
  return undefined
})
route('delete', '/users/me', ({ body }) => {
  if (body.password !== db.password)
    throw new HttpError(
      422,
      'Senha incorreta. (Demo: use "demo1234" ou a senha do cadastro.)',
    )
  return undefined
})

// Contas
function readAccount(body: Record<string, unknown>): AccountRequest {
  const errors: Record<string, string> = {}
  if (!String(body.name ?? '').trim()) errors.name = 'não deve estar em branco'
  if (!body.type) errors.type = 'não deve ser nulo'
  validate(errors)
  return body as unknown as AccountRequest
}
route('get', '/accounts', ({ params }) =>
  db.accounts
    .filter((a) => params.includeArchived === 'true' || !a.archived)
    .map(toAccount),
)
route('get', '/accounts/:id', ({ match }) => toAccount(findAccount(match[1])))
route('post', '/accounts', ({ body }) => {
  const req = readAccount(body)
  if (
    db.accounts.some(
      (a) => a.name.toLowerCase() === req.name.trim().toLowerCase(),
    )
  )
    throw new HttpError(409, 'Já existe uma conta com esse nome.')
  const account: StoredAccount = compact({
    ...req,
    id: uuid(),
    name: req.name.trim(),
    initialBalance: req.initialBalance ?? 0,
    archived: req.archived ?? false,
  })
  db.accounts.push(account)
  return toAccount(account)
})
route('put', '/accounts/:id', ({ match, body }) => {
  const account = findAccount(match[1])
  const req = readAccount(body)
  // PUT substitui o registro inteiro (campos omitidos ficam vazios).
  Object.keys(account).forEach(
    (k) =>
      k !== 'id' && delete (account as unknown as Record<string, unknown>)[k],
  )
  Object.assign(
    account,
    compact({
      ...req,
      name: req.name.trim(),
      initialBalance: req.initialBalance ?? 0,
      archived: req.archived ?? false,
    }),
  )
  return toAccount(account)
})
route('delete', '/accounts/:id', ({ match }) => {
  const account = findAccount(match[1])
  if (
    db.transactions.some(
      (t) =>
        t.accountId === account.id || t.destinationAccountId === account.id,
    )
  )
    throw new HttpError(
      409,
      'A conta possui movimentações e não pode ser excluída. Arquive-a.',
    )
  db.accounts.splice(db.accounts.indexOf(account), 1)
  return undefined
})

// Categorias
function readCategory(body: Record<string, unknown>): CategoryRequest {
  const errors: Record<string, string> = {}
  if (!String(body.name ?? '').trim()) errors.name = 'não deve estar em branco'
  if (!body.type) errors.type = 'não deve ser nulo'
  validate(errors)
  return body as unknown as CategoryRequest
}
route('get', '/categories', ({ params }) =>
  db.categories.filter(
    (c) => !c.archived && (!params.type || c.type === params.type),
  ),
)
route('get', '/categories/:id', ({ match }) => findCategory(match[1]))
route('post', '/categories', ({ body }) => {
  const req = readCategory(body)
  if (
    db.categories.some(
      (c) =>
        c.type === req.type &&
        c.name.toLowerCase() === req.name.trim().toLowerCase(),
    )
  )
    throw new HttpError(409, 'Já existe uma categoria com esse nome.')
  const category = compact({
    ...req,
    id: uuid(),
    name: req.name.trim(),
    archived: req.archived ?? false,
  })
  db.categories.push(category)
  return category
})
route('put', '/categories/:id', ({ match, body }) => {
  const category = findCategory(match[1])
  const req = readCategory(body)
  Object.keys(category).forEach(
    (k) =>
      k !== 'id' && delete (category as unknown as Record<string, unknown>)[k],
  )
  Object.assign(
    category,
    compact({ ...req, name: req.name.trim(), archived: req.archived ?? false }),
  )
  return category
})
route('delete', '/categories/:id', ({ match }) => {
  const category = findCategory(match[1])
  if (db.transactions.some((t) => t.categoryId === category.id))
    throw new HttpError(
      409,
      'A categoria possui movimentações e não pode ser excluída. Arquive-a.',
    )
  db.categories.splice(db.categories.indexOf(category), 1)
  db.budgets = db.budgets.filter((b) => b.categoryId !== category.id)
  return undefined
})

// Movimentações
function readTransaction(body: Record<string, unknown>): TransactionRequest {
  const raw = body as Partial<TransactionRequest>
  const errors: Record<string, string> = {}
  if (!raw.type) errors.type = 'não deve ser nulo'
  if (!(Number(raw.amount) > 0)) errors.amount = 'deve ser maior que 0'
  if (!String(raw.description ?? '').trim())
    errors.description = 'não deve estar em branco'
  if (!raw.date) errors.date = 'não deve ser nulo'
  if (!raw.accountId) errors.accountId = 'não deve ser nulo'
  validate(errors)
  const req = raw as TransactionRequest
  findAccount(req.accountId)
  if (req.type === 'TRANSFER') {
    if (!req.destinationAccountId)
      validate({ destinationAccountId: 'obrigatório para transferências' })
    if (req.destinationAccountId === req.accountId)
      throw new HttpError(
        422,
        'A conta de destino deve ser diferente da conta de origem.',
      )
    findAccount(req.destinationAccountId!)
  } else {
    if (!req.categoryId)
      validate({ categoryId: 'obrigatório para receitas e despesas' })
    if (findCategory(req.categoryId!).type !== req.type)
      throw new HttpError(
        422,
        'A categoria deve ser do mesmo tipo da movimentação.',
      )
  }
  return req
}
function storeFields(req: TransactionRequest) {
  return compact({
    type: req.type,
    amount: round2(Number(req.amount)),
    description: req.description.trim(),
    date: req.date,
    accountId: req.accountId,
    destinationAccountId:
      req.type === 'TRANSFER' ? req.destinationAccountId : undefined,
    categoryId: req.type === 'TRANSFER' ? undefined : req.categoryId,
    notes: req.notes?.trim() || undefined,
    recurring: Boolean(req.recurring),
  })
}
function findTransaction(id: string) {
  const t = db.transactions.find((x) => x.id === id)
  if (!t) throw new HttpError(404, 'Movimentação não encontrada.')
  return t
}
route('get', '/transactions', ({ params: p }) => {
  const search = p.search?.trim().toLowerCase()
  const filtered = db.transactions
    .filter(
      (t) =>
        (!p.from || t.date >= p.from) &&
        (!p.to || t.date <= p.to) &&
        (!p.type || t.type === p.type) &&
        (!p.accountId ||
          t.accountId === p.accountId ||
          t.destinationAccountId === p.accountId) &&
        (!p.categoryId || t.categoryId === p.categoryId) &&
        (!p.minAmount || t.amount >= Number(p.minAmount)) &&
        (!p.maxAmount || t.amount <= Number(p.maxAmount)) &&
        (!p.recurring || String(t.recurring) === p.recurring) &&
        (!search || t.description.toLowerCase().includes(search)),
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    )
  const page = Number(p.page ?? 0)
  const size = Math.min(100, Math.max(1, Number(p.size ?? 20)))
  const totalPages = Math.ceil(filtered.length / size)
  const result: Page<Transaction> = {
    content: filtered.slice(page * size, page * size + size).map(toTransaction),
    page,
    size,
    totalElements: filtered.length,
    totalPages,
    last: page >= totalPages - 1,
  }
  return result
})
route('get', '/transactions/:id', ({ match }) =>
  toTransaction(findTransaction(match[1])),
)
route('post', '/transactions', ({ body }) => {
  const t: StoredTransaction = {
    ...storeFields(readTransaction(body)),
    id: uuid(),
    createdAt: new Date().toISOString(),
  }
  db.transactions.push(t)
  return toTransaction(t)
})
route('put', '/transactions/:id', ({ match, body }) => {
  const t = findTransaction(match[1])
  const fields = storeFields(readTransaction(body))
  delete t.destinationAccountId
  delete t.categoryId
  delete t.notes
  Object.assign(t, fields)
  return toTransaction(t)
})
route('delete', '/transactions/:id', ({ match }) => {
  db.transactions.splice(db.transactions.indexOf(findTransaction(match[1])), 1)
  return undefined
})

// Orçamentos
function readBudget(body: Record<string, unknown>): BudgetRequest {
  const req = body as unknown as BudgetRequest
  const errors: Record<string, string> = {}
  if (!req.categoryId) errors.categoryId = 'não deve ser nulo'
  if (!req.month) errors.month = 'não deve ser nulo'
  if (!(Number(req.limitAmount) > 0))
    errors.limitAmount = 'deve ser maior que 0'
  validate(errors)
  if (findCategory(req.categoryId).type !== 'EXPENSE')
    throw new HttpError(
      422,
      'Orçamentos só podem ser criados para categorias de despesa.',
    )
  return req
}
function findBudget(id: string) {
  const b = db.budgets.find((x) => x.id === id)
  if (!b) throw new HttpError(404, 'Orçamento não encontrado.')
  return b
}
route('get', '/budgets', ({ params }) =>
  db.budgets
    .filter((b) => b.month === (params.month ?? currentMonth()))
    .map(toBudget),
)
route('get', '/budgets/:id', ({ match }) => toBudget(findBudget(match[1])))
route('post', '/budgets', ({ body }) => {
  const req = readBudget(body)
  if (
    db.budgets.some(
      (b) => b.categoryId === req.categoryId && b.month === req.month,
    )
  )
    throw new HttpError(
      409,
      'Já existe um orçamento para essa categoria neste mês.',
    )
  const budget = {
    id: uuid(),
    categoryId: req.categoryId,
    month: req.month,
    limitAmount: round2(Number(req.limitAmount)),
    alertThreshold: req.alertThreshold ?? 80,
  }
  db.budgets.push(budget)
  return toBudget(budget)
})
route('put', '/budgets/:id', ({ match, body }) => {
  const budget = findBudget(match[1])
  const req = readBudget(body)
  Object.assign(budget, {
    categoryId: req.categoryId,
    month: req.month,
    limitAmount: round2(Number(req.limitAmount)),
    alertThreshold: req.alertThreshold ?? 80,
  })
  return toBudget(budget)
})
route('delete', '/budgets/:id', ({ match }) => {
  db.budgets.splice(db.budgets.indexOf(findBudget(match[1])), 1)
  return undefined
})
route('post', '/budgets/copy', ({ body }) => {
  const from = String(body.from)
  const to = String(body.to)
  for (const b of db.budgets.filter((x) => x.month === from)) {
    if (
      !db.budgets.some((x) => x.month === to && x.categoryId === b.categoryId)
    )
      db.budgets.push({ ...b, id: uuid(), month: to })
  }
  return db.budgets.filter((b) => b.month === to).map(toBudget)
})

// Metas
function findGoal(id: string) {
  const g = db.goals.find((x) => x.id === id)
  if (!g) throw new HttpError(404, 'Meta não encontrada.')
  return g
}
function readGoal(
  body: Record<string, unknown>,
  creating: boolean,
): GoalRequest {
  const req = body as unknown as GoalRequest
  const errors: Record<string, string> = {}
  if (!String((body as Partial<GoalRequest>).name ?? '').trim())
    errors.name = 'não deve estar em branco'
  if (!(Number(req.targetAmount) > 0))
    errors.targetAmount = 'deve ser maior que 0'
  if (creating && req.deadline && req.deadline < today())
    errors.deadline = 'não pode estar no passado'
  validate(errors)
  return req
}
route('get', '/goals', ({ params }) =>
  db.goals
    .filter((g) => !params.status || g.status === params.status)
    .map(toGoal),
)
route('get', '/goals/:id', ({ match }) => toGoal(findGoal(match[1])))
route('post', '/goals', ({ body }) => {
  const req = readGoal(body, true)
  const initial = round2(Number(req.initialAmount ?? 0))
  const goal: StoredGoal = compact({
    id: uuid(),
    name: req.name.trim(),
    description: req.description?.trim() || undefined,
    targetAmount: round2(Number(req.targetAmount)),
    currentAmount: initial,
    deadline: req.deadline,
    status: initial >= Number(req.targetAmount) ? 'COMPLETED' : 'ACTIVE',
    icon: req.icon,
    color: req.color,
    contributions:
      initial > 0
        ? [
            {
              id: uuid(),
              amount: initial,
              date: today(),
              note: 'Valor inicial',
            },
          ]
        : [],
  })
  db.goals.push(goal)
  return toGoal(goal)
})
route('put', '/goals/:id', ({ match, body }) => {
  const goal = findGoal(match[1])
  const req = readGoal(body, false)
  goal.name = req.name.trim()
  goal.description = req.description?.trim() || undefined
  goal.targetAmount = round2(Number(req.targetAmount))
  goal.deadline = req.deadline
  goal.icon = req.icon
  goal.color = req.color
  goal.status =
    req.status ??
    (goal.currentAmount >= goal.targetAmount ? 'COMPLETED' : 'ACTIVE')
  return toGoal(goal)
})
route('delete', '/goals/:id', ({ match }) => {
  db.goals.splice(db.goals.indexOf(findGoal(match[1])), 1)
  return undefined
})
route('post', '/goals/:id/contributions', ({ match, body }) => {
  const goal = findGoal(match[1])
  const amount = round2(Number(body.amount))
  if (!amount) validate({ amount: 'não deve ser zero' })
  if (goal.status === 'CANCELLED')
    throw new HttpError(422, 'Não é possível movimentar uma meta cancelada.')
  if (goal.currentAmount + amount < 0)
    throw new HttpError(422, 'O resgate é maior que o saldo guardado na meta.')
  goal.currentAmount = round2(goal.currentAmount + amount)
  goal.contributions.push(
    compact({
      id: uuid(),
      amount,
      date: (body.date as string | undefined) ?? today(),
      note: body.note as string | undefined,
    }),
  )
  goal.status = goal.currentAmount >= goal.targetAmount ? 'COMPLETED' : 'ACTIVE'
  if (goal.status === 'COMPLETED')
    db.notifications.unshift({
      id: uuid(),
      type: 'GOAL_COMPLETED',
      severity: 'SUCCESS',
      title: `Meta "${goal.name}" concluída!`,
      message: 'Parabéns, você atingiu o valor da meta.',
      read: false,
      createdAt: new Date().toISOString(),
    })
  return toGoal(goal)
})
route('get', '/goals/:id/contributions', ({ match }) =>
  [...findGoal(match[1]).contributions].reverse(),
)

// Dashboard e análises
route('get', '/dashboard', ({ params }) => {
  const month = params.month ?? currentMonth()
  return {
    summary: summary(month),
    monthlyEvolution: evolution(month, 6),
    accounts: db.accounts.filter((a) => !a.archived).map(toAccount),
    budgets: db.budgets.filter((b) => b.month === month).map(toBudget),
    goals: db.goals.filter((g) => g.status === 'ACTIVE').map(toGoal),
    recentTransactions: [...db.transactions]
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt),
      )
      .slice(0, 5)
      .map(toTransaction),
    unreadNotifications: db.notifications.filter((n) => !n.read).length,
  }
})
route('get', '/analysis/summary', ({ params }) =>
  summary(params.month ?? currentMonth()),
)
route('get', '/analysis/evolution', ({ params }) =>
  evolution(params.until ?? currentMonth(), Number(params.months ?? 6)),
)
route('get', '/analysis/comparison', ({ params }) =>
  comparison(params.month ?? currentMonth()),
)
route('get', '/analysis/recommendations', ({ params }) =>
  recommendations(params.month ?? currentMonth()),
)
route('get', '/analysis/anomalies', ({ params }) => {
  const month = params.month ?? currentMonth()
  const list: Array<Anomaly> = []
  for (const t of inMonth(month).filter((x) => x.type === 'EXPENSE')) {
    const history = db.transactions.filter(
      (x) =>
        x.type === 'EXPENSE' && x.categoryId === t.categoryId && x.id !== t.id,
    )
    const avg =
      history.reduce((s, x) => s + x.amount, 0) / Math.max(1, history.length)
    if (history.length >= 3 && t.amount > avg * 1.6)
      list.push({
        transactionId: t.id,
        description: t.description,
        date: t.date,
        categoryName: findCategory(t.categoryId!).name,
        amount: t.amount,
        categoryAverage: round2(avg),
        reason: `Valor ${Math.round((t.amount / avg - 1) * 100)}% acima da média da categoria.`,
      })
  }
  return list
})
route('get', '/analysis/budget-suggestions', () => {
  const month = currentMonth()
  const list: Array<BudgetSuggestion> = []
  for (const c of db.categories.filter(
    (x) => x.type === 'EXPENSE' && !x.archived,
  )) {
    const avg =
      [1, 2, 3].reduce((s, i) => s + spentIn(c.id, shiftMonth(month, -i)), 0) /
      3
    if (avg <= 0) continue
    const current = db.budgets.find(
      (b) => b.categoryId === c.id && b.month === month,
    )
    list.push(
      compact({
        categoryId: c.id,
        categoryName: c.name,
        averageMonthlySpending: round2(avg),
        suggestedLimit: Math.round((avg * 0.9) / 10) * 10,
        currentLimit: current?.limitAmount,
      }),
    )
  }
  return list
})

// Assistente
const defaultSuggestions = [
  'Qual é o meu saldo?',
  'Onde gastei mais este mês?',
  'Me dê um resumo do mês',
  'Como posso economizar?',
]
function reply(message: string): string {
  const text = message.toLowerCase()
  const s = summary(currentMonth())
  const top = s.expensesByCategory.at(0)
  if (text.includes('saldo'))
    return `Seu saldo consolidado é de **${brl(s.totalBalance)}**, somando as contas ativas.`
  if (
    text.includes('maior') ||
    text.includes('mais') ||
    text.includes('principal')
  )
    return top
      ? `Sua maior despesa do mês é **${top.name}**, com ${brl(top.total)} (${Math.round(top.percentage)}% dos gastos).\n\nOutras categorias relevantes:\n${s.expensesByCategory
          .slice(1, 4)
          .map((c) => `• ${c.name}: ${brl(c.total)}`)
          .join('\n')}`
      : 'Ainda não encontrei despesas neste mês.'
  if (text.includes('econom') || text.includes('dica')) {
    const recs = recommendations(currentMonth()).filter(
      (r) => r.severity !== 'SUCCESS',
    )
    return recs.length
      ? `Encontrei alguns pontos de atenção:\n${recs.map((r) => `• ${r.title}: ${r.message}`).join('\n')}`
      : 'Seus gastos estão dentro do planejado. Que tal direcionar a sobra do mês para uma das suas metas?'
  }
  if (text.includes('resumo') || text.includes('mês') || text.includes('mes'))
    return `Resumo do mês:\n• Receitas: ${brl(s.income)}\n• Despesas: ${brl(s.expense)}\n• Resultado: ${brl(s.result)}\n• Taxa de poupança: ${Math.round(s.savingsRate)}%`
  return 'Posso ajudar com seu saldo, um resumo do mês, seus principais gastos ou sugestões de economia. O que você quer saber?'
}
route('post', '/assistant/chat', ({ body }) => {
  if (!db.user.aiAssistantEnabled)
    throw new HttpError(
      422,
      'O assistente está desativado nas suas configurações.',
    )
  const message = String(body.message ?? '').trim()
  if (!message) validate({ message: 'não deve estar em branco' })
  const now = new Date().toISOString()
  db.messages.push({
    id: uuid(),
    role: 'USER',
    content: message,
    createdAt: now,
  })
  const response: ChatResponse = {
    messageId: uuid(),
    reply: reply(message),
    source: 'LOCAL',
    suggestions: defaultSuggestions,
    createdAt: now,
  }
  db.messages.push({
    id: response.messageId,
    role: 'ASSISTANT',
    content: response.reply,
    source: 'LOCAL',
    createdAt: now,
  })
  return response
})
route('get', '/assistant/messages', ({ params }) =>
  db.messages.slice(-Number(params.limit ?? 50)),
)
route('delete', '/assistant/messages', () => {
  db.messages = []
  return undefined
})

// Notificações
function findNotification(id: string) {
  const n = db.notifications.find((x) => x.id === id)
  if (!n) throw new HttpError(404, 'Notificação não encontrada.')
  return n
}
route('get', '/notifications', ({ params }) => {
  const list = db.notifications.filter(
    (n) => params.unreadOnly !== 'true' || !n.read,
  )
  const page = Number(params.page ?? 0)
  const size = Number(params.size ?? 20)
  return {
    content: list.slice(page * size, page * size + size),
    page,
    size,
    totalElements: list.length,
    totalPages: Math.ceil(list.length / size),
    last: (page + 1) * size >= list.length,
  }
})
route('get', '/notifications/unread-count', () => ({
  count: db.notifications.filter((n) => !n.read).length,
}))
route('patch', '/notifications/read-all', () => {
  const unread = db.notifications.filter((n) => !n.read)
  unread.forEach((n) => (n.read = true))
  return { updated: unread.length }
})
route('patch', '/notifications/:id/read', ({ match }) => {
  const n = findNotification(match[1])
  n.read = true
  return n
})
route('delete', '/notifications/:id', ({ match }) => {
  db.notifications.splice(
    db.notifications.indexOf(findNotification(match[1])),
    1,
  )
  return undefined
})

// ---------- adapter ----------

function stringParams(params: unknown): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params))
      if (v !== undefined && v !== null && v !== '') out[k] = String(v)
  }
  return out
}

export const mockAdapter: AxiosAdapter = async (
  config: InternalAxiosRequestConfig,
) => {
  await new Promise((r) => setTimeout(r, 150 + Math.random() * 250))
  const method = (config.method ?? 'get').toLowerCase()
  // Aceita URL relativa (com baseURL) ou absoluta (como no /auth/refresh).
  const url = config.url ?? ''
  const full = /^https?:/.test(url) ? url : `${config.baseURL ?? ''}${url}`
  const path = new URL(full, 'http://localhost').pathname.replace(/^\/api/, '')

  const respond = (status: number, data: unknown): AxiosResponse => ({
    status,
    statusText: String(status),
    data,
    headers: new AxiosHeaders(),
    config,
    request: { mock: true },
  })

  try {
    for (const [m, regex, handler, opts] of routes) {
      const match = path.match(regex)
      if (m !== method || !match) continue
      if (!opts?.public) {
        const auth = String(config.headers.Authorization ?? '')
        if (!auth.startsWith('Bearer mock-access-'))
          throw new HttpError(401, 'Token ausente ou expirado.')
      }
      const body =
        typeof config.data === 'string' && config.data
          ? (JSON.parse(config.data) as Record<string, unknown>)
          : {}
      const data = handler({ params: stringParams(config.params), body, match })
      return respond(
        data === undefined
          ? 204
          : method === 'post' &&
              !path.includes('/auth/') &&
              !path.endsWith('/chat') &&
              !path.endsWith('/copy')
            ? 201
            : 200,
        data === undefined ? '' : structuredClone(data),
      )
    }
    throw new HttpError(
      404,
      `Endpoint não encontrado: ${method.toUpperCase()} ${path}`,
    )
  } catch (err) {
    const e =
      err instanceof HttpError
        ? err
        : new HttpError(500, 'Erro inesperado no modo demonstração.')
    const response = respond(
      e.status,
      compact({
        status: e.status,
        title: titles[e.status] ?? 'Erro',
        detail: e.detail,
        errors: e.errors,
      }),
    )
    throw new AxiosError(
      e.detail,
      e.status >= 500
        ? AxiosError.ERR_BAD_RESPONSE
        : AxiosError.ERR_BAD_REQUEST,
      config,
      response.request,
      response,
    )
  }
}
