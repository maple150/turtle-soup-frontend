import { defineStore } from 'pinia'

import { login, logout, refreshToken, register } from '@/api/auth'
import { unwrapResponse } from '@/api/request'
import { disconnectSocket } from '@/services/socket'
import { useAppStore } from '@/stores/app'
import { useChatStore } from '@/stores/chat'
import { useGameStore } from '@/stores/game'
import { useRoomStore } from '@/stores/room'
import { useUserStore } from '@/stores/user'

const AUTH_STORAGE_KEY = 'tavern-auth-session'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface AuthState {
  accessToken: string
  refreshToken: string
  currentUserId: string | null
  currentUserName: string
  isAuthenticated: boolean
  authLoading: boolean
  initialized: boolean
}

function readStoredSession(): Partial<AuthState> | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as Partial<AuthState>
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function persistSession(state: AuthState) {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      currentUserId: state.currentUserId,
      currentUserName: state.currentUserName,
      isAuthenticated: state.isAuthenticated
    })
  )
}

function clearStoredSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: '',
    refreshToken: '',
    currentUserId: null,
    currentUserName: '',
    isAuthenticated: false,
    authLoading: false,
    initialized: false
  }),

  getters: {
    hasSession: (state) => state.isAuthenticated && Boolean(state.accessToken)
  },

  actions: {
    applySession(payload: {
      userId: string
      username: string
      tokens: AuthTokens
    }) {
      this.accessToken = payload.tokens.accessToken
      this.refreshToken = payload.tokens.refreshToken
      this.currentUserId = payload.userId
      this.currentUserName = payload.username
      this.isAuthenticated = true
      this.initialized = true
      persistSession(this.$state)
    },

    clearSession() {
      this.accessToken = ''
      this.refreshToken = ''
      this.currentUserId = null
      this.currentUserName = ''
      this.isAuthenticated = false
      this.initialized = true
      clearStoredSession()
    },

    async restoreSession() {
      this.authLoading = true
      const userStore = useUserStore()

      try {
        const saved = readStoredSession()

        if (!saved?.refreshToken) {
          this.initialized = true
          return
        }

        this.accessToken = saved.accessToken ?? ''
        this.refreshToken = saved.refreshToken
        this.currentUserId = saved.currentUserId ?? null
        this.currentUserName = saved.currentUserName ?? ''
        this.isAuthenticated = Boolean(saved.refreshToken)

        if (!this.accessToken) {
          const refreshed = unwrapResponse(await refreshToken({ refreshToken: this.refreshToken }))
          this.accessToken = refreshed.accessToken
          this.refreshToken = refreshed.refreshToken
        }

        await userStore.fetchCurrentUser()

        if (userStore.profile) {
          this.currentUserId = userStore.profile.id
          this.currentUserName = userStore.profile.nickname || userStore.profile.username
          this.isAuthenticated = true
          persistSession(this.$state)
        }
      } catch {
        this.clearSession()
        userStore.clearProfile()
      } finally {
        this.initialized = true
        this.authLoading = false
      }
    },

    async login(payload: { username: string; password: string }) {
      this.authLoading = true
      const appStore = useAppStore()
      const userStore = useUserStore()

      try {
        const result = unwrapResponse(await login(payload))

        this.applySession({
          userId: result.userId,
          username: payload.username.trim(),
          tokens: {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
          }
        })

        await userStore.fetchCurrentUser()

        if (userStore.profile) {
          this.currentUserName = userStore.profile.nickname || userStore.profile.username
          persistSession(this.$state)
        }

        appStore.pushNotification({
          type: 'success',
          title: '登录成功',
          description: '欢迎来到酒馆。'
        })
      } finally {
        this.authLoading = false
      }
    },

    async register(payload: { username: string; password: string }) {
      this.authLoading = true

      try {
        await register(payload)
      } finally {
        this.authLoading = false
      }
    },

    disconnectRealtime() {
      disconnectSocket()
      useAppStore().setSocketStatus('disconnected')
    },

    async logout() {
      this.authLoading = true

      try {
        if (this.accessToken) {
          await logout({
            refreshToken: this.refreshToken || undefined
          })
        }
      } catch {
        // Ignore logout request failures and clear local state anyway.
      } finally {
        this.disconnectRealtime()
        useRoomStore().resetState()
        useGameStore().resetState()
        useChatStore().resetState()
        useUserStore().clearProfile()
        this.clearSession()
        this.authLoading = false
      }
    }
  }
})
