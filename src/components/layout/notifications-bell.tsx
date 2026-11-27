import { useCallback, useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CircleCheck,
  Info,
  OctagonAlert,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { notificationApi } from '#/api/api'
import type { Notification, Severity } from '#/api/types'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn, formatRelativeTime } from '#/lib/utils'

const POLL_MS = 90_000

export const severityStyle: Record<
  Severity,
  { icon: LucideIcon; className: string }
> = {
  INFO: { icon: Info, className: 'bg-chart-2/12 text-chart-2' },
  SUCCESS: { icon: CircleCheck, className: 'bg-income/12 text-income' },
  WARNING: { icon: AlertTriangle, className: 'bg-chart-3/15 text-chart-3' },
  CRITICAL: { icon: OctagonAlert, className: 'bg-expense/12 text-expense' },
}

/** Sino com contador. Não há push em tempo real: atualiza ao trocar de tela e a cada 90 s. */
export function NotificationsBell() {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<Array<Notification> | null>(null)
  const location = useLocation()

  const refreshCount = useCallback(() => {
    notificationApi.unreadCount().then(setCount, () => undefined)
  }, [])

  useEffect(refreshCount, [location.pathname, refreshCount])
  useEffect(() => {
    const id = setInterval(refreshCount, POLL_MS)
    return () => clearInterval(id)
  }, [refreshCount])

  async function load() {
    try {
      const page = await notificationApi.list(false, 0, 20)
      setItems(page.content)
    } catch {
      setItems([])
    }
  }

  async function markRead(n: Notification) {
    if (n.read) return
    await notificationApi.markRead(n.id)
    setItems(
      (list) =>
        list?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null,
    )
    setCount((c) => Math.max(0, c - 1))
  }

  async function markAll() {
    await notificationApi.markAllRead()
    setItems((list) => list?.map((x) => ({ ...x, read: true })) ?? null)
    setCount(0)
  }

  async function remove(n: Notification) {
    await notificationApi.remove(n.id)
    setItems((list) => list?.filter((x) => x.id !== n.id) ?? null)
    if (!n.read) setCount((c) => Math.max(0, c - 1))
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && void load()}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificações (${count} não lidas)`}
        >
          <Bell />
          {count > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-expense px-1 text-[10px] font-semibold text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(24rem,calc(100vw-2rem))] p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notificações</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void markAll()}
            disabled={count === 0}
          >
            <CheckCheck /> Marcar todas
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items === null ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Carregando…
            </p>
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const style = severityStyle[n.severity]
                const Icon = style.icon
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'group relative flex gap-3 px-4 py-3',
                      !n.read && 'bg-accent/50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-md',
                        style.className,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => void markRead(n)}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </button>
                    {!n.read && (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                        aria-label="Não lida"
                      />
                    )}
                    <button
                      type="button"
                      aria-label="Excluir notificação"
                      className="absolute top-2 right-2 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
                      onClick={() => void remove(n)}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
