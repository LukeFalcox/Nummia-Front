import { api } from '#/lib/api'
import { env } from '#/lib/env'
import { delay, formatCurrency } from '#/lib/utils'
import {
  mockAccounts,
  mockCategories,
  mockGoals,
  mockTransactions,
} from '#/mocks/db'
import type {
  CategorySpending,
  DashboardSummary,
  Insight,
  MonthlySummary,
} from '#/types'

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(date)
    .replace('.', '')
}

function spendingByCategory(month: string): Array<CategorySpending> {
  return mockCategories
    .filter((c) => c.type === 'expense')
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      color: c.color,
      limit: c.monthlyLimit,
      amount: mockTransactions
        .filter((t) => t.categoryId === c.id && t.date.startsWith(month))
        .reduce((sum, t) => sum + t.amount, 0),
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

/**
 * Na versão real, todos esses cálculos são regras de negócio do back-end.
 * Aqui eles existem apenas para alimentar as telas com dados simulados.
 */
function buildMockSummary(): DashboardSummary {
  const now = new Date()
  const history: Array<MonthlySummary> = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKey(date)
    const items = mockTransactions.filter((t) => t.date.startsWith(key))
    history.push({
      month: monthLabel(date),
      income: items
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0),
      expense: items
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0),
    })
  }

  const current = history[history.length - 1]
  const previousKey = monthKey(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  )
  const spending = spendingByCategory(monthKey(now))
  const previousSpending = spendingByCategory(previousKey)

  const insights: Array<Insight> = []
  for (const item of spending) {
    const previous = previousSpending.find(
      (p) => p.categoryId === item.categoryId,
    )
    if (previous && item.amount > previous.amount * 1.25) {
      insights.push({
        id: `inc-${item.categoryId}`,
        level: 'warning',
        title: `Gastos com ${item.name} subiram`,
        description: `Você gastou ${formatCurrency(item.amount)} este mês, ${Math.round((item.amount / previous.amount - 1) * 100)}% a mais que no mês anterior.`,
      })
    }
    if (item.limit && item.amount > item.limit) {
      insights.push({
        id: `lim-${item.categoryId}`,
        level: 'warning',
        title: `Limite de ${item.name} ultrapassado`,
        description: `O planejado era ${formatCurrency(item.limit)} e você já gastou ${formatCurrency(item.amount)}.`,
      })
    }
  }
  const nearGoal = mockGoals.find(
    (g) => g.currentAmount / g.targetAmount >= 0.7,
  )
  if (nearGoal) {
    insights.push({
      id: `goal-${nearGoal.id}`,
      level: 'success',
      title: `Meta "${nearGoal.name}" está perto!`,
      description: `Faltam ${formatCurrency(nearGoal.targetAmount - nearGoal.currentAmount)} para atingir o objetivo.`,
    })
  }

  return {
    totalBalance: mockAccounts.reduce((s, a) => s + a.balance, 0),
    monthIncome: current.income,
    monthExpense: current.expense,
    savingsRate:
      current.income > 0
        ? (current.income - current.expense) / current.income
        : 0,
    history,
    spendingByCategory: spending,
    recentTransactions: mockTransactions.slice(0, 6),
    insights,
  }
}

export const dashboardService = {
  async summary(): Promise<DashboardSummary> {
    if (env.useMocks) {
      await delay(400)
      return buildMockSummary()
    }
    const { data } = await api.get<DashboardSummary>('/dashboard/summary')
    return data
  },
}
