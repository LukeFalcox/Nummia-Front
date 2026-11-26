export const APP_NAME = 'Nummia'

const apiUrl = import.meta.env.VITE_API_URL as string | undefined
const useMocksFlag = import.meta.env.VITE_USE_MOCKS as string | undefined

export const env = {
  apiUrl: apiUrl ?? 'http://localhost:8080/api',
  /** Sem API configurada, usamos dados simulados para permitir desenvolver as telas. */
  useMocks: useMocksFlag ? useMocksFlag === 'true' : !apiUrl,
}
