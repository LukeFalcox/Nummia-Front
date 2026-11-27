import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  accountApi,
  apiErrorMessage,
  apiFieldErrors,
  categoryApi,
  transactionApi,
} from '#/api/api'
import type {
  Account,
  Category,
  Transaction,
  TransactionType,
} from '#/api/types'
import { Field, FormError } from '#/components/form'
import { Button } from '#/components/ui/button'
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
import { Switch } from '#/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Textarea } from '#/components/ui/textarea'
import { amountToInput, parseAmount, todayISO } from '#/lib/utils'

/**
 * Formulário de criação/edição de movimentação.
 * - Ao trocar o tipo, recarrega as categorias daquele tipo.
 * - Transferência: sem categoria, com conta de destino.
 * - PUT substitui o registro inteiro, então todos os campos são sempre enviados.
 */
export function TransactionFormDialog({
  trigger,
  transaction,
  open: controlledOpen,
  onOpenChange,
  onSaved,
}: {
  trigger?: ReactNode
  transaction?: Transaction
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved?: () => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? 'EXPENSE',
  )
  const [accounts, setAccounts] = useState<Array<Account> | null>(null)
  const [categories, setCategories] = useState<Array<Category> | null>(null)
  const [recurring, setRecurring] = useState(transaction?.recurring ?? false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setType(transaction?.type ?? 'EXPENSE')
    setRecurring(transaction?.recurring ?? false)
    setError(null)
    setFieldErrors({})
    setAccounts(null)
    accountApi
      .list()
      .then(setAccounts, (e: unknown) => setError(apiErrorMessage(e)))
  }, [open, transaction])

  useEffect(() => {
    if (!open || type === 'TRANSFER') return
    setCategories(null)
    categoryApi
      .list(type)
      .then(setCategories, (e: unknown) => setError(apiErrorMessage(e)))
  }, [open, type])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const amount = parseAmount(form.get('amount'))
    if (!(amount > 0)) {
      setFieldErrors({ amount: 'Informe um valor maior que zero.' })
      return
    }
    const body = {
      type,
      amount,
      description: String(form.get('description')).trim(),
      date: String(form.get('date')),
      accountId: String(form.get('accountId')),
      destinationAccountId:
        type === 'TRANSFER'
          ? String(form.get('destinationAccountId'))
          : undefined,
      categoryId:
        type === 'TRANSFER' ? undefined : String(form.get('categoryId')),
      notes: String(form.get('notes') ?? '').trim() || undefined,
      recurring,
    }
    setSubmitting(true)
    setError(null)
    setFieldErrors({})
    try {
      if (transaction) await transactionApi.update(transaction.id, body)
      else await transactionApi.create(body)
      setOpen(false)
      onSaved?.()
    } catch (err) {
      const fields = apiFieldErrors(err)
      setFieldErrors(fields)
      if (Object.keys(fields).length === 0) setError(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Só permite salvar quando as listas carregaram (evita enviar ids vazios).
  const ready =
    accounts !== null &&
    accounts.length > 0 &&
    (type === 'TRANSFER' ? accounts.length > 1 : (categories?.length ?? 0) > 0)

  const accountOptions = (accounts ?? []).map((a) => (
    <option key={a.id} value={a.id}>
      {a.name}
    </option>
  ))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar movimentação' : 'Nova movimentação'}
          </DialogTitle>
          <DialogDescription>
            Registre uma receita, despesa ou transferência entre contas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <Tabs
            value={type}
            onValueChange={(v) => setType(v as TransactionType)}
          >
            <TabsList className="w-full">
              <TabsTrigger value="EXPENSE">Despesa</TabsTrigger>
              <TabsTrigger value="INCOME">Receita</TabsTrigger>
              <TabsTrigger value="TRANSFER">Transferência</TabsTrigger>
            </TabsList>
          </Tabs>
          <Field
            label="Descrição"
            htmlFor="description"
            error={fieldErrors.description}
          >
            <Input
              id="description"
              name="description"
              required
              maxLength={120}
              defaultValue={transaction?.description}
              placeholder="Ex.: Supermercado"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Valor (R$)"
              htmlFor="amount"
              error={fieldErrors.amount}
            >
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                required
                defaultValue={amountToInput(transaction?.amount)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Data" htmlFor="date" error={fieldErrors.date}>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={transaction?.date ?? todayISO()}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={type === 'TRANSFER' ? 'Conta de origem' : 'Conta'}
              htmlFor="accountId"
              error={fieldErrors.accountId}
            >
              <NativeSelect
                id="accountId"
                name="accountId"
                required
                key={`acc-${accounts?.length ?? 0}`}
                defaultValue={transaction?.account.id}
              >
                {accountOptions}
              </NativeSelect>
            </Field>
            {type === 'TRANSFER' ? (
              <Field
                label="Conta de destino"
                htmlFor="destinationAccountId"
                error={fieldErrors.destinationAccountId}
              >
                <NativeSelect
                  id="destinationAccountId"
                  name="destinationAccountId"
                  required
                  key={`dest-${accounts?.length ?? 0}`}
                  defaultValue={
                    transaction?.destinationAccount?.id ?? accounts?.at(1)?.id
                  }
                >
                  {accountOptions}
                </NativeSelect>
              </Field>
            ) : (
              <Field
                label="Categoria"
                htmlFor="categoryId"
                error={fieldErrors.categoryId}
              >
                <NativeSelect
                  id="categoryId"
                  name="categoryId"
                  required
                  key={`cat-${type}-${categories?.length ?? 0}`}
                  defaultValue={
                    transaction?.type === type
                      ? transaction.category?.id
                      : undefined
                  }
                >
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}
          </div>
          <Field
            label="Observações (opcional)"
            htmlFor="notes"
            error={fieldErrors.notes}
          >
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              maxLength={500}
              defaultValue={transaction?.notes}
            />
          </Field>
          <div className="flex items-center gap-3">
            <Switch
              id="recurring"
              checked={recurring}
              onCheckedChange={setRecurring}
            />
            <Label htmlFor="recurring" className="font-normal">
              Movimentação recorrente (repete todo mês)
            </Label>
          </div>
          {accounts?.length === 0 && (
            <FormError message="Cadastre uma conta em “Contas e cartões” antes de registrar movimentações." />
          )}
          {type === 'TRANSFER' && accounts?.length === 1 && (
            <FormError message="Transferências precisam de pelo menos duas contas." />
          )}
          <FormError message={error} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !ready}>
              {submitting ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
