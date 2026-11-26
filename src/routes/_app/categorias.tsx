import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Check, Pencil, X } from 'lucide-react'
import { CategoryIcon } from '#/components/category-icon'
import { PageHeader } from '#/components/layout/page-header'
import { ErrorState } from '#/components/layout/states'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Progress } from '#/components/ui/progress'
import { Skeleton } from '#/components/ui/skeleton'
import { useAsync } from '#/hooks/use-async'
import { cn, formatCurrency } from '#/lib/utils'
import { dashboardService } from '#/services/dashboard.service'
import { categoryService } from '#/services/finance.service'
import type { Category } from '#/types'

export const Route = createFileRoute('/_app/categorias')({
  component: CategoriesPage,
})

function LimitEditor({
  category,
  onSaved,
}: {
  category: Category
  onSaved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(category.monthlyLimit ?? ''))

  async function save() {
    const limit = Number(value.replace(',', '.'))
    await categoryService.update(category.id, {
      monthlyLimit: limit > 0 ? limit : undefined,
    })
    setEditing(false)
    onSaved()
  }

  if (!editing) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Editar limite de ${category.name}`}
        onClick={() => setEditing(true)}
      >
        <Pencil />
      </Button>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <Input
        autoFocus
        aria-label="Limite mensal"
        inputMode="decimal"
        className="h-8 w-28"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void save()
          if (e.key === 'Escape') setEditing(false)
        }}
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label="Salvar limite"
        onClick={() => void save()}
      >
        <Check />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cancelar"
        onClick={() => setEditing(false)}
      >
        <X />
      </Button>
    </div>
  )
}

function CategoriesPage() {
  const { data, error, isLoading, reload } = useAsync(async () => {
    const [categories, summary] = await Promise.all([
      categoryService.list(),
      dashboardService.summary(),
    ])
    return { categories, summary }
  })

  const expenses = data?.categories.filter((c) => c.type === 'expense') ?? []
  const incomes = data?.categories.filter((c) => c.type === 'income') ?? []
  const planned = expenses.reduce((s, c) => s + (c.monthlyLimit ?? 0), 0)
  const spent = data?.summary.monthExpense ?? 0

  return (
    <>
      <PageHeader
        title="Categorias e planejamento"
        description="Defina limites mensais e acompanhe seus gastos por categoria."
      />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : isLoading && !data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Orçamento do mês</CardTitle>
              <CardDescription>
                {formatCurrency(spent)} gastos de {formatCurrency(planned)}{' '}
                planejados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress
                value={planned ? (spent / planned) * 100 : 0}
                className="h-3"
                indicatorClassName={cn(spent > planned && 'bg-expense')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Despesas</CardTitle>
              <CardDescription>
                Clique no lápis para ajustar o limite mensal de cada categoria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {expenses.map((category) => {
                  const amount =
                    data?.summary.spendingByCategory.find(
                      (s) => s.categoryId === category.id,
                    )?.amount ?? 0
                  const limit = category.monthlyLimit
                  const ratio = limit ? amount / limit : 0
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
                            {ratio > 1 && (
                              <Badge variant="expense">Acima do limite</Badge>
                            )}
                            {ratio > 0.85 && ratio <= 1 && (
                              <Badge variant="outline">Perto do limite</Badge>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatCurrency(amount)}{' '}
                            {limit
                              ? `de ${formatCurrency(limit)}`
                              : '· sem limite'}
                          </span>
                        </div>
                        <Progress
                          value={ratio * 100}
                          indicatorStyle={{
                            backgroundColor:
                              ratio > 1 ? 'var(--expense)' : category.color,
                          }}
                        />
                      </div>
                      <LimitEditor category={category} onSaved={reload} />
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receitas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {incomes.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-2 rounded-lg border py-1.5 pr-3 pl-1.5"
                >
                  <CategoryIcon
                    icon={category.icon}
                    color={category.color}
                    className="size-7"
                  />
                  <span className="text-sm">{category.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}
