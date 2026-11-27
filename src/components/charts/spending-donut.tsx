import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { CategoryShare } from '#/api/types'
import { formatCurrency, formatPercent } from '#/lib/utils'

const fallbackColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
]

export function SpendingDonut({
  data,
  total,
}: {
  data: Array<CategoryShare>
  total: number
}) {
  const colored = data.map((d, i) => ({
    ...d,
    fill: d.color ?? fallbackColors[i % fallbackColors.length],
  }))
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row xl:flex-col 2xl:flex-row">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={colored}
              dataKey="total"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {colored.map((entry) => (
                <Cell key={entry.categoryId} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 13,
              }}
              itemStyle={{ color: 'var(--popover-foreground)' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-sm font-semibold tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {colored.slice(0, 7).map((item) => (
          <li key={item.categoryId} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            <span className="flex-1 truncate">{item.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {formatPercent(item.percentage)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
