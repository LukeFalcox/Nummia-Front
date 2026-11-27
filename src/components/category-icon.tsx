import {
  Baby,
  Banknote,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  CircleDollarSign,
  CircleEllipsis,
  CirclePlus,
  Coffee,
  CreditCard,
  Dog,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  Lightbulb,
  Music,
  PartyPopper,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Repeat,
  Shield,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '#/lib/utils'

/**
 * Ícones do Lucide por nome (formato enviado pela API, ex.: "utensils").
 * Lista curada para manter o bundle pequeno — adicione aqui novos ícones usados pelo Back-End.
 */
export const iconMap: Record<string, LucideIcon> = {
  baby: Baby,
  banknote: Banknote,
  'book-open': BookOpen,
  briefcase: Briefcase,
  bus: Bus,
  car: Car,
  'circle-dollar-sign': CircleDollarSign,
  'circle-ellipsis': CircleEllipsis,
  'circle-plus': CirclePlus,
  coffee: Coffee,
  'credit-card': CreditCard,
  dog: Dog,
  dumbbell: Dumbbell,
  fuel: Fuel,
  'gamepad-2': Gamepad2,
  gift: Gift,
  'graduation-cap': GraduationCap,
  'hand-coins': HandCoins,
  'heart-pulse': HeartPulse,
  home: House,
  house: House,
  landmark: Landmark,
  laptop: Laptop,
  lightbulb: Lightbulb,
  music: Music,
  'party-popper': PartyPopper,
  'piggy-bank': PiggyBank,
  pill: Pill,
  plane: Plane,
  receipt: Receipt,
  repeat: Repeat,
  shield: Shield,
  shirt: Shirt,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  smartphone: Smartphone,
  sparkles: Sparkles,
  target: Target,
  'trending-up': TrendingUp,
  utensils: Utensils,
  wallet: Wallet,
  wifi: Wifi,
  wrench: Wrench,
}

export function getIcon(
  name?: string,
  fallback: LucideIcon = CircleDollarSign,
) {
  return (name && iconMap[name]) || fallback
}

export function CategoryIcon({
  icon,
  color,
  className,
  fallback,
}: {
  icon?: string
  color?: string
  className?: string
  fallback?: LucideIcon
}) {
  const Icon = getIcon(icon, fallback)
  const tint = color ?? 'var(--primary)'
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg',
        className,
      )}
      style={{
        backgroundColor: `color-mix(in oklch, ${tint} 15%, transparent)`,
        color: tint,
      }}
    >
      <Icon className="size-4.5" />
    </span>
  )
}
