/**
 * Dados do modo demonstração (back-end simulado no navegador).
 * Só é usado quando não há VITE_API_URL. As regras de cálculo ficam em ./adapter.ts
 * e imitam o Back-End — na versão real, todos os cálculos são feitos pela API.
 */
import type {
  Account,
  AssistantMessage,
  Category,
  Contribution,
  Notification,
  Transaction,
  User,
} from '../types'

export interface StoredBudget {
  id: string
  categoryId: string
  month: string
  limitAmount: number
  alertThreshold: number
}

export interface StoredGoal {
  id: string
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  icon?: string
  color?: string
  contributions: Array<Contribution>
}

export type StoredAccount = Omit<Account, 'currentBalance'>
export type StoredTransaction = Omit<
  Transaction,
  'account' | 'destinationAccount' | 'category'
> & {
  accountId: string
  destinationAccountId?: string
  categoryId?: string
}

const pad = (n: number) => String(n).padStart(2, '0')
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const toYearMonth = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
export const uuid = () => crypto.randomUUID()

/** Dia `day` do mês `offset` meses atrás, sem passar de hoje. */
function dateIn(offset: number, day: number) {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - offset, day)
  if (d > now) d.setDate(Math.max(1, now.getDate() - (day % 4)))
  return toISODate(d)
}

function buildCategories(): Array<Category> {
  const list: Array<[string, Category['type'], string, string]> = [
    ['Salário', 'INCOME', '#10b981', 'briefcase'],
    ['Freelance', 'INCOME', '#3b82f6', 'laptop'],
    ['Investimentos', 'INCOME', '#8b5cf6', 'trending-up'],
    ['Outras receitas', 'INCOME', '#64748b', 'circle-plus'],
    ['Moradia', 'EXPENSE', '#3b82f6', 'house'],
    ['Alimentação', 'EXPENSE', '#f59e0b', 'utensils'],
    ['Transporte', 'EXPENSE', '#8b5cf6', 'car'],
    ['Saúde', 'EXPENSE', '#14b8a6', 'heart-pulse'],
    ['Educação', 'EXPENSE', '#6366f1', 'graduation-cap'],
    ['Lazer', 'EXPENSE', '#ef4444', 'party-popper'],
    ['Compras', 'EXPENSE', '#ec4899', 'shopping-bag'],
    ['Assinaturas', 'EXPENSE', '#06b6d4', 'repeat'],
    ['Contas e serviços', 'EXPENSE', '#eab308', 'receipt'],
    ['Outras despesas', 'EXPENSE', '#94a3b8', 'circle-ellipsis'],
  ]
  return list.map(([name, type, color, icon]) => ({
    id: uuid(),
    name,
    type,
    color,
    icon,
    archived: false,
  }))
}

