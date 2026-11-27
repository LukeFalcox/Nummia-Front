import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Archive,
  ArchiveRestore,
  CircleEllipsis,
  CreditCard,
  Landmark,
  MoreHorizontal,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  accountApi,
  apiErrorMessage,
  apiErrorStatus,
  apiFieldErrors,
} from '#/api/api'
import type { Account, AccountRequest, AccountType } from '#/api/types'
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
import { NativeSelect } from '#/components/ui/native-select'
import { Progress } from '#/components/ui/progress'
import { Skeleton } from '#/components/ui/skeleton'
import { Switch } from '#/components/ui/switch'
import { useAsync } from '#/hooks/use-async'
import {
  amountToInput,
  cn,
  colorPalette,
  formatCurrency,
  parseAmount,
} from '#/lib/utils'

export const Route = createFileRoute('/_app/contas')({
  component: AccountsPage,
})

const accountTypes: Record<AccountType, { label: string; icon: LucideIcon }> = {
  CHECKING: { label: 'Conta corrente', icon: Landmark },
  SAVINGS: { label: 'Poupança', icon: PiggyBank },
  WALLET: { label: 'Carteira', icon: Wallet },
  CREDIT_CARD: { label: 'Cartão de crédito', icon: CreditCard },
  INVESTMENT: { label: 'Investimento', icon: TrendingUp },
  OTHER: { label: 'Outro', icon: CircleEllipsis },
}

/** Monta o corpo completo do PUT (substitui o registro inteiro) a partir da conta atual. */
function toRequest(
  a: Account,
  overrides: Partial<AccountRequest> = {},
): AccountRequest {
  return {
    name: a.name,
    type: a.type,
    institution: a.institution,
    initialBalance: a.initialBalance,
    creditLimit: a.creditLimit,
    color: a.color,
    archived: a.archived,
    ...overrides,
  }
}

