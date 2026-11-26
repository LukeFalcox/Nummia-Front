import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authStore } from '#/features/auth/auth-store'
import { getErrorMessage } from '#/lib/api'
import { env } from '#/lib/env'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    setError(null)
    try {
      await authStore.login({
        email: String(form.get('email')),
        password: String(form.get('password')),
      })
      await navigate({ to: '/dashboard' })
    } catch (err) {
      setError(getErrorMessage(err, 'E-mail ou senha inválidos.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bem-vindo de volta
        </h1>
        <p className="text-sm text-muted-foreground">
          Entre com seu e-mail e senha para acessar sua conta.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@exemplo.com"
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <a
              href="#"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Esqueceu a senha?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      {env.useMocks && (
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          Modo demonstração: use qualquer e-mail e uma senha com 6 ou mais
          caracteres.
        </p>
      )}
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link
          to="/cadastro"
          className="font-medium text-primary hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  )
}
