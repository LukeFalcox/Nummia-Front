import {
  Briefcase,
  Car,
  CircleDollarSign,
  HeartPulse,
  Home,
  Laptop,
  PartyPopper,
  Repeat,
  Utensils,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '#/lib/utils'

const icons: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  car: Car,
  'heart-pulse': HeartPulse,
  home: Home,
  laptop: Laptop,
  'party-popper': PartyPopper,
  repeat: Repeat,
  utensils: Utensils,
}

export function CategoryIcon({
  icon,
  color,
  className,
}: {
  icon?: string
  color?: string
  className?: string
}) {
  const Icon = (icon && icons[icon]) || CircleDollarSign
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg',
        className,
      )}
      style={{
        backgroundColor: `color-mix(in oklch, ${color ?? 'var(--primary)'} 15%, transparent)`,
        color,
      }}
    >
      <Icon className="size-4.5" />
    </span>
  )
}