function AccountCard({
  account,
  onEdit,
  onArchive,
  onRemove,
}: {
  account: Account
  onEdit: () => void
  onArchive: () => void
  onRemove: () => void
}) {
  const { label, icon: Icon } = accountTypes[account.type]
  const isCard = account.type === 'CREDIT_CARD'
  // No cartão, saldo negativo = fatura em aberto.
  const invoice = isCard ? Math.max(0, -account.currentBalance) : 0
  const color = account.color ?? 'var(--primary)'
  return (
    <Card className={cn('gap-4', account.archived && 'opacity-60')}>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
              color,
            }}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 truncate">
              {account.name}
              {account.archived && <Badge variant="outline">Arquivada</Badge>}
            </CardTitle>
            <CardDescription className="truncate">
              {[account.institution, label].filter(Boolean).join(' · ')}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Ações de ${account.name}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onArchive}>
                {account.archived ? <ArchiveRestore /> : <Archive />}
                {account.archived ? 'Desarquivar' : 'Arquivar'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                <Trash2 /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {isCard ? 'Fatura atual' : 'Saldo atual'}
          </p>
          <p
            className={cn(
              'text-2xl font-semibold tabular-nums',
              !isCard && account.currentBalance < 0 && 'text-expense',
            )}
          >
            {formatCurrency(isCard ? invoice : account.currentBalance)}
          </p>
        </div>
        {isCard && account.creditLimit ? (
          <div className="space-y-1.5">
            <Progress
              value={(invoice / account.creditLimit) * 100}
              indicatorStyle={{ backgroundColor: color }}
            />
            <p className="text-xs text-muted-foreground">
              Disponível:{' '}
              {formatCurrency(Math.max(0, account.creditLimit - invoice))} de{' '}
              {formatCurrency(account.creditLimit)}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function AccountFormDialog({
  open,
  account,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  account?: Account
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [type, setType] = useState<AccountType>('CHECKING')
  const [color, setColor] = useState(colorPalette[1])
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setType(account?.type ?? 'CHECKING')
    setColor(account?.color ?? colorPalette[1])
    setError(null)
    setFieldErrors({})
  }, [open, account])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const initial = parseAmount(form.get('initialBalance'))
    const limit = parseAmount(form.get('creditLimit'))
    const body: AccountRequest = {
      name: String(form.get('name')).trim(),
      type,
      institution: String(form.get('institution')).trim() || undefined,
      initialBalance: Number.isNaN(initial) ? 0 : initial,
      creditLimit:
        type === 'CREDIT_CARD' && !Number.isNaN(limit) ? limit : undefined,
      color,
      archived: account?.archived ?? false,
    }
    setSubmitting(true)
    setError(null)
    setFieldErrors({})
    try {
      if (account) await accountApi.update(account.id, body)
      else await accountApi.create(body)
      onOpenChange(false)
      onSaved()
    } catch (err) {
      const fields = apiFieldErrors(err)
      setFieldErrors(fields)
      if (Object.keys(fields).length === 0) setError(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {account ? 'Editar conta' : 'Nova conta ou cartão'}
          </DialogTitle>
          <DialogDescription>
            O saldo atual é calculado a partir do saldo inicial e das
            movimentações.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <Field label="Tipo" htmlFor="type" error={fieldErrors.type}>
            <NativeSelect
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
            >
              {Object.entries(accountTypes).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" htmlFor="name" error={fieldErrors.name}>
              <Input
                id="name"
                name="name"
                required
                maxLength={60}
                defaultValue={account?.name}
                placeholder="Ex.: Conta salário"
              />
            </Field>
            <Field
              label="Instituição (opcional)"
              htmlFor="institution"
              error={fieldErrors.institution}
            >
              <Input
                id="institution"
                name="institution"
                maxLength={60}
                defaultValue={account?.institution}
                placeholder="Ex.: Banco X"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Saldo inicial (R$)"
              htmlFor="initialBalance"
              error={fieldErrors.initialBalance}
              hint={
                type === 'CREDIT_CARD'
                  ? 'Use valor negativo para fatura já em aberto'
                  : undefined
              }
            >
              <Input
                id="initialBalance"
                name="initialBalance"
                inputMode="decimal"
                defaultValue={amountToInput(account?.initialBalance)}
                placeholder="0,00"
              />
            </Field>
            {type === 'CREDIT_CARD' && (
              <Field
                label="Limite (R$)"
                htmlFor="creditLimit"
                error={fieldErrors.creditLimit}
              >
                <Input
                  id="creditLimit"
                  name="creditLimit"
                  inputMode="decimal"
                  defaultValue={amountToInput(account?.creditLimit)}
                  placeholder="0,00"
                />
              </Field>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Cor</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <FormError message={error} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AccountsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [dialog, setDialog] = useState<{ open: boolean; account?: Account }>({
    open: false,
  })
  const [message, setMessage] = useState<string | null>(null)
  const { data, error, isLoading, reload } = useAsync(
    () => accountApi.list(showArchived),
    [showArchived],
  )

  const active = (data ?? []).filter((a) => !a.archived)
  const total = active
    .filter((a) => a.type !== 'CREDIT_CARD')
    .reduce((s, a) => s + a.currentBalance, 0)
  const invoices = active
    .filter((a) => a.type === 'CREDIT_CARD')
    .reduce((s, a) => s + Math.max(0, -a.currentBalance), 0)

  async function toggleArchive(account: Account) {
    setMessage(null)
    try {
      await accountApi.update(
        account.id,
        toRequest(account, { archived: !account.archived }),
      )
      void reload()
    } catch (err) {
      setMessage(apiErrorMessage(err))
    }
  }

  async function remove(account: Account) {
    if (!window.confirm(`Excluir a conta "${account.name}"?`)) return
    setMessage(null)
    try {
      await accountApi.remove(account.id)
      void reload()
    } catch (err) {
      if (apiErrorStatus(err) === 409) {
        if (
          window.confirm(
            `${apiErrorMessage(err)}\n\nDeseja arquivar a conta "${account.name}"?`,
          )
        ) {
          await toggleArchive({ ...account, archived: false })
        }
      } else {
        setMessage(apiErrorMessage(err))
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Contas e cartões"
        description="Gerencie suas contas bancárias, carteiras e cartões de crédito."
        actions={
          <>
            <div className="flex items-center gap-2 text-sm">
              <Switch
                id="archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="archived" className="font-normal">
                Mostrar arquivadas
              </Label>
            </div>
            <Button onClick={() => setDialog({ open: true })}>
              <Plus /> Nova conta
            </Button>
          </>
        }
      />
      {message && <FormError message={message} />}
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : isLoading && !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : data?.length === 0 ? (
        <EmptyState
          title="Nenhuma conta cadastrada"
          description="Cadastre uma conta para começar a registrar movimentações."
          action={
            <Button onClick={() => setDialog({ open: true })}>
              Cadastrar conta
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="gap-1 px-6 py-5">
              <p className="text-sm text-muted-foreground">Saldo em contas</p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatCurrency(total)}
              </p>
            </Card>
            <Card className="gap-1 px-6 py-5">
              <p className="text-sm text-muted-foreground">Faturas em aberto</p>
              <p className="text-2xl font-semibold text-expense tabular-nums">
                {formatCurrency(invoices)}
              </p>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data?.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={() => setDialog({ open: true, account })}
                onArchive={() => void toggleArchive(account)}
                onRemove={() => void remove(account)}
              />
            ))}
          </div>
        </>
      )}
      <AccountFormDialog
        open={dialog.open}
        account={dialog.account}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onSaved={reload}
      />
    </>
  )
}
