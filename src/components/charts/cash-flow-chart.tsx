import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompactCurrency, formatCurrency } from '#/lib/utils'
import type { MonthlySummary } from '#/types'

export function CashFlowChart({ data }: { data: Array<MonthlySummary> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--income)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--income)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--expense)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickFormatter={(v: number) => formatCompactCurrency(v)}
        />
        <Tooltip
          cursor={{ stroke: 'var(--border)' }}
          contentStyle={{
            background: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--popover-foreground)',
            fontSize: 13,
          }}
          formatter={(value, name) => [
            formatCurrency(Number(value)),
            name === 'income' ? 'Receitas' : 'Despesas',
          ]}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="var(--income)"
          strokeWidth={2}
          fill="url(#fillIncome)"
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="var(--expense)"
          strokeWidth={2}
          fill="url(#fillExpense)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
