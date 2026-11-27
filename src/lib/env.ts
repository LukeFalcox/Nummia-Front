export const APP_NAME = 'Nummia'

const apiUrl = import.meta.env.VITE_API_URL as string | undefined
const useMocksFlag = import.meta.env.VITE_USE_MOCKS as string | undefined

export const env = {
  /** URL do Back-End, sem o sufixo /api (ex.: http://localhost:8080). */
  apiUrl: (apiUrl ?? 'http://localhost:8080').replace(/\/+$/, ''),
  /** Sem API configurada, um back-end simulado em memória responde às requisições. */
  useMocks: useMocksFlag ? useMocksFlag === 'true' : !apiUrl,
}
