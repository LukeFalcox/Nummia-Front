import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { formatMonth, shiftYearMonth, toYearMonth } from '#/lib/utils'

export function MonthPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (month: string) => void
}) {
  const isCurrent = value >= toYearMonth(new Date())
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Mês anterior"
        onClick={() => onChange(shiftYearMonth(value, -1))}
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-36 text-center text-sm font-medium first-letter:uppercase">
        {formatMonth(value)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Próximo mês"
        disabled={isCurrent}
        onClick={() => onChange(shiftYearMonth(value, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
