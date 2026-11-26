import { useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CalendarClock, Plus, Target } from 'lucide-react'
import { PageHeader } from '#/components/layout/page-header'
import { EmptyState, ErrorState } from '#/components/layout/states'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Progress } from '#/components/ui/progress'
import { Skeleton } from '#/components/ui/skeleton'
import { useAsync } from '#/hooks/use-async'
import { formatCurrency, formatDate, formatPercent } from '#/lib/utils'
import { goalService } from '#/services/finance.service'
import type { Goal } from '#/types'

export const Route = createFileRoute('/_app/metas')({
  component: GoalsPage,
})

function monthsUntil(iso: string) {
  const now = new Date()
  const end = new Date(iso)
  return Math.max(
    1,
    (end.getFullYear() - now.getFullYear()) * 12 +
      end.getMonth() -
      now.getMonth(),
  )
}

function parseAmount(value: FormDataEntryValue | null) {
  return Number(String(value ?? '0').replace(',', '.'))
}

function GoalCard({ goal, onChanged }: { goal: Goal; onChanged: () => void }) {
  const [open, setOpen] = useState(false)
  const progress = goal.currentAmount / goal.targetAmount
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const monthly = remaining / monthsUntil(goal.deadline)

  async function handleContribute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = parseAmount(new FormData(event.currentTarget).get('amount'))
    if (amount <= 0) return
    await goalService.contribute(goal.id, amount)
    setOpen(false)
    onChanged()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in oklch, ${goal.color} 15%, transparent)`,
            color: goal.color,
          }}
        >
          <Target className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate">{goal.name}</CardTitle>
          <CardDescription className="flex items-center gap-1">
            <CalendarClock className="size-3.5" />
            até {formatDate(goal.deadline, { month: 'long', year: 'numeric' })}
          </CardDescription>
        </div>
        <span className="text-sm font-semibold" style={{ color: goal.color }}>
          {formatPercent(Math.min(1, progress))}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress
          value={progress * 100}
          className="h-2.5"
          indicatorStyle={{ backgroundColor: goal.color }}
        />
        <div className="flex justify-between text-sm">
          <span className="font-medium tabular-nums">
            {formatCurrency(goal.currentAmount)}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          {remaining > 0
            ? `Guardando ${formatCurrency(monthly)} por mês você atinge a meta no prazo.`
            : 'Meta atingida! 🎉'}
        </p>
      </CardContent>
      <CardFooter>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full"
              disabled={remaining === 0}
            >
              <Plus /> Adicionar valor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Adicionar à meta</DialogTitle>
              <DialogDescription>{goal.name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleContribute} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`amount-${goal.id}`}>Valor (R$)</Label>
                <Input
                  id={`amount-${goal.id}`}
                  name="amount"
                  inputMode="decimal"
                  required
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="submit">Adicionar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}

function NewGoalDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await goalService.create({
      name: String(form.get('name')).trim(),
      targetAmount: parseAmount(form.get('targetAmount')),
      currentAmount: parseAmount(form.get('currentAmount')),
      deadline: new Date(
        `${String(form.get('deadline'))}-01T12:00:00`,
      ).toISOString(),
      color: 'var(--chart-3)',
    })
    setOpen(false)
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Nova meta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova meta financeira</DialogTitle>
          <DialogDescription>
            Defina um objetivo e acompanhe sua evolução.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da meta</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ex.: Reserva de emergência"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="targetAmount">Valor alvo (R$)</Label>
              <Input
                id="targetAmount"
                name="targetAmount"
                inputMode="decimal"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currentAmount">Já guardado (R$)</Label>
              <Input
                id="currentAmount"
                name="currentAmount"
                inputMode="decimal"
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deadline">Prazo</Label>
            <Input id="deadline" name="deadline" type="month" required />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Criar meta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function GoalsPage() {
  const { data, error, isLoading, reload } = useAsync(() => goalService.list())

  return (
    <>
      <PageHeader
        title="Metas financeiras"
        description="Planeje seus objetivos e acompanhe o progresso."
        actions={<NewGoalDialog onCreated={reload} />}
      />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : isLoading && !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : data?.length === 0 ? (
        <EmptyState
          title="Você ainda não tem metas"
          description="Crie sua primeira meta para começar a planejar."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onChanged={reload} />
          ))}
        </div>
      )}
    </>
  )
}
