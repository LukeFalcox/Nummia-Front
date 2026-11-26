import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { Bot, PieChart, ShieldCheck } from 'lucide-react'
import { Logo } from '#/components/brand/logo'
import { authStore } from '#/features/auth/auth-store'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    if (authStore.isAuthenticated()) throw redirect({ to: '/dashboard' })
  },
  component: AuthLayout,
})

const highlights = [
  {
    icon: PieChart,
    title: 'Tudo em um só lugar',
    text: 'Contas, cartões, receitas e despesas organizados por categoria.',
  },
  {
    icon: Bot,
    title: 'Assistente com IA',
    text: 'Pergunte sobre seus gastos e receba recomendações personalizadas.',
  },
  {
    icon: ShieldCheck,
    title: 'Seus dados protegidos',
    text: 'Segurança e privacidade pensadas desde o início, em linha com a LGPD.',
  },
]

function AuthLayout() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col p-6 md:p-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-center">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-sidebar-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-96 rounded-full bg-chart-2/20 blur-3xl" />
        <div className="relative max-w-md space-y-8">
          <h2 className="text-3xl font-semibold tracking-tight">
            Entenda, organize e melhore sua vida financeira.
          </h2>
          <ul className="space-y-6">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-sidebar-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
