import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  PiggyBank,
  Plus,
  Sparkles,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CashFlowChart } from '#/components/charts/cash-flow-chart'
import { SpendingDonut } from '#/components/charts/spending-donut'
import { CategoryIcon } from '#/components/category-icon'
import { PageHeader } from '#/components/layout/page-header'
import { EmptyState, ErrorState } from '#/components/layout/states'
import { Money } from '#/components/money'
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
import { Skeleton } from '#/components/ui/skeleton'
import { useAuth } from '#/features/auth/auth-store'
import { useAsync } from '#/hooks/use-async'
import { cn, formatCurrency, formatDate, formatPercent } from '#/lib/utils'
import { dashboardService } from '#/services/dashboard.service'
import { categoryService } from '#/services/finance.service'
import type { Insight } from '#/types'

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

const insightStyles: Record<
  Insight['level'],
  { icon: LucideIcon; className: string }
> = {
  warning: { icon: AlertTriangle, className: 'text-chart-3 bg-chart-3/12' },
  success: { icon: Sparkles, className: 'text-income bg-income/12' },
  info: { icon: Info, className: 'text-chart-2 bg-chart-2/12' },
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
  const { data, error, isLoading, reload } = useAsync(async () => {
    const [summary, categories] = await Promise.all([
      dashboardService.summary(),
      categoryService.list(),
    ])
    return { summary, categories }
  })
  const firstName = user?.name.split(' ')[0] ?? ''

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}!`}
        description="Aqui está o resumo da sua vida financeira neste mês."
        actions={
          <TransactionFormDialog
            onCreated={reload}
            trigger={
              <Button>
                <Plus /> Nova movimentação
              </Button>
            }
          />
        }
      />

      {isLoading && !data ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Saldo total"
              value={formatCurrency(data.summary.totalBalance)}
              icon={Wallet}
              tone="primary"
              hint="Somando todas as contas"
            />
            <StatCard
              title="Receitas do mês"
              value={formatCurrency(data.summary.monthIncome)}
              icon={ArrowUpRight}
              tone="income"
            />
            <StatCard
              title="Despesas do mês"
              value={formatCurrency(data.summary.monthExpense)}
              icon={ArrowDownRight}
              tone="expense"
            />
            <StatCard
              title="Taxa de economia"
              value={formatPercent(data.summary.savingsRate)}
              icon={PiggyBank}
              tone="neutral"
              hint="Quanto sobrou das receitas"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Fluxo de caixa</CardTitle>
                <CardDescription>
                  Receitas e despesas dos últimos 6 meses
                </CardDescription>
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
                <CashFlowChart data={data.summary.history} />
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
                {data.summary.spendingByCategory.length > 0 ? (
                  <SpendingDonut data={data.summary.spendingByCategory} />
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
                <ul className="divide-y">
                  {data.summary.recentTransactions.map((t) => {
                    const category = data.categories.find(
                      (c) => c.id === t.categoryId,
                    )
                    return (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <CategoryIcon
                          icon={category?.icon}
                          color={category?.color}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {t.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {category?.name} · {formatDate(t.date)}
                          </p>
                        </div>
                        <Money
                          value={t.amount}
                          type={t.type}
                          className="text-sm"
                        />
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" /> Insights da IA
                </CardTitle>
                <CardDescription>
                  Pontos de atenção identificados no seu mês
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.summary.insights.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Tudo tranquilo por aqui. Continue assim!
                  </p>
                )}
                {data.summary.insights.map((insight) => {
                  const style = insightStyles[insight.level]
                  const Icon = style.icon
                  return (
                    <div
                      key={insight.id}
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
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {insight.description}
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
        </>
      ) : null}
    </>
  )
}
