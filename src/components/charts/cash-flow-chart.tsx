import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthlyTotal } from '#/api/types'
import { formatCompactCurrency, formatCurrency, formatMonth } from '#/lib/utils'

export function CashFlowChart({ data }: { data: Array<MonthlyTotal> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        barGap={4}
      >
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickFormatter={(m: string) => formatMonth(m, 'short')}
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
          cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
          contentStyle={{
            background: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--popover-foreground)',
            fontSize: 13,
          }}
          labelFormatter={(m) => formatMonth(String(m))}
          formatter={(value, name) => [
            formatCurrency(Number(value)),
            name === 'income' ? 'Receitas' : 'Despesas',
          ]}
        />
        <Bar
          dataKey="income"
          fill="var(--income)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
        <Bar
          dataKey="expense"
          fill="var(--expense)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
