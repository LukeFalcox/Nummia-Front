const TOKEN_KEY = 'nummia.token'

/**
 * Armazenamento do JWT. Centralizado aqui para facilitar a troca
 * (ex.: cookie httpOnly emitido pelo back-end) sem mexer no restante do app.
 */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* armazenamento indisponível */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* armazenamento indisponível */
    }
  },
}
