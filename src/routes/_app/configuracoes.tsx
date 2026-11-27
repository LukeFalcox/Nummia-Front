import { useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Monitor, Moon, Sun } from 'lucide-react'
import { apiErrorMessage, apiFieldErrors, userApi } from '#/api/api'
import { Field, FormError } from '#/components/form'
import { PageHeader } from '#/components/layout/page-header'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
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
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'
import { Switch } from '#/components/ui/switch'
import { authStore, useAuth } from '#/features/auth/auth-store'
import { useTheme } from '#/hooks/use-theme'
import type { Theme } from '#/hooks/use-theme'
import { amountToInput, cn, getInitials, parseAmount } from '#/lib/utils'

export const Route = createFileRoute('/_app/configuracoes')({
  component: SettingsPage,
})

const themes: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/

function ProfileCard() {
  const { user, setUser } = useAuth()
  const [ai, setAi] = useState(user?.aiAssistantEnabled ?? true)
  const [notifications, setNotifications] = useState(
    user?.notificationsEnabled ?? true,
  )
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const income = parseAmount(form.get('monthlyIncome'))
    setStatus(null)
    setError(null)
    setFieldErrors({})
    try {
      // PUT substitui o perfil inteiro: enviamos todos os campos do formulário.
      const updated = await userApi.update({
        name: String(form.get('name')).trim(),
        currency: String(form.get('currency')),
        monthlyIncome: Number.isNaN(income) ? null : income,
        aiAssistantEnabled: ai,
        notificationsEnabled: notifications,
      })
      setUser(updated)
      setStatus('Perfil atualizado com sucesso.')
    } catch (err) {
      const fields = apiFieldErrors(err)
      setFieldErrors(fields)
      if (Object.keys(fields).length === 0) setError(apiErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil e preferências</CardTitle>
        <CardDescription>
          Suas informações pessoais e como a Nummia deve trabalhar para você.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="text-base">
                {getInitials(user?.name ?? '?')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{user?.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <Field label="Nome" htmlFor="name" error={fieldErrors.name}>
            <Input
              id="name"
              name="name"
              defaultValue={user?.name}
              required
              maxLength={100}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Renda mensal (opcional)"
              htmlFor="monthlyIncome"
              error={fieldErrors.monthlyIncome}
              hint="Ajuda o assistente nas recomendações"
            >
              <Input
                id="monthlyIncome"
                name="monthlyIncome"
                inputMode="decimal"
                defaultValue={amountToInput(user?.monthlyIncome)}
                placeholder="0,00"
              />
            </Field>
            <Field
              label="Moeda"
              htmlFor="currency"
              error={fieldErrors.currency}
            >
              <NativeSelect
                id="currency"
                name="currency"
                defaultValue={user?.currency ?? 'BRL'}
              >
                <option value="BRL">Real (BRL)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </NativeSelect>
            </Field>
          </div>
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="ai">Assistente de IA</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Permite que o assistente analise suas finanças e responda
                  perguntas.
                </p>
              </div>
              <Switch id="ai" checked={ai} onCheckedChange={setAi} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="notifications">Notificações</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Alertas de orçamento, metas, despesas recorrentes e resumo
                  mensal.
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>
          <FormError message={error} />
          {status && (
            <p className="text-sm text-income" role="status">
              {status}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit">Salvar alterações</Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function PasswordCard() {
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const newPassword = String(form.get('newPassword'))
    setStatus(null)
    setError(null)
    const errors: Record<string, string> = {}
    if (!PASSWORD_RULE.test(newPassword))
      errors.newPassword = 'Use de 8 a 72 caracteres, com letras e números.'
    if (newPassword !== String(form.get('confirmPassword')))
      errors.confirmPassword = 'As senhas não coincidem.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    try {
      await userApi.changePassword({
        currentPassword: String(form.get('currentPassword')),
        newPassword,
      })
      formEl.reset()
      setStatus('Senha alterada. As outras sessões foram encerradas.')
    } catch (err) {
      const fields = apiFieldErrors(err)
      setFieldErrors(fields)
      if (Object.keys(fields).length === 0) setError(apiErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trocar senha</CardTitle>
        <CardDescription>
          Ao trocar, as sessões em outros dispositivos são encerradas.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="grid gap-4">
          <Field
            label="Senha atual"
            htmlFor="currentPassword"
            error={fieldErrors.currentPassword}
          >
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nova senha"
              htmlFor="newPassword"
              error={fieldErrors.newPassword}
            >
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                maxLength={72}
              />
            </Field>
            <Field
              label="Confirmar nova senha"
              htmlFor="confirmPassword"
              error={fieldErrors.confirmPassword}
            >
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                maxLength={72}
              />
            </Field>
          </div>
          <FormError message={error} />
          {status && (
            <p className="text-sm text-income" role="status">
              {status}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" variant="outline">
            Alterar senha
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function DeleteAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const password = String(new FormData(event.currentTarget).get('password'))
    setError(null)
    try {
      await userApi.deleteAccount(password)
      authStore.clear()
      await navigate({ to: '/login' })
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir conta</DialogTitle>
          <DialogDescription>
            Esta ação é permanente: sua conta e todos os seus dados (contas,
            movimentações, metas e conversas) serão apagados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Confirme sua senha" htmlFor="delete-password">
            <Input
              id="delete-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
            />
          </Field>
          <FormError message={error} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive">
              Excluir definitivamente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SettingsPage() {
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  return (
    <>
      <PageHeader
        title="Configurações e perfil"
        description="Gerencie seus dados, preferências e privacidade."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <ProfileCard />
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Escolha o tema da interface.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={theme === value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-accent',
                    theme === value &&
                      'border-primary bg-accent text-accent-foreground',
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              ))}
            </CardContent>
          </Card>
          <PasswordCard />
        </div>
      </div>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Privacidade e dados (LGPD)</CardTitle>
          <CardDescription>
            Você pode excluir sua conta e todos os seus dados a qualquer
            momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              void logout().finally(() => navigate({ to: '/login' }))
            }}
          >
            Sair da conta
          </Button>
          <Button variant="destructive" onClick={() => setDeleting(true)}>
            Excluir minha conta
          </Button>
        </CardContent>
      </Card>
      <DeleteAccountDialog open={deleting} onOpenChange={setDeleting} />
    </>
  )
}
