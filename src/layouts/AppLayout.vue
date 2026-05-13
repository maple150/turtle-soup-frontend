<template>
  <NConfigProvider>
    <NGlobalStyle />
    <NMessageProvider>
      <div class="min-h-screen bg-[linear-gradient(180deg,_#fffaf5_0%,_#f8fafc_48%,_#eef2ff_100%)] text-slate-900">
        <NLayout embedded class="min-h-screen bg-transparent">
          <NLayoutHeader bordered class="bg-white/85 backdrop-blur">
            <div class="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
              <div class="flex items-center gap-3">
                <img :src="tavernLogo" alt="酒馆" class="h-11 w-11 rounded-2xl shadow-soft" />
                <div>
                  <div class="text-lg font-semibold">{{ appStore.projectName }}</div>
                  <div class="text-xs text-slate-500">{{ appStore.projectSubtitle }}</div>
                </div>
              </div>

              <div class="hidden min-w-0 flex-1 lg:flex lg:justify-end">
                <NMenu
                  :value="activeKey"
                  :options="menuOptions"
                  mode="horizontal"
                  responsive
                  @update:value="handleMenuSelect"
                />
              </div>

              <div class="flex items-center gap-3">
                <NButton v-if="!authStore.isAuthenticated" quaternary @click="router.push('/login')">
                  登录
                </NButton>
                <NButton
                  v-if="!authStore.isAuthenticated"
                  type="primary"
                  round
                  @click="router.push('/register')"
                >
                  注册
                </NButton>
                <NButton v-else quaternary @click="router.push('/profile')">
                  {{ authStore.currentUserName || '个人中心' }}
                </NButton>
              </div>
            </div>
          </NLayoutHeader>

          <NLayoutContent content-style="padding: 24px;">
            <div class="mx-auto w-full max-w-6xl">
              <RouterView />
            </div>
          </NLayoutContent>
        </NLayout>
      </div>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NButton,
  NConfigProvider,
  NGlobalStyle,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NMenu,
  NMessageProvider
} from 'naive-ui'
import { RouterView, useRoute, useRouter } from 'vue-router'

import tavernLogo from '@/assets/tavern-logo.svg'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const menuOptions = computed(() =>
  appStore.navigation.map((item) => ({
    label: item.label,
    key: item.key
  }))
)

const activeKey = computed(() => {
  if (typeof route.meta.activeMenu === 'string') {
    return route.meta.activeMenu
  }

  return route.path
})

function handleMenuSelect(key: string) {
  if (key !== route.path) {
    void router.push(key)
  }
}
</script>
