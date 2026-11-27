import type { BudgetStatus } from '#/api/types'
import { Progress } from '#/components/ui/progress'

/** Cores sugeridas pelo Back-End: OK verde, WARNING amarelo, EXCEEDED vermelho. */
export const budgetStatusColor: Record<BudgetStatus, string> = {
  OK: 'var(--income)',
  WARNING: 'var(--chart-3)',
  EXCEEDED: 'var(--expense)',
}

export function BudgetProgress({
  value,
  status,
  className,
}: {
  value: number
  status: BudgetStatus
  className?: string
}) {
  return (
    <Progress
      value={value}
      className={className}
      indicatorStyle={{ backgroundColor: budgetStatusColor[status] }}
    />
  )
}
