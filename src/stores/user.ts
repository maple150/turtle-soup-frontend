import { defineStore } from 'pinia'

import {
  getCurrentUserProfile,
  type UserProfile,
  updateCurrentUserProfile
} from '@/api/user'
import { unwrapResponse } from '@/api/request'

interface UserState {
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
  lastFetchedAt: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    profile: null,
    loading: false,
    initialized: false,
    lastFetchedAt: null
  }),

  getters: {
    isProfileReady: (state) => Boolean(state.profile),
    displayName: (state) => state.profile?.nickname || state.profile?.username || '游客',
    userRoles: (state) => state.profile?.roles ?? []
  },

  actions: {
    setProfile(profile: UserProfile | null) {
      this.profile = profile
      this.initialized = true
      this.lastFetchedAt = profile ? new Date().toISOString() : null
    },

    async fetchCurrentUser() {
      this.loading = true

      try {
        const profile = unwrapResponse(await getCurrentUserProfile())
        this.setProfile(profile)
      } finally {
        this.loading = false
      }
    },

    async updateProfile(payload: { nickname?: string; email?: string; bio?: string }) {
      this.loading = true

      try {
        const profile = unwrapResponse(await updateCurrentUserProfile(payload))
        this.setProfile(profile)
      } finally {
        this.loading = false
      }
    },

    clearProfile() {
      this.profile = null
      this.loading = false
      this.initialized = false
      this.lastFetchedAt = null
    }
  }
})
