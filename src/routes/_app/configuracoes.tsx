import { useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Monitor, Moon, Sun } from 'lucide-react'
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
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import { useAuth } from '#/features/auth/auth-store'
import { useTheme } from '#/hooks/use-theme'
import type { Theme } from '#/hooks/use-theme'
import { getErrorMessage } from '#/lib/api'
import { cn, getInitials } from '#/lib/utils'
import { authService } from '#/services/auth.service'

export const Route = createFileRoute('/_app/configuracoes')({
  component: SettingsPage,
})

const themes: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

const notificationOptions = [
  {
    id: 'summary',
    label: 'Resumo semanal',
    description: 'Receba um resumo dos seus gastos toda segunda-feira.',
  },
  {
    id: 'limits',
    label: 'Alertas de limite',
    description: 'Avise quando uma categoria estiver perto do limite.',
  },
  {
    id: 'recurring',
    label: 'Despesas recorrentes',
    description: 'Lembre-me de contas e assinaturas antes do vencimento.',
  },
  {
    id: 'goals',
    label: 'Metas',
    description: 'Avise quando uma meta estiver próxima de ser atingida.',
  },
]

function SettingsPage() {
  const { user, setUser, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [status, setStatus] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    summary: true,
    limits: true,
    recurring: false,
    goals: true,
  })

  async function handleProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const updated = await authService.updateProfile({
        name: String(form.get('name')).trim(),
        email: String(form.get('email')).trim(),
      })
      setUser(updated)
      setStatus('Perfil atualizado com sucesso.')
    } catch (error) {
      setStatus(getErrorMessage(error))
    }
  }

  return (
    <>
      <PageHeader
        title="Configurações e perfil"
        description="Gerencie seus dados, preferências e privacidade."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Suas informações pessoais.</CardDescription>
          </CardHeader>
          <form onSubmit={handleProfile}>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-14">
                  <AvatarFallback className="text-base">
                    {getInitials(user?.name ?? '?')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={user?.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user?.email}
                  required
                />
              </div>
              {status && (
                <p className="text-sm text-muted-foreground" role="status">
                  {status}
                </p>
              )}
            </CardContent>
            <CardFooter className="mt-6">
              <Button type="submit">Salvar alterações</Button>
            </CardFooter>
          </form>
        </Card>

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

          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Escolha o que o Agente de Notificações pode te enviar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <Label htmlFor={`n-${option.id}`}>{option.label}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <Switch
                    id={`n-${option.id}`}
                    checked={notifications[option.id]}
                    onCheckedChange={(checked) =>
                      setNotifications((n) => ({ ...n, [option.id]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Privacidade e dados (LGPD)</CardTitle>
          <CardDescription>
            Você pode solicitar a exportação ou a exclusão dos seus dados a
            qualquer momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled
            title="Disponível quando o back-end estiver integrado"
          >
            Exportar meus dados
          </Button>
          <Button
            variant="outline"
            disabled
            title="Disponível quando o back-end estiver integrado"
          >
            Excluir minha conta
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              logout()
              void navigate({ to: '/login' })
            }}
          >
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
