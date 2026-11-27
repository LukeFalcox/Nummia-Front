import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Archive,
  Check,
  Copy,
  Lightbulb,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import {
  analysisApi,
  apiErrorMessage,
  apiErrorStatus,
  apiFieldErrors,
  budgetApi,
  categoryApi,
} from '#/api/api'
import type {
  Budget,
  Category,
  CategoryRequest,
  CategoryType,
} from '#/api/types'
import { BudgetProgress } from '#/components/budget-progress'
import { CategoryIcon, iconMap } from '#/components/category-icon'
import { ColorPicker, Field, FormError } from '#/components/form'
import { PageHeader } from '#/components/layout/page-header'
import { ErrorState } from '#/components/layout/states'
import { MonthPicker } from '#/components/month-picker'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Skeleton } from '#/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { useAsync } from '#/hooks/use-async'
import {
  amountToInput,
  cn,
  colorPalette,
  formatCurrency,
  formatMonth,
  parseAmount,
  shiftYearMonth,
  toYearMonth,
} from '#/lib/utils'

export const Route = createFileRoute('/_app/categorias')({
  component: CategoriesPage,
})

const iconNames = Object.keys(iconMap).filter((n) => n !== 'home')

function toRequest(
  c: Category,
  overrides: Partial<CategoryRequest> = {},
): CategoryRequest {
  return {
    name: c.name,
    type: c.type,
    color: c.color,
    icon: c.icon,
    archived: c.archived,
    ...overrides,
  }
}

function CategoryFormDialog({
  open,
  category,
  defaultType,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  category?: Category
  defaultType: CategoryType
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [type, setType] = useState<CategoryType>(defaultType)
  const [color, setColor] = useState(colorPalette[0])
  const [icon, setIcon] = useState('circle-dollar-sign')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setType(category?.type ?? defaultType)
    setColor(category?.color ?? colorPalette[0])
    setIcon(category?.icon ?? 'circle-dollar-sign')
    setError(null)
    setFieldErrors({})
  }, [open, category, defaultType])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = String(new FormData(event.currentTarget).get('name')).trim()
    const body: CategoryRequest = {
      name,
      type,
      color,
      icon,
      archived: category?.archived ?? false,
    }
    try {
      if (category) await categoryApi.update(category.id, body)
      else await categoryApi.create(body)
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const fields = apiFieldErrors(err)
      setFieldErrors(fields)
      if (Object.keys(fields).length === 0) setError(apiErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? 'Editar categoria' : 'Nova categoria'}
          </DialogTitle>
          <DialogDescription>
            Categorias organizam suas receitas e despesas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <Tabs value={type} onValueChange={(v) => setType(v as CategoryType)}>
            <TabsList className="w-full">
              <TabsTrigger value="EXPENSE" disabled={!!category}>
                Despesa
              </TabsTrigger>
              <TabsTrigger value="INCOME" disabled={!!category}>
                Receita
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Field label="Nome" htmlFor="name" error={fieldErrors.name}>
            <Input
              id="name"
              name="name"
              required
              maxLength={50}
              defaultValue={category?.name}
            />
          </Field>
          <div className="grid gap-2">
            <Label>Cor</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="grid gap-2">
            <Label>Ícone</Label>
            <div
              className="grid max-h-40 grid-cols-8 gap-1.5 overflow-y-auto rounded-lg border p-2"
              role="radiogroup"
              aria-label="Ícone"
            >
              {iconNames.map((name) => {
                const Icon = iconMap[name]
                return (
                  <button
                    key={name}
                    type="button"
                    role="radio"
                    aria-checked={icon === name}
                    aria-label={name}
                    title={name}
                    onClick={() => setIcon(name)}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-md text-muted-foreground hover:bg-accent',
                      icon === name &&
                        'bg-accent text-foreground ring-2 ring-primary',
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                )
              })}
            </div>
          </div>
          <FormError message={error} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LimitEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: number
  onSave: (value: number) => Promise<void>
  onCancel: () => void
}) {
  const [value, setValue] = useState(amountToInput(initial))
  const save = () => {
    const limit = parseAmount(value)
    if (limit > 0) void onSave(limit)
  }
  return (
    <div className="flex items-center gap-1">
      <Input
        autoFocus
        aria-label="Limite mensal"
        inputMode="decimal"
        placeholder="Limite"
        className="h-8 w-28"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') onCancel()
        }}
      />
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Salvar limite"
        onClick={save}
      >
        <Check />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Cancelar"
        onClick={onCancel}
      >
        <X />
      </Button>
    </div>
  )
}

