import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Ban,
  CalendarClock,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
} from 'lucide-react'
import { apiErrorMessage, apiFieldErrors, goalApi } from '#/api/api'
import type { Contribution, Goal, GoalRequest, GoalStatus } from '#/api/types'
import { CategoryIcon } from '#/components/category-icon'
import { ColorPicker, Field, FormError } from '#/components/form'
import { PageHeader } from '#/components/layout/page-header'
import { EmptyState, ErrorState } from '#/components/layout/states'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardAction,
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
} from '#/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Progress } from '#/components/ui/progress'
import { Skeleton } from '#/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Textarea } from '#/components/ui/textarea'
import { useAsync } from '#/hooks/use-async'
import {
  amountToInput,
  cn,
  colorPalette,
  formatCurrency,
  formatDate,
  formatPercent,
  parseAmount,
  todayISO,
} from '#/lib/utils'

export const Route = createFileRoute('/_app/metas')({
  component: GoalsPage,
})

function toRequest(g: Goal, overrides: Partial<GoalRequest> = {}): GoalRequest {
  return {
    name: g.name,
    description: g.description,
    targetAmount: g.targetAmount,
    deadline: g.deadline,
    status: g.status,
    icon: g.icon,
    color: g.color,
    ...overrides,
  }
}

function useFormErrors() {
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  return {
    error,
    fieldErrors,
    reset() {
      setError(null)
      setFieldErrors({})
    },
    capture(err: unknown) {
      const fields = apiFieldErrors(err)
      setFieldErrors(fields)
      setError(Object.keys(fields).length === 0 ? apiErrorMessage(err) : null)
    },
  }
}

