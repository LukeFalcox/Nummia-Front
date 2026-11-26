import type { Account, Category, Goal, Transaction, User } from '#/types'

/**
 * Banco de dados simulado, usado enquanto o back-end não está disponível.
 * Os dados são gerados relativos à data atual para que o dashboard pareça "vivo".
 */

export const mockUser: User = {
  id: 'u-1',
  name: 'Usuário Demo',
  email: 'demo@nummia.app',
  createdAt: new Date().toISOString(),
}

export const mockAccounts: Array<Account> = [
  {
    id: 'a-1',
    name: 'Conta corrente',
    institution: 'Banco Azul',
    type: 'checking',
    balance: 4820.35,
    color: 'var(--chart-2)',
  },
  {
    id: 'a-2',
    name: 'Poupança',
    institution: 'Banco Azul',
    type: 'savings',
    balance: 12350,
    color: 'var(--chart-1)',
  },
  {
    id: 'a-3',
    name: 'Cartão Platinum',
    institution: 'Banco Roxo',
    type: 'credit_card',
    balance: -1640.9,
    creditLimit: 6000,
    color: 'var(--chart-4)',
  },
  {
    id: 'a-4',
    name: 'Carteira',
    institution: 'Dinheiro',
    type: 'wallet',
    balance: 180,
    color: 'var(--chart-3)',
  },
]

export const mockCategories: Array<Category> = [
  {
    id: 'c-1',
    name: 'Salário',
    type: 'income',
    color: 'var(--chart-1)',
    icon: 'briefcase',
  },
  {
    id: 'c-2',
    name: 'Freelance',
    type: 'income',
    color: 'var(--chart-2)',
    icon: 'laptop',
  },
  {
    id: 'c-3',
    name: 'Moradia',
    type: 'expense',
    color: 'var(--chart-2)',
    icon: 'home',
    monthlyLimit: 1900,
  },
  {
    id: 'c-4',
    name: 'Alimentação',
    type: 'expense',
    color: 'var(--chart-3)',
    icon: 'utensils',
    monthlyLimit: 1200,
  },
  {
    id: 'c-5',
    name: 'Transporte',
    type: 'expense',
    color: 'var(--chart-4)',
    icon: 'car',
    monthlyLimit: 500,
  },
  {
    id: 'c-6',
    name: 'Lazer',
    type: 'expense',
    color: 'var(--chart-5)',
    icon: 'party-popper',
    monthlyLimit: 400,
  },
  {
    id: 'c-7',
    name: 'Saúde',
    type: 'expense',
    color: 'var(--chart-6)',
    icon: 'heart-pulse',
    monthlyLimit: 350,
  },
  {
    id: 'c-8',
    name: 'Assinaturas',
    type: 'expense',
    color: 'var(--chart-1)',
    icon: 'repeat',
    monthlyLimit: 150,
  },
]

function isoDate(monthOffset: number, day: number) {
  const now = new Date()
  const date = new Date(
    now.getFullYear(),
    now.getMonth() - monthOffset,
    day,
    12,
  )
  // Não gera lançamentos no futuro para o mês corrente.
  if (monthOffset === 0 && day > now.getDate()) {
    date.setDate(Math.max(1, now.getDate() - (day % 5)))
  }
  return date.toISOString()
}

function buildTransactions(): Array<Transaction> {
  const list: Array<Transaction> = []
  let seq = 0
  const add = (t: Omit<Transaction, 'id'>) =>
    list.push({ ...t, id: `t-${++seq}` })

  for (let m = 5; m >= 0; m--) {
    const variation = 1 + ((m * 7) % 5) / 20
    add({
      description: 'Salário',
      amount: 7200,
      type: 'income',
      date: isoDate(m, 5),
      categoryId: 'c-1',
      accountId: 'a-1',
    })
    if (m % 2 === 0) {
      add({
        description: 'Projeto freelance',
        amount: 1200 + m * 150,
        type: 'income',
        date: isoDate(m, 18),
        categoryId: 'c-2',
        accountId: 'a-1',
      })
    }
    add({
      description: 'Aluguel',
      amount: 1650,
      type: 'expense',
      date: isoDate(m, 6),
      categoryId: 'c-3',
      accountId: 'a-1',
    })
    add({
      description: 'Conta de luz',
      amount: Math.round(140 * variation),
      type: 'expense',
      date: isoDate(m, 10),
      categoryId: 'c-3',
      accountId: 'a-1',
    })
    add({
      description: 'Supermercado',
      amount: Math.round(620 * variation),
      type: 'expense',
      date: isoDate(m, 8),
      categoryId: 'c-4',
      accountId: 'a-3',
    })
    add({
      description: 'Restaurantes',
      amount: Math.round((m === 0 ? 690 : 380) * variation),
      type: 'expense',
      date: isoDate(m, 14),
      categoryId: 'c-4',
      accountId: 'a-3',
    })
    add({
      description: 'Combustível',
      amount: Math.round(280 * variation),
      type: 'expense',
      date: isoDate(m, 12),
      categoryId: 'c-5',
      accountId: 'a-3',
    })
    add({
      description: 'Aplicativo de transporte',
      amount: Math.round(95 * variation),
      type: 'expense',
      date: isoDate(m, 20),
      categoryId: 'c-5',
      accountId: 'a-3',
    })
    add({
      description: 'Cinema e bares',
      amount: Math.round(210 * variation),
      type: 'expense',
      date: isoDate(m, 22),
      categoryId: 'c-6',
      accountId: 'a-3',
    })
    add({
      description: 'Farmácia',
      amount: Math.round(85 * variation),
      type: 'expense',
      date: isoDate(m, 16),
      categoryId: 'c-7',
      accountId: 'a-4',
    })
    add({
      description: 'Streaming de vídeo',
      amount: 55.9,
      type: 'expense',
      date: isoDate(m, 3),
      categoryId: 'c-8',
      accountId: 'a-3',
    })
    add({
      description: 'Streaming de música',
      amount: 21.9,
      type: 'expense',
      date: isoDate(m, 3),
      categoryId: 'c-8',
      accountId: 'a-3',
    })
  }

  return list.sort((a, b) => b.date.localeCompare(a.date))
}

export const mockTransactions: Array<Transaction> = buildTransactions()

export const mockGoals: Array<Goal> = [
  {
    id: 'g-1',
    name: 'Reserva de emergência',
    targetAmount: 30000,
    currentAmount: 12350,
    deadline: isoDate(-10, 1),
    color: 'var(--chart-1)',
  },
  {
    id: 'g-2',
    name: 'Viagem de férias',
    targetAmount: 8000,
    currentAmount: 5900,
    deadline: isoDate(-4, 1),
    color: 'var(--chart-2)',
  },
  {
    id: 'g-3',
    name: 'Notebook novo',
    targetAmount: 6500,
    currentAmount: 1200,
    deadline: isoDate(-7, 1),
    color: 'var(--chart-4)',
  },
]