function CategoryMenu({
  category,
  budget,
  onEdit,
  onArchive,
  onRemove,
  onRemoveBudget,
}: {
  category: Category
  budget?: Budget
  onEdit: () => void
  onArchive: () => void
  onRemove: () => void
  onRemoveBudget?: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`Ações de ${category.name}`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil /> Editar categoria
        </DropdownMenuItem>
        {budget && onRemoveBudget && (
          <DropdownMenuItem onSelect={onRemoveBudget}>
            <X /> Remover orçamento do mês
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onArchive}>
          <Archive /> Arquivar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onRemove}>
          <Trash2 /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CategoriesPage() {
  const [month, setMonth] = useState(() => toYearMonth(new Date()))
  const [editingLimit, setEditingLimit] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{
    open: boolean
    category?: Category
    type: CategoryType
  }>({ open: false, type: 'EXPENSE' })
  const [message, setMessage] = useState<string | null>(null)
  const isCurrentMonth = month === toYearMonth(new Date())

  const { data, error, isLoading, reload } = useAsync(async () => {
    const [categories, budgets, suggestions] = await Promise.all([
      categoryApi.list(),
      budgetApi.list(month),
      analysisApi.budgetSuggestions().catch(() => []),
    ])
    return { categories, budgets, suggestions }
  }, [month])

  const expenses = data?.categories.filter((c) => c.type === 'EXPENSE') ?? []
  const incomes = data?.categories.filter((c) => c.type === 'INCOME') ?? []
  const budgets = data?.budgets ?? []
  const planned = budgets.reduce((s, b) => s + b.limitAmount, 0)
  const spent = budgets.reduce((s, b) => s + b.spent, 0)
  const pendingSuggestions = isCurrentMonth
    ? (data?.suggestions ?? []).filter(
        (s) =>
          s.currentLimit === undefined || s.currentLimit !== s.suggestedLimit,
      )
    : []

  async function run(action: () => Promise<unknown>) {
    setMessage(null)
    try {
      await action()
      setEditingLimit(null)
      void reload()
    } catch (err) {
      setMessage(apiErrorMessage(err))
    }
  }

  function saveLimit(categoryId: string, limitAmount: number) {
    const budget = budgets.find((b) => b.categoryId === categoryId)
    return run(() =>
      budget
        ? budgetApi.update(budget.id, {
            categoryId,
            month,
            limitAmount,
            alertThreshold: budget.alertThreshold,
          })
        : budgetApi.create({ categoryId, month, limitAmount }),
    )
  }

  async function removeCategory(category: Category) {
    if (!window.confirm(`Excluir a categoria "${category.name}"?`)) return
    setMessage(null)
    try {
      await categoryApi.remove(category.id)
      void reload()
    } catch (err) {
      if (
        apiErrorStatus(err) === 409 &&
        window.confirm(
          `${apiErrorMessage(err)}\n\nDeseja arquivar "${category.name}"?`,
        )
      ) {
        await run(() =>
          categoryApi.update(
            category.id,
            toRequest(category, { archived: true }),
          ),
        )
      } else if (apiErrorStatus(err) !== 409) {
        setMessage(apiErrorMessage(err))
      }
    }
  }

  const menuFor = (category: Category, budget?: Budget) => (
    <CategoryMenu
      category={category}
      budget={budget}
      onEdit={() => setDialog({ open: true, category, type: category.type })}
      onArchive={() =>
        void run(() =>
          categoryApi.update(
            category.id,
            toRequest(category, { archived: true }),
          ),
        )
      }
      onRemove={() => void removeCategory(category)}
      onRemoveBudget={
        budget ? () => void run(() => budgetApi.remove(budget.id)) : undefined
      }
    />
  )

  return (
    <>
      <PageHeader
        title="Categorias e planejamento"
        description="Defina limites mensais por categoria e acompanhe seus gastos."
        actions={
          <>
            <MonthPicker value={month} onChange={setMonth} />
            <Button onClick={() => setDialog({ open: true, type: 'EXPENSE' })}>
              <Plus /> Nova categoria
            </Button>
          </>
        }
      />
      <FormError message={message} />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : isLoading && !data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Orçamento de {formatMonth(month)}</CardTitle>
              <CardDescription>
                {budgets.length === 0
                  ? 'Nenhum limite definido para este mês.'
                  : `${formatCurrency(spent)} gastos de ${formatCurrency(planned)} planejados`}
              </CardDescription>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void run(() =>
                      budgetApi.copy(shiftYearMonth(month, -1), month),
                    )
                  }
                  title="Copia os limites do mês anterior para as categorias que ainda não têm orçamento"
                >
                  <Copy /> Copiar do mês anterior
                </Button>
              </CardAction>
            </CardHeader>
            {budgets.length > 0 && (
              <CardContent>
                <BudgetProgress
                  value={planned ? (spent / planned) * 100 : 0}
                  status={
                    spent > planned
                      ? 'EXCEEDED'
                      : spent >= planned * 0.8
                        ? 'WARNING'
                        : 'OK'
                  }
                  className="h-3"
                />
              </CardContent>
            )}
          </Card>

          {pendingSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="size-4 text-chart-3" /> Sugestões de
                  limite
                </CardTitle>
                <CardDescription>
                  Baseadas na média dos últimos 3 meses, com 10% de economia.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pendingSuggestions.map((s) => (
                  <div
                    key={s.categoryId}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {s.categoryName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Média {formatCurrency(s.averageMonthlySpending)} →
                        sugerido{' '}
                        <span className="font-medium text-foreground">
                          {formatCurrency(s.suggestedLimit)}
                        </span>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        void saveLimit(s.categoryId, s.suggestedLimit)
                      }
                    >
                      Aplicar
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Despesas</CardTitle>
              <CardDescription>
                Clique em “Definir limite” ou no valor para ajustar o orçamento
                do mês.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {expenses.map((category) => {
                  const budget = budgets.find(
                    (b) => b.categoryId === category.id,
                  )
                  return (
                    <li
                      key={category.id}
                      className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <CategoryIcon
                        icon={category.icon}
                        color={category.color}
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            {category.name}
                            {budget?.status === 'EXCEEDED' && (
                              <Badge variant="expense">Acima do limite</Badge>
                            )}
                            {budget?.status === 'WARNING' && (
                              <Badge variant="outline">Perto do limite</Badge>
                            )}
                          </span>
                          {editingLimit === category.id ? (
                            <LimitEditor
                              initial={budget?.limitAmount}
                              onSave={(v) => saveLimit(category.id, v)}
                              onCancel={() => setEditingLimit(null)}
                            />
                          ) : budget ? (
                            <button
                              type="button"
                              className="text-xs text-muted-foreground tabular-nums hover:text-foreground"
                              onClick={() => setEditingLimit(category.id)}
                            >
                              {formatCurrency(budget.spent)} de{' '}
                              {formatCurrency(budget.limitAmount)}
                            </button>
                          ) : (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => setEditingLimit(category.id)}
                            >
                              Definir limite
                            </Button>
                          )}
                        </div>
                        {budget && (
                          <BudgetProgress
                            value={budget.usedPercentage}
                            status={budget.status}
                          />
                        )}
                      </div>
                      {menuFor(category, budget)}
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receitas</CardTitle>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialog({ open: true, type: 'INCOME' })}
                >
                  <Plus /> Adicionar
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {incomes.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-2 rounded-lg border py-1.5 pr-1 pl-1.5"
                >
                  <CategoryIcon
                    icon={category.icon}
                    color={category.color}
                    className="size-7"
                  />
                  <span className="text-sm">{category.name}</span>
                  {menuFor(category)}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
      <CategoryFormDialog
        open={dialog.open}
        category={dialog.category}
        defaultType={dialog.type}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onSaved={reload}
      />
    </>
  )
}
