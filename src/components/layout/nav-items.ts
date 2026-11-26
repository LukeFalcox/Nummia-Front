import {
  ArrowLeftRight,
  Bot,
  LayoutDashboard,
  PieChart,
  Settings,
  Target,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to:
    | '/dashboard'
    | '/movimentacoes'
    | '/contas'
    | '/categorias'
    | '/metas'
    | '/assistente'
    | '/configuracoes'
  label: string
  icon: LucideIcon
}

export const mainNav: Array<NavItem> = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
  { to: '/contas', label: 'Contas e cartões', icon: Wallet },
  { to: '/categorias', label: 'Categorias e limites', icon: PieChart },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/assistente', label: 'Assistente IA', icon: Bot },
]

export const secondaryNav: Array<NavItem> = [
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]
