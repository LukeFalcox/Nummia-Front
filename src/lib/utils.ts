import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

/** A API envia percentuais de 0 a 100 (ex.: 85.5 = 85,5%). */
export function formatPercent(value: number, digits = 0) {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: digits })}%`
}

// ---------- Datas ----------
// A API usa "yyyy-MM-dd" e "yyyy-MM". Nunca use new Date("2026-11-27"): ele é lido
// como UTC e mostra o dia anterior no Brasil. Estas funções trabalham no fuso local.

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toYearMonth(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function parseISODate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d || 1)
}

export function todayISO() {
  return toISODate(new Date())
}

export function shiftYearMonth(month: string, delta: number) {
  const date = parseISODate(month)
  return toYearMonth(new Date(date.getFullYear(), date.getMonth() + delta, 1))
}

export function monthRange(month: string) {
  const start = parseISODate(month)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
  return { from: toISODate(start), to: toISODate(end) }
}

/** "2026-11-27" → "27 de nov." (ou outro formato via options) */
export function formatDate(
  value: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    options ?? { day: '2-digit', month: 'short' },
  ).format(parseISODate(value))
}

/** "2026-11" → "novembro de 2026" ou "nov" */
export function formatMonth(month: string, style: 'long' | 'short' = 'long') {
  const date = parseISODate(month)
  return style === 'long'
    ? new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
      }).format(date)
    : new Intl.DateTimeFormat('pt-BR', { month: 'short' })
        .format(date)
        .replace('.', '')
}

export function formatRelativeTime(isoDateTime: string) {
  const diff = (new Date(isoDateTime).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
  const abs = Math.abs(diff)
  if (abs < 60) return rtf.format(Math.round(diff), 'second')
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  return rtf.format(Math.round(diff / 86400), 'day')
}

// ---------- Outros ----------

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

/** Converte "1.234,56" ou "1234.56" em número. */
export function parseAmount(
  value: FormDataEntryValue | string | null | undefined,
) {
  const raw = String(value ?? '').trim()
  if (!raw) return NaN
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw
  return Number(normalized)
}

/** Para preencher inputs de valor com o formato brasileiro. */
export function amountToInput(value?: number) {
  return value === undefined ? '' : String(value).replace('.', ',')
}

export function generateId() {
  return crypto.randomUUID()
}

/** Paleta sugerida para contas, categorias e metas ("#RRGGBB", formato da API). */
export const colorPalette = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
  '#eab308',
  '#64748b',
]
