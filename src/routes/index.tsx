import { createFileRoute, redirect } from '@tanstack/react-router'
import { authStore } from '#/features/auth/auth-store'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: authStore.isAuthenticated() ? '/dashboard' : '/login',
    })
  },
})
