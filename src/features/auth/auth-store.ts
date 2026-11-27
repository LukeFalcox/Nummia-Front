import { useSyncExternalStore } from 'react'
import { authApi, tokenStorage, userApi } from '#/api/api'
import type { LoginRequest, RegisterRequest, User } from '#/api/types'

const USER_KEY = 'nummia.user'

function readUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

let user: User | null = readUser()
const listeners = new Set<() => void>()

function setUser(next: User | null) {
  user = next
  try {
    if (next) localStorage.setItem(USER_KEY, JSON.stringify(next))
    else localStorage.removeItem(USER_KEY)
  } catch {
    /* armazenamento indisponível */
  }
  listeners.forEach((listener) => listener())
}

export const authStore = {
  getUser: () => user,
  /** Há sessão se existe accessToken; se ele expirar, o api.ts renova com o refreshToken. */
  isAuthenticated: () => Boolean(tokenStorage.access),
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  async login(payload: LoginRequest) {
    const { user: me } = await authApi.login(payload)
    setUser(me)
  },

  async register(payload: RegisterRequest) {
    const { user: me } = await authApi.register(payload)
    setUser(me)
  },

  /** Garante os dados do usuário (ex.: ao abrir o app com uma sessão salva). */
  async ensureUser() {
    if (!user) setUser(await userApi.me())
    return user
  },

  setUser,

  async logout() {
    setUser(null)
    await authApi.logout()
  },

  /** Sessão expirada: limpa os dados locais (os tokens já foram limpos pelo api.ts). */
  clear() {
    tokenStorage.clear()
    setUser(null)
  },
}

export function useAuth() {
  const current = useSyncExternalStore(authStore.subscribe, authStore.getUser)
  return { user: current, setUser: authStore.setUser, logout: authStore.logout }
}
