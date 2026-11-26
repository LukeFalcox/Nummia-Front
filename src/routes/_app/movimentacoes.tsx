import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react'
import { CategoryIcon } from '#/components/category-icon'
import { PageHeader } from '#/components/layout/page-header'
import { EmptyState, ErrorState } from '#/components/layout/states'
import { Money } from '#/components/money'
import { TransactionFormDialog } from '#/components/transactions/transaction-form-dialog'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { NativeSelect } from '#/components/ui/native-select'
import { Skeleton } from '#/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { useAsync } from '#/hooks/use-async'
import { formatCurrency, formatDate } from '#/lib/utils'
import { monthKey } from '#/services/dashboard.service'
import {
  accountService,
  categoryService,
  transactionService,
} from '#/services/finance.service'
import type { TransactionType } from '#/types'

export const Route = createFileRoute('/_app/movimentacoes')({
  component: TransactionsPage,
})

function TransactionsPage() {
  const [monthOffset, setMonthOffset] = useState(0)
  const [type, setType] = useState<TransactionType | 'all'>('all')
  const [categoryId, setCategoryId] = useState('')
  const [search, setSearch] = useState('')

  const monthDate = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  }, [monthOffset])
  const month = monthKey(monthDate)

  const lookups = useAsync(async () => {
    const [categories, accounts] = await Promise.all([
      categoryService.list(),
      accountService.list(),
    ])
    return { categories, accounts }
  })
  const list = useAsync(
    () =>
      transactionService.list({
        month,
        type: type === 'all' ? undefined : type,
        categoryId: categoryId || undefined,
        search,
      }),
    [month, type, categoryId, search],
  )

  const transactions = list.data ?? []
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  async function handleRemove(id: string) {
    if (!window.confirm('Excluir esta movimentação?')) return
    await transactionService.remove(id)
    void list.reload()
  }

  return (
    <>
      <PageHeader
        title="Movimentações"
        description="Registre e acompanhe suas receitas e despesas."
        actions={
          <TransactionFormDialog
            onCreated={list.reload}
            trigger={
              <Button>
                <Plus /> Nova movimentação
              </Button>
            }
          />
        }
      />

      <Card className="py-4">
        <CardContent className="flex flex-col gap-3 px-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Mês anterior"
              onClick={() => setMonthOffset((m) => m - 1)}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-36 text-center text-sm font-medium capitalize">
              {new Intl.DateTimeFormat('pt-BR', {
                month: 'long',
                year: 'numeric',
              }).format(monthDate)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Próximo mês"
              disabled={monthOffset >= 0}
              onClick={() => setMonthOffset((m) => m + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <Tabs
            value={type}
            onValueChange={(v) => setType(v as TransactionType | 'all')}
          >
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="income">Receitas</TabsTrigger>
              <TabsTrigger value="expense">Despesas</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="w-full lg:w-48">
            <NativeSelect
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-label="Filtrar por categoria"
            >
              <option value="">Todas as categorias</option>
              {lookups.data?.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar descrição…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Entradas', value: income, className: 'text-income' },
          { label: 'Saídas', value: expense, className: 'text-expense' },
          { label: 'Resultado', value: income - expense, className: '' },
        ].map((item) => (
          <Card key={item.label} className="gap-1 px-4 py-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p
              className={`text-base font-semibold tabular-nums sm:text-lg ${item.className}`}
            >
              {formatCurrency(item.value)}
            </p>
          </Card>
        ))}
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : list.isLoading && !list.data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Nenhuma movimentação encontrada"
          description="Ajuste os filtros ou registre uma nova movimentação."
        />
      ) : (
        <Card className="py-2">
          <ul className="divide-y">
            {transactions.map((t) => {
              const category = lookups.data?.categories.find(
                (c) => c.id === t.categoryId,
              )
              const account = lookups.data?.accounts.find(
                (a) => a.id === t.accountId,
              )
              return (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 px-4 py-3 sm:px-6"
                >
                  <CategoryIcon icon={category?.icon} color={category?.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {t.description}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {category?.name} · {account?.name}
                    </p>
                  </div>
                  <span className="hidden w-20 text-right text-xs text-muted-foreground sm:block">
                    {formatDate(t.date, { day: '2-digit', month: '2-digit' })}
                  </span>
                  <Money
                    value={t.amount}
                    type={t.type}
                    className="w-32 text-right text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir ${t.description}`}
                    className="text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    onClick={() => void handleRemove(t.id)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </>
  )
}
