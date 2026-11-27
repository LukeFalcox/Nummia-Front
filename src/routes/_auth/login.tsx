import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { apiErrorMessage, apiFieldErrors } from '#/api/api'
import { Field, FormError } from '#/components/form'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { authStore } from '#/features/auth/auth-store'
import { env } from '#/lib/env'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    setError(null)
    setFieldErrors({})
    try {
      await authStore.login({
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
      })
      await navigate({ to: '/dashboard' })
    } catch (err) {
      const fields = apiFieldErrors(err)
      setFieldErrors(fields)
      if (Object.keys(fields).length === 0) setError(apiErrorMessage(err))
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
      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        <Field label="E-mail" htmlFor="email" error={fieldErrors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@exemplo.com"
            aria-invalid={!!fieldErrors.email}
          />
        </Field>
        <Field label="Senha" htmlFor="password" error={fieldErrors.password}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={!!fieldErrors.password}
          />
        </Field>
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      {env.useMocks && (
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          Modo demonstração (sem back-end): use qualquer e-mail e uma senha com
          8 ou mais caracteres.
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
