import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { apiErrorMessage, apiFieldErrors } from '#/api/api'
import { Field, FormError } from '#/components/form'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { authStore } from '#/features/auth/auth-store'

export const Route = createFileRoute('/_auth/cadastro')({
  component: RegisterPage,
})

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/

function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    const errors: Record<string, string> = {}
    if (!PASSWORD_RULE.test(password))
      errors.password = 'Use de 8 a 72 caracteres, com letras e números.'
    if (password !== String(form.get('confirm')))
      errors.confirm = 'As senhas não coincidem.'
    setFieldErrors(errors)
    setError(null)
    if (Object.keys(errors).length > 0) return
    if (!form.get('terms')) {
      setError('É preciso aceitar os termos e a política de privacidade.')
      return
    }
    setSubmitting(true)
    try {
      await authStore.register({
        name: String(form.get('name')).trim(),
        email: String(form.get('email')).trim(),
        password,
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
          Crie sua conta
        </h1>
        <p className="text-sm text-muted-foreground">
          Comece a organizar suas finanças em poucos minutos.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        <Field label="Nome" htmlFor="name" error={fieldErrors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={!!fieldErrors.name}
          />
        </Field>
        <Field label="E-mail" htmlFor="email" error={fieldErrors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={!!fieldErrors.email}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Senha"
            htmlFor="password"
            error={fieldErrors.password}
            hint="8+ caracteres, letras e números"
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              maxLength={72}
              aria-invalid={!!fieldErrors.password}
            />
          </Field>
          <Field
            label="Confirmar senha"
            htmlFor="confirm"
            error={fieldErrors.confirm}
          >
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              maxLength={72}
              aria-invalid={!!fieldErrors.confirm}
            />
          </Field>
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="terms"
            className="mt-0.5 size-4 accent-[var(--primary)]"
          />
          Li e aceito os termos de uso e a política de privacidade (LGPD).
        </label>
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
