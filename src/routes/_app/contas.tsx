import { useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  CreditCard,
  Landmark,
  PiggyBank,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '#/components/layout/page-header'
import { ErrorState } from '#/components/layout/states'
import { Button } from '#/components/ui/button'
import {
  Card,
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
  DialogTrigger,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'
import { Progress } from '#/components/ui/progress'
import { Skeleton } from '#/components/ui/skeleton'
import { useAsync } from '#/hooks/use-async'
import { cn, formatCurrency } from '#/lib/utils'
import { accountService } from '#/services/finance.service'
import type { Account, AccountType } from '#/types'

export const Route = createFileRoute('/_app/contas')({
  component: AccountsPage,
})

const accountTypes: Record<AccountType, { label: string; icon: LucideIcon }> = {
  checking: { label: 'Conta corrente', icon: Landmark },
  savings: { label: 'Poupança', icon: PiggyBank },
  credit_card: { label: 'Cartão de crédito', icon: CreditCard },
  investment: { label: 'Investimentos', icon: TrendingUp },
  wallet: { label: 'Carteira', icon: Wallet },
}

function AccountCard({ account }: { account: Account }) {
  const { label, icon: Icon } = accountTypes[account.type]
  const isCard = account.type === 'credit_card'
  const used = isCard ? Math.abs(account.balance) : 0
  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-center gap-3">
        <span
          className="flex size-10 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in oklch, ${account.color} 15%, transparent)`,
            color: account.color,
          }}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <CardTitle className="truncate">{account.name}</CardTitle>
          <CardDescription>
            {account.institution} · {label}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {isCard ? 'Fatura atual' : 'Saldo'}
          </p>
          <p
            className={cn(
              'text-2xl font-semibold tabular-nums',
              account.balance < 0 && !isCard && 'text-expense',
            )}
          >
            {formatCurrency(isCard ? used : account.balance)}
          </p>
        </div>
        {isCard && account.creditLimit && (
          <div className="space-y-1.5">
            <Progress
              value={(used / account.creditLimit) * 100}
              indicatorStyle={{ backgroundColor: account.color }}
            />
            <p className="text-xs text-muted-foreground">
              Disponível: {formatCurrency(account.creditLimit - used)} de{' '}
              {formatCurrency(account.creditLimit)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function NewAccountDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<AccountType>('checking')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const balance = Number(String(form.get('balance') || '0').replace(',', '.'))
    const limit = Number(
      String(form.get('creditLimit') || '0').replace(',', '.'),
    )
    await accountService.create({
      name: String(form.get('name')).trim(),
      institution: String(form.get('institution')).trim(),
      type,
      balance: type === 'credit_card' ? -Math.abs(balance) : balance,
      creditLimit: type === 'credit_card' ? limit : undefined,
      color: 'var(--chart-6)',
    })
    setOpen(false)
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Nova conta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conta ou cartão</DialogTitle>
          <DialogDescription>
            Cadastre onde seu dinheiro está.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo</Label>
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
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex.: Conta salário"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="institution">Instituição</Label>
              <Input
                id="institution"
                name="institution"
                required
                placeholder="Ex.: Banco X"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="balance">
                {type === 'credit_card'
                  ? 'Fatura atual (R$)'
                  : 'Saldo inicial (R$)'}
              </Label>
              <Input
                id="balance"
                name="balance"
                inputMode="decimal"
                placeholder="0,00"
              />
            </div>
            {type === 'credit_card' && (
              <div className="grid gap-2">
                <Label htmlFor="creditLimit">Limite (R$)</Label>
                <Input
                  id="creditLimit"
                  name="creditLimit"
                  inputMode="decimal"
                  required
                  placeholder="0,00"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AccountsPage() {
  const { data, error, isLoading, reload } = useAsync(() =>
    accountService.list(),
  )
  const total = (data ?? [])
    .filter((a) => a.type !== 'credit_card')
    .reduce((s, a) => s + a.balance, 0)
  const invoices = (data ?? [])
    .filter((a) => a.type === 'credit_card')
    .reduce((s, a) => s + Math.abs(a.balance), 0)

  return (
    <>
      <PageHeader
        title="Contas e cartões"
        description="Gerencie suas contas bancárias, carteiras e cartões de crédito."
        actions={<NewAccountDialog onCreated={reload} />}
      />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : isLoading && !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
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
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
