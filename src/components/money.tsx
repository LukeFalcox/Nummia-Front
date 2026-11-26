import { cn, formatCurrency } from '#/lib/utils'
import type { TransactionType } from '#/types'

export function Money({
  value,
  type,
  className,
}: {
  value: number
  type?: TransactionType
  className?: string
}) {
  return (
    <span
      className={cn(
        'font-medium tabular-nums',
        type === 'income' && 'text-income',
        type === 'expense' && 'text-expense',
        className,
      )}
    >
      {type === 'income' ? '+ ' : type === 'expense' ? '− ' : ''}
      {formatCurrency(value)}
    </span>
  )
}
