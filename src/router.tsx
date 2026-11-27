import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setOnSessionExpired } from '#/api/api'
import { authStore } from '#/features/auth/auth-store'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    basepath: import.meta.env.BASE_URL.replace(/\/$/, ''),
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  // Refresh token inválido/expirado: encerra a sessão e volta ao login.
  setOnSessionExpired(() => {
    authStore.clear()
    void router.navigate({ to: '/login' })
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
