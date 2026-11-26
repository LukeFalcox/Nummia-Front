import { useCallback, useEffect, useRef, useState } from 'react'

interface AsyncState<T> {
  data: T | undefined
  error: unknown
  isLoading: boolean
}

/**
 * Hook simples para carregar dados de um serviço.
 * Pode ser substituído por TanStack Query quando o volume de dados crescer.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: undefined,
    error: undefined,
    isLoading: true,
  })
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: undefined }))
    try {
      const data = await fnRef.current()
      setState({ data, error: undefined, isLoading: false })
    } catch (error) {
      setState((s) => ({ ...s, error, isLoading: false }))
    }
  }, [])

  useEffect(() => {
    void run()
  }, deps)

  return { ...state, reload: run }
}
