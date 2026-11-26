import { api } from '#/lib/api'
import { env } from '#/lib/env'
import { delay } from '#/lib/utils'
import { mockUser } from '#/mocks/db'
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '#/types'

const MOCK_TOKEN = 'mock-jwt-token'

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    if (env.useMocks) {
      await delay(500)
      if (payload.password.length < 6) {
        throw new Error('E-mail ou senha inválidos.')
      }
      return { token: MOCK_TOKEN, user: { ...mockUser, email: payload.email } }
    }
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    return data
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    if (env.useMocks) {
      await delay(600)
      return {
        token: MOCK_TOKEN,
        user: { ...mockUser, name: payload.name, email: payload.email },
      }
    }
    const { data } = await api.post<AuthResponse>('/auth/register', payload)
    return data
  },

  async me(): Promise<User> {
    if (env.useMocks) {
      await delay(150)
      return mockUser
    }
    const { data } = await api.get<User>('/users/me')
    return data
  },

  async updateProfile(payload: Pick<User, 'name' | 'email'>): Promise<User> {
    if (env.useMocks) {
      await delay(400)
      Object.assign(mockUser, payload)
      return { ...mockUser }
    }
    const { data } = await api.put<User>('/users/me', payload)
    return data
  },
}
