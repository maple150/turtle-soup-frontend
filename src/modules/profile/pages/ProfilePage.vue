<template>
  <section class="grid gap-6 lg:grid-cols-[320px_1fr]">
    <NCard class="rounded-3xl border-0 shadow-soft">
      <div class="space-y-5 text-center">
        <img :src="tavernLogo" alt="酒馆" class="mx-auto h-20 w-20 rounded-3xl shadow-soft" />
        <div>
          <div class="text-2xl font-semibold text-slate-900">{{ userStore.displayName }}</div>
          <NText depth="3" class="mt-2 block">个人资料概览</NText>
        </div>
        <div class="grid gap-3">
          <div
            v-for="item in stats"
            :key="item.label"
            class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
          >
            <div class="text-sm text-slate-500">{{ item.label }}</div>
            <div class="mt-2 text-xl font-semibold text-slate-900">{{ item.value }}</div>
          </div>
        </div>
      </div>
    </NCard>

    <div class="grid gap-6">
      <NCard class="rounded-3xl border-0 shadow-soft">
        <template #header>
          <div class="text-lg font-semibold text-slate-900">基础信息</div>
        </template>

        <div v-if="userStore.profile" class="grid gap-5 md:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div class="text-sm text-slate-500">用户名</div>
            <div class="mt-2 text-base font-semibold text-slate-900">{{ userStore.profile.username }}</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div class="text-sm text-slate-500">昵称</div>
            <div class="mt-2 text-base font-semibold text-slate-900">{{ userStore.profile.nickname }}</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div class="text-sm text-slate-500">邮箱</div>
            <div class="mt-2 text-base font-semibold text-slate-900">{{ userStore.profile.email }}</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div class="text-sm text-slate-500">角色</div>
            <div class="mt-2 text-base font-semibold text-slate-900">
              {{ userStore.profile.roles.join('、') || '玩家' }}
            </div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:col-span-2">
            <div class="text-sm text-slate-500">个人简介</div>
            <div class="mt-2 text-base leading-7 text-slate-900">
              {{ userStore.profile.bio || '这个人很低调，还没有留下简介。' }}
            </div>
          </div>
        </div>

        <NEmpty v-else description="还没有读取到个人资料" />
      </NCard>

      <NCard class="rounded-3xl border-0 shadow-soft">
        <template #header>
          <div class="text-lg font-semibold text-slate-900">账号说明</div>
        </template>

        <div class="grid gap-4 md:grid-cols-3">
          <div
            v-for="panel in panels"
            :key="panel.label"
            class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
          >
            <div class="text-sm text-slate-500">{{ panel.label }}</div>
            <div class="mt-2 text-base font-semibold text-slate-900">{{ panel.value }}</div>
          </div>
        </div>
      </NCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { NCard, NEmpty, NText } from 'naive-ui'

import tavernLogo from '@/assets/tavern-logo.svg'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const stats = computed(() => [
  { label: '当前状态', value: userStore.profile ? '已登录' : '未登录' },
  { label: '资料更新时间', value: userStore.lastFetchedAt ? '已同步' : '待同步' },
  { label: '身份', value: userStore.userRoles.join('、') || '玩家' }
])

const panels = [
  { label: '房间加入', value: '进入大厅后可直接加入公开房间' },
  { label: '实时同步', value: '进入房间后聊天与提问会实时更新' },
  { label: '后续扩展', value: '战绩、收藏和历史记录可继续接入' }
]

onMounted(async () => {
  if (!userStore.profile) {
    await userStore.fetchCurrentUser()
  }
})
</script>
