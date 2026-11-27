import type { ReactNode } from 'react'
import { Label } from '#/components/ui/label'
import { cn, colorPalette } from '#/lib/utils'

/** Campo de formulário com rótulo e erro de validação vindo da API (HTTP 400). */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('grid content-start gap-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" id={`${htmlFor}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-md bg-destructive/10 px-3 py-2 text-sm whitespace-pre-line text-destructive"
    >
      {message}
    </p>
  )
}

export function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor">
      {colorPalette.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          onClick={() => onChange(color)}
          className={cn(
            'size-7 rounded-full ring-offset-2 ring-offset-background transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === color && 'ring-2 ring-foreground',
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}
