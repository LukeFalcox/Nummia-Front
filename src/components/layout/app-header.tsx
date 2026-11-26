import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { LogOut, Menu, Moon, Settings, Sun } from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { useAuth } from '#/features/auth/auth-store'
import { useTheme } from '#/hooks/use-theme'
import { env } from '#/lib/env'
import { getInitials } from '#/lib/utils'
import { SidebarContent } from './app-sidebar'

function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-72 data-[state=open]:animate-in data-[state=open]:slide-in-from-left">
          <DialogPrimitive.Title className="sr-only">
            Menu
          </DialogPrimitive.Title>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function AppHeader() {
  const { user, logout } = useAuth()
  const { isDark, setTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <MobileNav />
      <div className="flex-1" />
      {env.useMocks && (
        <Badge
          variant="outline"
          className="hidden sm:inline-flex"
          title="Sem back-end configurado: usando dados simulados"
        >
          Modo demonstração
        </Badge>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
      >
        {isDark ? <Sun /> : <Moon />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <Avatar className="size-9">
              <AvatarFallback>{getInitials(user?.name ?? '?')}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="truncate">{user?.name}</div>
            <div className="truncate text-xs font-normal text-muted-foreground">
              {user?.email}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/configuracoes">
              <Settings /> Configurações
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              logout()
              void navigate({ to: '/login' })
            }}
          >
            <LogOut /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
