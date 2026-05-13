import { defineStore } from 'pinia'

import { APP_SUBTITLE, APP_TITLE, SOCKET_STATUS_LABELS } from '@/constants/labels'

export type ThemeMode = 'light' | 'dark' | 'system'
export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export interface NavigationItem {
  label: string
  key: string
}

export interface AppNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  description: string
  createdAt: string
}

interface AppState {
  projectName: string
  projectSubtitle: string
  themeMode: ThemeMode
  pageLoading: boolean
  socketStatus: SocketStatus
  navigation: NavigationItem[]
  notifications: AppNotification[]
}

function createNotification(
  payload: Omit<AppNotification, 'id' | 'createdAt'>
): AppNotification {
  return {
    id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...payload
  }
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    projectName: APP_TITLE,
    projectSubtitle: APP_SUBTITLE,
    themeMode: 'light',
    pageLoading: false,
    socketStatus: 'idle',
    navigation: [
      { label: '首页', key: '/' },
      { label: '题库', key: '/soups' },
      { label: '房间大厅', key: '/lobby' },
      { label: '个人中心', key: '/profile' },
      { label: '管理后台', key: '/admin' }
    ],
    notifications: []
  }),

  getters: {
    latestNotification: (state) => state.notifications[0] ?? null,
    socketStatusLabel: (state) => SOCKET_STATUS_LABELS[state.socketStatus]
  },

  actions: {
    setThemeMode(mode: ThemeMode) {
      this.themeMode = mode
    },

    setPageLoading(loading: boolean) {
      this.pageLoading = loading
    },

    setSocketStatus(status: SocketStatus) {
      this.socketStatus = status
    },

    pushNotification(payload: Omit<AppNotification, 'id' | 'createdAt'>) {
      this.notifications.unshift(createNotification(payload))
      this.notifications = this.notifications.slice(0, 8)
    },

    removeNotification(notificationId: string) {
      this.notifications = this.notifications.filter((item) => item.id !== notificationId)
    },

    clearNotifications() {
      this.notifications = []
    }
  }
})