function seed() {
  const user: User = {
    id: uuid(),
    name: 'Usuário Demo',
    email: 'demo@nummia.app',
    role: 'USER',
    currency: 'BRL',
    monthlyIncome: 7200,
    aiAssistantEnabled: true,
    notificationsEnabled: true,
    createdAt: new Date().toISOString(),
  }
  const categories = buildCategories()
  const cat = (name: string) => categories.find((c) => c.name === name)!.id

  const accounts: Array<StoredAccount> = [
    {
      id: uuid(),
      name: 'Conta corrente',
      type: 'CHECKING',
      institution: 'Banco Azul',
      initialBalance: 2500,
      color: '#3b82f6',
      archived: false,
    },
    {
      id: uuid(),
      name: 'Poupança',
      type: 'SAVINGS',
      institution: 'Banco Azul',
      initialBalance: 9000,
      color: '#10b981',
      archived: false,
    },
    {
      id: uuid(),
      name: 'Cartão Platinum',
      type: 'CREDIT_CARD',
      institution: 'Banco Roxo',
      initialBalance: 0,
      creditLimit: 6000,
      color: '#8b5cf6',
      archived: false,
    },
    {
      id: uuid(),
      name: 'Carteira',
      type: 'WALLET',
      institution: 'Dinheiro',
      initialBalance: 200,
      color: '#f59e0b',
      archived: false,
    },
  ]
  const [checking, savings, card, wallet] = accounts.map((a) => a.id)

  const transactions: Array<StoredTransaction> = []
  const add = (
    t: Omit<StoredTransaction, 'id' | 'createdAt' | 'recurring'> & {
      recurring?: boolean
    },
  ) =>
    transactions.push({
      recurring: false,
      ...t,
      id: uuid(),
      createdAt: new Date().toISOString(),
    })

  for (let m = 5; m >= 0; m--) {
    const v = 1 + ((m * 7) % 5) / 20
    add({
      type: 'INCOME',
      amount: 7200,
      description: 'Salário',
      date: dateIn(m, 5),
      accountId: checking,
      categoryId: cat('Salário'),
      recurring: true,
    })
    if (m % 2 === 0)
      add({
        type: 'INCOME',
        amount: 1200 + m * 150,
        description: 'Projeto freelance',
        date: dateIn(m, 18),
        accountId: checking,
        categoryId: cat('Freelance'),
      })
    add({
      type: 'EXPENSE',
      amount: 1650,
      description: 'Aluguel',
      date: dateIn(m, 6),
      accountId: checking,
      categoryId: cat('Moradia'),
      recurring: true,
    })
    add({
      type: 'EXPENSE',
      amount: Math.round(140 * v),
      description: 'Conta de luz',
      date: dateIn(m, 10),
      accountId: checking,
      categoryId: cat('Contas e serviços'),
      recurring: true,
    })
    add({
      type: 'EXPENSE',
      amount: Math.round(620 * v),
      description: 'Supermercado',
      date: dateIn(m, 8),
      accountId: card,
      categoryId: cat('Alimentação'),
    })
    add({
      type: 'EXPENSE',
      amount: Math.round((m === 0 ? 690 : 380) * v),
      description: 'Restaurantes',
      date: dateIn(m, 14),
      accountId: card,
      categoryId: cat('Alimentação'),
    })
    add({
      type: 'EXPENSE',
      amount: Math.round(280 * v),
      description: 'Combustível',
      date: dateIn(m, 12),
      accountId: card,
      categoryId: cat('Transporte'),
    })
    add({
      type: 'EXPENSE',
      amount: Math.round(95 * v),
      description: 'Aplicativo de transporte',
      date: dateIn(m, 20),
      accountId: card,
      categoryId: cat('Transporte'),
    })
    add({
      type: 'EXPENSE',
      amount: Math.round(210 * v),
      description: 'Cinema e bares',
      date: dateIn(m, 22),
      accountId: card,
      categoryId: cat('Lazer'),
    })
    add({
      type: 'EXPENSE',
      amount: Math.round(85 * v),
      description: 'Farmácia',
      date: dateIn(m, 16),
      accountId: wallet,
      categoryId: cat('Saúde'),
    })
    add({
      type: 'EXPENSE',
      amount: 55.9,
      description: 'Streaming de vídeo',
      date: dateIn(m, 3),
      accountId: card,
      categoryId: cat('Assinaturas'),
      recurring: true,
    })
    add({
      type: 'EXPENSE',
      amount: 21.9,
      description: 'Streaming de música',
      date: dateIn(m, 3),
      accountId: card,
      categoryId: cat('Assinaturas'),
      recurring: true,
    })
    if (m > 0)
      add({
        type: 'TRANSFER',
        amount: Math.round(1500 * v),
        description: 'Pagamento da fatura',
        date: dateIn(m - 1, 9),
        accountId: checking,
        destinationAccountId: card,
      })
    add({
      type: 'TRANSFER',
      amount: 500,
      description: 'Reserva mensal',
      date: dateIn(m, 7),
      accountId: checking,
      destinationAccountId: savings,
    })
  }

  const now = new Date()
  const budgets: Array<StoredBudget> = []
  for (const offset of [1, 0]) {
    const month = toYearMonth(
      new Date(now.getFullYear(), now.getMonth() - offset, 1),
    )
    for (const [name, limit] of [
      ['Moradia', 1900],
      ['Alimentação', 1200],
      ['Transporte', 500],
      ['Lazer', 400],
      ['Saúde', 350],
      ['Assinaturas', 100],
    ] as const) {
      budgets.push({
        id: uuid(),
        categoryId: cat(name),
        month,
        limitAmount: limit,
        alertThreshold: 80,
      })
    }
  }

  const goals: Array<StoredGoal> = [
    {
      id: uuid(),
      name: 'Reserva de emergência',
      description: '6 meses de despesas',
      targetAmount: 30000,
      currentAmount: 12000,
      deadline: toISODate(new Date(now.getFullYear() + 1, now.getMonth(), 1)),
      status: 'ACTIVE',
      color: '#10b981',
      icon: 'shield',
      contributions: [],
    },
    {
      id: uuid(),
      name: 'Viagem de férias',
      targetAmount: 8000,
      currentAmount: 6900,
      deadline: toISODate(new Date(now.getFullYear(), now.getMonth() + 4, 1)),
      status: 'ACTIVE',
      color: '#3b82f6',
      icon: 'plane',
      contributions: [],
    },
    {
      id: uuid(),
      name: 'Notebook novo',
      targetAmount: 6500,
      currentAmount: 1200,
      deadline: toISODate(new Date(now.getFullYear(), now.getMonth() + 7, 1)),
      status: 'ACTIVE',
      color: '#8b5cf6',
      icon: 'laptop',
      contributions: [],
    },
  ]
  for (const g of goals)
    g.contributions.push({
      id: uuid(),
      amount: g.currentAmount,
      date: dateIn(2, 1),
      note: 'Valor inicial',
    })

  const notifications: Array<Notification> = [
    {
      id: uuid(),
      type: 'BUDGET_EXCEEDED',
      severity: 'CRITICAL',
      title: 'Orçamento de Alimentação estourado',
      message:
        'Você ultrapassou o limite planejado para Alimentação neste mês.',
      read: false,
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
    },
    {
      id: uuid(),
      type: 'GOAL_NEAR',
      severity: 'SUCCESS',
      title: 'Meta "Viagem de férias" quase lá',
      message: 'Você já guardou mais de 85% do valor da meta.',
      read: false,
      createdAt: new Date(Date.now() - 86400_000).toISOString(),
    },
    {
      id: uuid(),
      type: 'RECURRING_EXPENSE',
      severity: 'INFO',
      title: 'Aluguel vence em breve',
      message:
        'Sua despesa recorrente "Aluguel" deve ocorrer nos próximos dias.',
      read: true,
      createdAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
    },
  ]

  return {
    user,
    password: 'demo1234',
    categories,
    accounts,
    transactions,
    budgets,
    goals,
    notifications,
    messages: [] as Array<AssistantMessage>,
  }
}

export const db = seed()
