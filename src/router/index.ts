import { createRouter, createWebHistory } from 'vue-router'

import { APP_TITLE } from '@/constants/labels'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }

  if (to.meta.requiresAdmin) {
    if (!authStore.isAuthenticated) {
      return '/login'
    }

    if (!userStore.profile) {
      try {
        await userStore.fetchCurrentUser()
      } catch {
        return '/login'
      }
    }

    if (!userStore.userRoles.includes('admin')) {
      return '/'
    }
  }

  return true
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : APP_TITLE
  document.title = title
})

export default router
