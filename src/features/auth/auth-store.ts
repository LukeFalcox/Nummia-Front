import { useSyncExternalStore } from 'react'
import { setUnauthorizedHandler } from '#/lib/api'
import { tokenStorage } from '#/lib/token-storage'
import { authService } from '#/services/auth.service'
import type { LoginPayload, RegisterPayload, User } from '#/types'

const USER_KEY = 'nummia.user'

interface AuthState {
  user: User | null
  token: string | null
}

function readUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

let state: AuthState = { token: tokenStorage.get(), user: readUser() }
const listeners = new Set<() => void>()

function setState(next: AuthState) {
  state = next
  try {
    if (next.user) localStorage.setItem(USER_KEY, JSON.stringify(next.user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    /* armazenamento indisponível */
  }
  listeners.forEach((listener) => listener())
}

export const authStore = {
  getState: () => state,
  isAuthenticated: () => Boolean(state.token),
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  async login(payload: LoginPayload) {
    const { token, user } = await authService.login(payload)
    tokenStorage.set(token)
    setState({ token, user })
  },

  async register(payload: RegisterPayload) {
    const { token, user } = await authService.register(payload)
    tokenStorage.set(token)
    setState({ token, user })
  },

  setUser(user: User) {
    setState({ ...state, user })
  },

  logout() {
    tokenStorage.clear()
    setState({ token: null, user: null })
  },
}

setUnauthorizedHandler(() => authStore.logout())

export function useAuth() {
  const snapshot = useSyncExternalStore(authStore.subscribe, authStore.getState)
  return {
    ...snapshot,
    isAuthenticated: Boolean(snapshot.token),
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    setUser: authStore.setUser,
  }
}
