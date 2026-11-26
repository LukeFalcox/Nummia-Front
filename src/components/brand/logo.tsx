import { APP_NAME } from '#/lib/env'
import { cn } from '#/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn('size-8', className)}
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M9 23V9l14 14V9"
        fill="none"
        className="stroke-primary-foreground"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight',
        className,
      )}
    >
      <LogoMark />
      {APP_NAME}
    </span>
  )
}