function GoalFormDialog({
  open,
  goal,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  goal?: Goal
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [color, setColor] = useState(colorPalette[0])
  const errors = useFormErrors()

  useEffect(() => {
    if (!open) return
    setColor(goal?.color ?? colorPalette[0])
    errors.reset()
  }, [open, goal])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const target = parseAmount(form.get('targetAmount'))
    const initial = parseAmount(form.get('initialAmount'))
    const base: GoalRequest = {
      name: String(form.get('name')).trim(),
      description: String(form.get('description')).trim() || undefined,
      targetAmount: Number.isNaN(target) ? 0 : target,
      deadline: String(form.get('deadline')) || undefined,
      color,
      icon: goal?.icon ?? 'target',
    }
    try {
      if (goal) await goalApi.update(goal.id, { ...base, status: goal.status })
      else
        await goalApi.create({
          ...base,
          initialAmount: Number.isNaN(initial) ? undefined : initial,
        })
      onOpenChange(false)
      onSaved()
    } catch (err) {
      errors.capture(err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {goal ? 'Editar meta' : 'Nova meta financeira'}
          </DialogTitle>
          <DialogDescription>
            Defina um objetivo e acompanhe sua evolução.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <Field
            label="Nome da meta"
            htmlFor="name"
            error={errors.fieldErrors.name}
          >
            <Input
              id="name"
              name="name"
              required
              maxLength={80}
              defaultValue={goal?.name}
              placeholder="Ex.: Reserva de emergência"
            />
          </Field>
          <Field
            label="Descrição (opcional)"
            htmlFor="description"
            error={errors.fieldErrors.description}
          >
            <Textarea
              id="description"
              name="description"
              rows={2}
              maxLength={255}
              defaultValue={goal?.description}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Valor alvo (R$)"
              htmlFor="targetAmount"
              error={errors.fieldErrors.targetAmount}
            >
              <Input
                id="targetAmount"
                name="targetAmount"
                inputMode="decimal"
                required
                defaultValue={amountToInput(goal?.targetAmount)}
              />
            </Field>
            {!goal && (
              <Field
                label="Já guardado (R$)"
                htmlFor="initialAmount"
                error={errors.fieldErrors.initialAmount}
              >
                <Input
                  id="initialAmount"
                  name="initialAmount"
                  inputMode="decimal"
                  placeholder="0,00"
                />
              </Field>
            )}
            <Field
              label="Prazo (opcional)"
              htmlFor="deadline"
              error={errors.fieldErrors.deadline}
            >
              <Input
                id="deadline"
                name="deadline"
                type="date"
                min={goal ? undefined : todayISO()}
                defaultValue={goal?.deadline}
              />
            </Field>
          </div>
          <div className="grid gap-2">
            <Label>Cor</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <FormError message={errors.error} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">{goal ? 'Salvar' : 'Criar meta'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ContributionDialog({
  goal,
  mode,
  onClose,
  onSaved,
}: {
  goal?: Goal
  mode: 'deposit' | 'withdraw'
  onClose: () => void
  onSaved: () => void
}) {
  const errors = useFormErrors()
  useEffect(() => {
    errors.reset()
  }, [goal])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!goal) return
    const form = new FormData(event.currentTarget)
    const amount = parseAmount(form.get('amount'))
    try {
      await goalApi.contribute(goal.id, {
        amount: mode === 'withdraw' ? -amount : amount,
        date: String(form.get('date')) || undefined,
        note: String(form.get('note')).trim() || undefined,
      })
      onClose()
      onSaved()
    } catch (err) {
      errors.capture(err)
    }
  }

  return (
    <Dialog open={!!goal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === 'deposit' ? 'Guardar dinheiro' : 'Resgatar dinheiro'}
          </DialogTitle>
          <DialogDescription>
            {goal?.name} · guardado: {formatCurrency(goal?.currentAmount ?? 0)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <Field
            label="Valor (R$)"
            htmlFor="amount"
            error={errors.fieldErrors.amount}
          >
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              required
              autoFocus
            />
          </Field>
          <Field label="Data" htmlFor="date" error={errors.fieldErrors.date}>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={todayISO()}
            />
          </Field>
          <Field
            label="Observação (opcional)"
            htmlFor="note"
            error={errors.fieldErrors.note}
          >
            <Input id="note" name="note" maxLength={120} />
          </Field>
          <FormError message={errors.error} />
          <DialogFooter>
            <Button
              type="submit"
              variant={mode === 'withdraw' ? 'outline' : 'default'}
            >
              {mode === 'deposit' ? 'Guardar' : 'Resgatar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HistoryDialog({
  goal,
  onClose,
}: {
  goal?: Goal
  onClose: () => void
}) {
  const [items, setItems] = useState<Array<Contribution> | null>(null)
  useEffect(() => {
    setItems(null)
    if (goal) goalApi.contributions(goal.id).then(setItems, () => setItems([]))
  }, [goal])
  return (
    <Dialog open={!!goal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Histórico de aportes</DialogTitle>
          <DialogDescription>{goal?.name}</DialogDescription>
        </DialogHeader>
        {items === null ? (
          <Skeleton className="h-32" />
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum aporte registrado.
          </p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {items.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p>
                    {formatDate(c.date, {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  {c.note && (
                    <p className="truncate text-xs text-muted-foreground">
                      {c.note}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    'font-medium tabular-nums',
                    c.amount >= 0 ? 'text-income' : 'text-expense',
                  )}
                >
                  {c.amount >= 0 ? '+ ' : '− '}
                  {formatCurrency(Math.abs(c.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}

const statusLabel: Record<GoalStatus, string> = {
  ACTIVE: 'Ativa',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
}

function GoalCard({
  goal,
  onEdit,
  onDeposit,
  onWithdraw,
  onHistory,
  onCancel,
  onRemove,
}: {
  goal: Goal
  onEdit: () => void
  onDeposit: () => void
  onWithdraw: () => void
  onHistory: () => void
  onCancel: () => void
  onRemove: () => void
}) {
  const color = goal.color ?? 'var(--primary)'
  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 items-start gap-3">
          <CategoryIcon
            icon={goal.icon}
            color={color}
            fallback={Target}
            className="size-10"
          />
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 truncate">
              {goal.name}
              {goal.status !== 'ACTIVE' && (
                <Badge
                  variant={goal.status === 'COMPLETED' ? 'income' : 'outline'}
                >
                  {statusLabel[goal.status]}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              {goal.deadline ? (
                <>
                  <CalendarClock className="size-3.5" />
                  até{' '}
                  {formatDate(goal.deadline, {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </>
              ) : (
                'Sem prazo'
              )}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Ações de ${goal.name}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onHistory}>
                <History /> Histórico de aportes
              </DropdownMenuItem>
              {goal.currentAmount > 0 && goal.status !== 'CANCELLED' && (
                <DropdownMenuItem onSelect={onWithdraw}>
                  Resgatar dinheiro
                </DropdownMenuItem>
              )}
              {goal.status === 'ACTIVE' && (
                <DropdownMenuItem onSelect={onCancel}>
                  <Ban /> Cancelar meta
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                <Trash2 /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {goal.description && (
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        )}
        <div className="flex items-center gap-3">
          <Progress
            value={goal.progressPercentage}
            className="h-2.5"
            indicatorStyle={{ backgroundColor: color }}
          />
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color }}
          >
            {formatPercent(goal.progressPercentage)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium tabular-nums">
            {formatCurrency(goal.currentAmount)}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          {goal.status === 'COMPLETED'
            ? 'Meta atingida! 🎉'
            : goal.status === 'CANCELLED'
              ? 'Meta cancelada.'
              : goal.monthlyAmountNeeded !== undefined
                ? `Guarde ${formatCurrency(goal.monthlyAmountNeeded)} por mês para atingir a meta no prazo. Faltam ${formatCurrency(goal.remainingAmount)}.`
                : `Faltam ${formatCurrency(goal.remainingAmount)} para atingir a meta.`}
        </p>
      </CardContent>
      {goal.status === 'ACTIVE' && (
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={onDeposit}>
            <Plus /> Guardar dinheiro
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

function GoalsPage() {
  const [status, setStatus] = useState<GoalStatus>('ACTIVE')
  const [form, setForm] = useState<{ open: boolean; goal?: Goal }>({
    open: false,
  })
  const [contribution, setContribution] = useState<{
    goal?: Goal
    mode: 'deposit' | 'withdraw'
  }>({ mode: 'deposit' })
  const [history, setHistory] = useState<Goal | undefined>()
  const [message, setMessage] = useState<string | null>(null)
  const { data, error, isLoading, reload } = useAsync(
    () => goalApi.list(status),
    [status],
  )

  async function run(action: () => Promise<unknown>) {
    setMessage(null)
    try {
      await action()
      void reload()
    } catch (err) {
      setMessage(apiErrorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Metas financeiras"
        description="Planeje seus objetivos e acompanhe o progresso."
        actions={
          <Button onClick={() => setForm({ open: true })}>
            <Plus /> Nova meta
          </Button>
        }
      />
      <Tabs value={status} onValueChange={(v) => setStatus(v as GoalStatus)}>
        <TabsList>
          <TabsTrigger value="ACTIVE">Ativas</TabsTrigger>
          <TabsTrigger value="COMPLETED">Concluídas</TabsTrigger>
          <TabsTrigger value="CANCELLED">Canceladas</TabsTrigger>
        </TabsList>
      </Tabs>
      <FormError message={message} />
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
          title={
            status === 'ACTIVE'
              ? 'Você não tem metas ativas'
              : 'Nenhuma meta aqui'
          }
          description={
            status === 'ACTIVE'
              ? 'Crie uma meta para começar a planejar.'
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => setForm({ open: true, goal })}
              onDeposit={() => setContribution({ goal, mode: 'deposit' })}
              onWithdraw={() => setContribution({ goal, mode: 'withdraw' })}
              onHistory={() => setHistory(goal)}
              onCancel={() => {
                if (window.confirm(`Cancelar a meta "${goal.name}"?`))
                  void run(() =>
                    goalApi.update(
                      goal.id,
                      toRequest(goal, { status: 'CANCELLED' }),
                    ),
                  )
              }}
              onRemove={() => {
                if (
                  window.confirm(
                    `Excluir a meta "${goal.name}" e todo o histórico?`,
                  )
                )
                  void run(() => goalApi.remove(goal.id))
              }}
            />
          ))}
        </div>
      )}
      <GoalFormDialog
        open={form.open}
        goal={form.goal}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        onSaved={reload}
      />
      <ContributionDialog
        goal={contribution.goal}
        mode={contribution.mode}
        onClose={() => setContribution((c) => ({ ...c, goal: undefined }))}
        onSaved={reload}
      />
      <HistoryDialog goal={history} onClose={() => setHistory(undefined)} />
    </>
  )
}
