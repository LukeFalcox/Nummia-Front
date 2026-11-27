import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { analysisApi, dashboardApi } from '#/api/api'
import { BudgetProgress } from '#/components/budget-progress'
import { CashFlowChart } from '#/components/charts/cash-flow-chart'
import { SpendingDonut } from '#/components/charts/spending-donut'
import { CategoryIcon } from '#/components/category-icon'
import { PageHeader } from '#/components/layout/page-header'
import { severityStyle } from '#/components/layout/notifications-bell'
import { EmptyState, ErrorState } from '#/components/layout/states'
import { Money } from '#/components/money'
import { MonthPicker } from '#/components/month-picker'
import { TransactionFormDialog } from '#/components/transactions/transaction-form-dialog'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Progress } from '#/components/ui/progress'
import { Skeleton } from '#/components/ui/skeleton'
import { useAuth } from '#/features/auth/auth-store'
import { useAsync } from '#/hooks/use-async'
import {
  cn,
  formatCurrency,
  formatDate,
  formatPercent,
  toYearMonth,
} from '#/lib/utils'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
  hint,
}: {
  title: string
  value: string
  icon: LucideIcon
  tone: 'primary' | 'income' | 'expense' | 'neutral'
  hint?: string
}) {
  const tones = {
    primary: 'bg-primary/12 text-primary',
    income: 'bg-income/12 text-income',
    expense: 'bg-expense/12 text-expense',
    neutral: 'bg-chart-2/12 text-chart-2',
  }
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5">
        <CardDescription>{title}</CardDescription>
        <CardAction>
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              tones[tone],
            )}
          >
            <Icon className="size-4.5" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="px-5">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-96 rounded-xl xl:col-span-2" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  )
}

function DashboardPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(() => toYearMonth(new Date()))
  const { data, error, isLoading, reload } = useAsync(async () => {
    const [dashboard, recommendations] = await Promise.all([
      dashboardApi.get(month),
      analysisApi.recommendations(month).catch(() => []),
    ])
    return { dashboard, recommendations }
  }, [month])
  const firstName = user?.name.split(' ')[0] ?? ''
  const summary = data?.dashboard.summary

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}!`}
        description="Aqui está o resumo da sua vida financeira."
        actions={
          <>
            <MonthPicker value={month} onChange={setMonth} />
            <TransactionFormDialog
              onSaved={reload}
              trigger={
                <Button>
                  <Plus /> Nova movimentação
                </Button>
              }
            />
          </>
        }
      />

      {isLoading && !data ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Saldo total"
              value={formatCurrency(summary.totalBalance)}
              icon={Wallet}
              tone="primary"
              hint="Somando as contas ativas"
            />
            <StatCard
              title="Receitas do mês"
              value={formatCurrency(summary.income)}
              icon={ArrowUpRight}
              tone="income"
            />
            <StatCard
              title="Despesas do mês"
              value={formatCurrency(summary.expense)}
              icon={ArrowDownRight}
              tone="expense"
              hint={`Resultado: ${formatCurrency(summary.result)}`}
            />
            <StatCard
              title="Taxa de poupança"
              value={formatPercent(summary.savingsRate)}
              icon={PiggyBank}
              tone="neutral"
              hint="Quanto sobrou das receitas"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Receitas × despesas</CardTitle>
                <CardDescription>Evolução dos últimos 6 meses</CardDescription>
                <CardAction className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-income" />
                    Receitas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-expense" />
                    Despesas
                  </span>
                </CardAction>
              </CardHeader>
              <CardContent className="pl-2">
                <CashFlowChart data={data.dashboard.monthlyEvolution} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gastos por categoria</CardTitle>
                <CardDescription>
                  Distribuição das despesas do mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary.expensesByCategory.length > 0 ? (
                  <SpendingDonut
                    data={summary.expensesByCategory}
                    total={summary.expense}
                  />
                ) : (
                  <EmptyState title="Sem despesas neste mês" />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Últimas movimentações</CardTitle>
                <CardAction>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/movimentacoes">Ver todas</Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {data.dashboard.recentTransactions.length === 0 ? (
                  <EmptyState
                    title="Nenhuma movimentação ainda"
                    description="Cadastre uma conta e registre sua primeira movimentação."
                  />
                ) : (
                  <ul className="divide-y">
                    {data.dashboard.recentTransactions.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <CategoryIcon
                          icon={t.category?.icon}
                          color={t.category?.color}
                          fallback={
                            t.type === 'TRANSFER' ? ArrowLeftRight : undefined
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {t.description}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {t.type === 'TRANSFER'
                              ? `${t.account.name} → ${t.destinationAccount?.name ?? ''}`
                              : t.category?.name}{' '}
                            · {formatDate(t.date)}
                          </p>
                        </div>
                        <Money
                          value={t.amount}
                          type={t.type}
                          className="text-sm"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" /> Recomendações
                </CardTitle>
                <CardDescription>
                  Pontos de atenção identificados no mês
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recommendations.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Tudo tranquilo por aqui. Continue assim!
                  </p>
                )}
                {data.recommendations.slice(0, 4).map((rec, i) => {
                  const style = severityStyle[rec.severity]
                  const Icon = style.icon
                  return (
                    <div
                      key={`${rec.type}-${i}`}
                      className="flex gap-3 rounded-lg border p-3"
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-md',
                          style.className,
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium">{rec.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {rec.message}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/assistente">Conversar com o assistente</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Orçamentos do mês</CardTitle>
                <CardAction>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/categorias">Planejar</Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.dashboard.budgets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum orçamento definido para este mês.
                  </p>
                ) : (
                  [...data.dashboard.budgets]
                    .sort((a, b) => b.usedPercentage - a.usedPercentage)
                    .slice(0, 5)
                    .map((b) => (
                      <div key={b.id} className="space-y-1.5">
                        <div className="flex justify-between gap-2 text-sm">
                          <span className="truncate font-medium">
                            {b.categoryName}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatCurrency(b.spent)} de{' '}
                            {formatCurrency(b.limitAmount)}
                          </span>
                        </div>
                        <BudgetProgress
                          value={b.usedPercentage}
                          status={b.status}
                        />
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metas ativas</CardTitle>
                <CardAction>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/metas">Ver metas</Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.dashboard.goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma meta ativa.
                  </p>
                ) : (
                  data.dashboard.goals.slice(0, 4).map((g) => (
                    <div key={g.id} className="flex items-center gap-3">
                      <CategoryIcon
                        icon={g.icon}
                        color={g.color}
                        fallback={Target}
                      />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{g.name}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatPercent(g.progressPercentage)}
                          </span>
                        </div>
                        <Progress
                          value={g.progressPercentage}
                          indicatorStyle={
                            g.color ? { backgroundColor: g.color } : undefined
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </>
  )
}
