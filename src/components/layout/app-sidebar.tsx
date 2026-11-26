import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { Logo } from '#/components/brand/logo'
import { cn } from '#/lib/utils'
import { mainNav, secondaryNav } from './nav-items'
import type { NavItem } from './nav-items'

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
      activeProps={{
        className:
          'bg-sidebar-accent !text-sidebar-foreground [&>svg]:text-sidebar-primary',
      }}
    >
      <Icon className="size-4.5" />
      {item.label}
    </Link>
  )
}

export function SidebarContent({
  onNavigate,
  className,
}: {
  onNavigate?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground',
        className,
      )}
    >
      <Link to="/dashboard" onClick={onNavigate} className="px-2 pt-1">
        <Logo />
      </Link>

      <nav
        className="flex flex-1 flex-col gap-1"
        aria-label="Navegação principal"
      >
        {mainNav.map((item) => (
          <NavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="rounded-xl bg-sidebar-accent p-4 text-sm">
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <Sparkles className="size-4 text-sidebar-primary" />
          Dica da IA
        </div>
        <p className="text-sidebar-muted">
          Pergunte ao assistente “onde gastei mais este mês?” para receber uma
          análise.
        </p>
      </div>

      <nav className="flex flex-col gap-1" aria-label="Navegação secundária">
        {secondaryNav.map((item) => (
          <NavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  )
}

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 lg:block">
      <SidebarContent />
    </aside>
  )
}
