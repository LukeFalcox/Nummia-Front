import { api } from '#/lib/api'
import { env } from '#/lib/env'
import { delay, generateId } from '#/lib/utils'
import {
  mockAccounts,
  mockCategories,
  mockGoals,
  mockTransactions,
} from '#/mocks/db'
import type {
  Account,
  Category,
  Goal,
  GoalInput,
  Transaction,
  TransactionInput,
} from '#/types'

const MOCK_LATENCY = 300

export const accountService = {
  async list(): Promise<Array<Account>> {
    if (env.useMocks) {
      await delay(MOCK_LATENCY)
      return [...mockAccounts]
    }
    const { data } = await api.get<Array<Account>>('/accounts')
    return data
  },

  async create(input: Omit<Account, 'id'>): Promise<Account> {
    if (env.useMocks) {
      await delay(MOCK_LATENCY)
      const account = { ...input, id: generateId() }
      mockAccounts.push(account)
      return account
    }
    const { data } = await api.post<Account>('/accounts', input)
    return data
  },
}

export const categoryService = {
  async list(): Promise<Array<Category>> {
    if (env.useMocks) {
      await delay(MOCK_LATENCY)
      return [...mockCategories]
    }
    const { data } = await api.get<Array<Category>>('/categories')
    return data
  },

  async update(id: string, input: Partial<Category>): Promise<Category> {
    if (env.useMocks) {
      await delay(MOCK_LATENCY)
      const category = mockCategories.find((c) => c.id === id)
      if (!category) throw new Error('Categoria não encontrada.')
      Object.assign(category, input)
      return { ...category }
    }
    const { data } = await api.put<Category>(`/categories/${id}`, input)
    return data
  },
}

export interface TransactionFilters {
  month?: string // formato YYYY-MM
  type?: Transaction['type']
  categoryId?: string
  search?: string
}

export const transactionService = {
  async list(filters: TransactionFilters = {}): Promise<Array<Transaction>> {
    if (env.useMocks) {
      await delay(MOCK_LATENCY)
      const search = filters.search?.trim().toLowerCase()
      return mockTransactions.filter(
        (t) =>
          (!filters.month || t.date.startsWith(filters.month)) &&
          (!filters.type || t.type === filters.type) &&
          (!filters.categoryId || t.categoryId === filters.categoryId) &&
          (!search || t.description.toLowerCase().includes(search)),
      )
    }
    const { data } = await api.get<Array<Transaction>>('/transactions', {
      params: filters,
    })
    return data
  },

  async create(input: TransactionInput): Promise<Transaction> {
    if (env.useMocks) {
      await delay(MOCK_LATENCY)
      const transaction = { ...input, id: generateId() }
      mockTransactions.unshift(transaction)
      mockTransactions.sort((a, b) => b.date.localeCompare(a.date))
      const account = mockAccounts.find((a) => a.id === input.accountId)
      if (account)
        account.balance +=
          input.type === 'income' ? input.amount : -input.amount
      return transaction
    }
    const { data } = await api.post<Transaction>('/transactions', input)
    return data
  },

  async remove(id: string): Promise<void> {
    if (env.useMocks) {
      await delay(MOCK_LATENCY)
      const index = mockTransactions.findIndex((t) => t.id === id)
      if (index >= 0) {
        const [removed] = mockTransactions.splice(index, 1)
        const account = mockAccounts.find((a) => a.id === removed.accountId)
        if (account)
          account.balance -=
            removed.type === 'income' ? removed.amount : -removed.amount
      }
      return
    }
    await api.delete(`/transactions/${id}`)
  },
}

export const goalService = {
  async list(): Promise<Array<Goal>> {
    if (env.useMocks) {
      await delay(MOCK_LATENCY)
      return [...mockGoals]
    }
    const { data } = await api.get<Array<Goal>>('/goals')
    return data
  },

  async create(input: GoalInput): Promise<Goal> {
    if (env.useMocks) {
      await delay(MOCK_LATENCY)
      const goal = { ...input, id: generateId() }
      mockGoals.push(goal)
      return goal
    }
    const { data } = await api.post<Goal>('/goals', input)
    return data
  },

  async contribute(id: string, amount: number): Promise<Goal> {
    if (env.useMocks) {
      await delay(MOCK_LATENCY)
      const goal = mockGoals.find((g) => g.id === id)
      if (!goal) throw new Error('Meta não encontrada.')
      goal.currentAmount += amount
      return { ...goal }
    }
    const { data } = await api.post<Goal>(`/goals/${id}/contributions`, {
      amount,
    })
    return data
  },
}
