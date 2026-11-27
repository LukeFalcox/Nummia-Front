import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Repeat,
  Search,
  Trash2,
} from 'lucide-react'
import {
  accountApi,
  analysisApi,
  apiErrorMessage,
  categoryApi,
  transactionApi,
} from '#/api/api'
import type { Transaction, TransactionType } from '#/api/types'
import { CategoryIcon } from '#/components/category-icon'
import { PageHeader } from '#/components/layout/page-header'
import { EmptyState, ErrorState } from '#/components/layout/states'
import { Money } from '#/components/money'
import { MonthPicker } from '#/components/month-picker'
import { TransactionFormDialog } from '#/components/transactions/transaction-form-dialog'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Input } from '#/components/ui/input'
import { NativeSelect } from '#/components/ui/native-select'
import { Skeleton } from '#/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { useAsync } from '#/hooks/use-async'
import { useDebouncedValue } from '#/hooks/use-debounced-value'
import {
  formatCurrency,
  formatDate,
  monthRange,
  toYearMonth,
} from '#/lib/utils'

export const Route = createFileRoute('/_app/movimentacoes')({
  component: TransactionsPage,
})

const PAGE_SIZE = 20

function TransactionsPage() {
  const [month, setMonth] = useState(() => toYearMonth(new Date()))
  const [type, setType] = useState<TransactionType | 'ALL'>('ALL')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<Transaction | undefined>()
  const [actionError, setActionError] = useState<string | null>(null)
  const debouncedSearch = useDebouncedValue(search)

  const lookups = useAsync(async () => {
    const [categories, accounts] = await Promise.all([
      categoryApi.list(),
      accountApi.list(true),
    ])
    return { categories, accounts }
  })

  const list = useAsync(
    () =>
      transactionApi.list({
        ...monthRange(month),
        type: type === 'ALL' ? undefined : type,
        categoryId: categoryId || undefined,
        accountId: accountId || undefined,
        search: debouncedSearch.trim() || undefined,
        page,
        size: PAGE_SIZE,
      }),
    [month, type, categoryId, accountId, debouncedSearch, page],
  )
  const totals = useAsync(() => analysisApi.summary(month), [month])

  function resetPage<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(0)
    }
  }

  function reloadAll() {
    void list.reload()
    void totals.reload()
  }

  async function handleRemove(t: Transaction) {
    if (!window.confirm(`Excluir "${t.description}"?`)) return
    setActionError(null)
    try {
      await transactionApi.remove(t.id)
      reloadAll()
    } catch (err) {
      setActionError(apiErrorMessage(err))
    }
  }

  const data = list.data
  const categoriesForFilter =
    lookups.data?.categories.filter((c) => type === 'ALL' || c.type === type) ??
    []

  return (
    <>
      <PageHeader
        title="Movimentações"
        description="Registre e acompanhe receitas, despesas e transferências."
        actions={
          <TransactionFormDialog
            onSaved={reloadAll}
            trigger={
              <Button>
                <Plus /> Nova movimentação
              </Button>
            }
          />
        }
      />

      <Card className="py-4">
        <CardContent className="flex flex-col gap-3 px-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <MonthPicker value={month} onChange={resetPage(setMonth)} />
            <Tabs
              value={type}
              onValueChange={(v) => {
                setType(v as TransactionType | 'ALL')
                setCategoryId('')
                setPage(0)
              }}
            >
              <TabsList className="w-full lg:w-auto">
                <TabsTrigger value="ALL">Todas</TabsTrigger>
                <TabsTrigger value="INCOME">Receitas</TabsTrigger>
                <TabsTrigger value="EXPENSE">Despesas</TabsTrigger>
                <TabsTrigger value="TRANSFER">Transf.</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <NativeSelect
              value={accountId}
              onChange={(e) => resetPage(setAccountId)(e.target.value)}
              aria-label="Filtrar por conta"
            >
              <option value="">Todas as contas</option>
              {lookups.data?.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={categoryId}
              onChange={(e) => resetPage(setCategoryId)(e.target.value)}
              aria-label="Filtrar por categoria"
              disabled={type === 'TRANSFER'}
            >
              <option value="">Todas as categorias</option>
              {categoriesForFilter.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar descrição…"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Receitas do mês',
            value: totals.data?.income,
            className: 'text-income',
          },
          {
            label: 'Despesas do mês',
            value: totals.data?.expense,
            className: 'text-expense',
          },
          { label: 'Resultado', value: totals.data?.result, className: '' },
        ].map((item) => (
          <Card key={item.label} className="gap-1 px-4 py-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p
              className={`text-base font-semibold tabular-nums sm:text-lg ${item.className}`}
            >
              {item.value === undefined ? '—' : formatCurrency(item.value)}
            </p>
          </Card>
        ))}
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {actionError}
        </p>
      )}

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : list.isLoading && !data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title="Nenhuma movimentação encontrada"
          description="Ajuste os filtros ou registre uma nova movimentação."
        />
      ) : (
        <Card className="gap-0 py-2">
          <ul className="divide-y">
            {data.content.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 px-4 py-3 sm:px-6"
              >
                <CategoryIcon
                  icon={t.category?.icon}
                  color={t.category?.color}
                  fallback={t.type === 'TRANSFER' ? ArrowLeftRight : undefined}
                />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setEditing(t)}
                >
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {t.description}
                    {t.recurring && (
                      <Repeat
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-label="Recorrente"
                      />
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.type === 'TRANSFER'
                      ? `${t.account.name} → ${t.destinationAccount?.name ?? ''}`
                      : `${t.category?.name ?? ''} · ${t.account.name}`}
                  </p>
                </button>
                <span className="hidden w-20 text-right text-xs text-muted-foreground sm:block">
                  {formatDate(t.date, { day: '2-digit', month: '2-digit' })}
                </span>
                <Money
                  value={t.amount}
                  type={t.type}
                  className="text-right text-sm sm:w-32"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Ações de ${t.description}`}
                      className="text-muted-foreground"
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditing(t)}>
                      <Pencil /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => void handleRemove(t)}
                    >
                      <Trash2 /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t px-4 pt-3 pb-1 text-sm text-muted-foreground sm:px-6">
            <span>
              {data.totalElements}{' '}
              {data.totalElements === 1 ? 'movimentação' : 'movimentações'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Página anterior"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft />
              </Button>
              <span className="tabular-nums">
                {data.page + 1} / {Math.max(1, data.totalPages)}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Próxima página"
                disabled={data.last}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <TransactionFormDialog
        transaction={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(undefined)}
        onSaved={reloadAll}
      />
    </>
  )
}
