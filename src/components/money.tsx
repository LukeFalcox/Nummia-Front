import { cn, formatCurrency } from '#/lib/utils'
import type { TransactionType } from '#/api/types'

/** Despesas em vermelho com "−", receitas em verde com "+", transferências neutras. */
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
        'font-medium whitespace-nowrap tabular-nums',
        type === 'INCOME' && 'text-income',
        type === 'EXPENSE' && 'text-expense',
        type === 'TRANSFER' && 'text-muted-foreground',
        className,
      )}
    >
      {type === 'INCOME' ? '+ ' : type === 'EXPENSE' ? '− ' : ''}
      {formatCurrency(value)}
    </span>
  )
}
