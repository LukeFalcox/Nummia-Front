import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'
const THEME_KEY = 'nummia.theme'

function readTheme(): Theme {
  try {
    return (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'system'
  } catch {
    return 'system'
  }
}

const media = window.matchMedia('(prefers-color-scheme: dark)')
let current: Theme = readTheme()
const listeners = new Set<() => void>()

function apply() {
  const dark = current === 'dark' || (current === 'system' && media.matches)
  document.documentElement.classList.toggle('dark', dark)
}

function setTheme(theme: Theme) {
  current = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* armazenamento indisponível */
  }
  apply()
  listeners.forEach((l) => l())
}

media.addEventListener('change', () => {
  apply()
  listeners.forEach((l) => l())
})
apply()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current)
  const isDark = theme === 'dark' || (theme === 'system' && media.matches)
  return { theme, isDark, setTheme }
}
