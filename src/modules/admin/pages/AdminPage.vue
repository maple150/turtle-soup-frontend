<template>
  <section class="grid gap-6">
    <NCard class="rounded-3xl border-0 shadow-soft">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-3">
          <NTag round type="error">管理后台</NTag>
          <div>
            <h1 class="text-3xl font-semibold text-slate-900">后台控制台</h1>
            <NText depth="3" class="mt-2 block">
              这里可以管理题库、用户、房间，以及 AI 主持人的提示词与模型配置。
            </NText>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <NButton :loading="loading" @click="reloadAll">刷新数据</NButton>
        </div>
      </div>
    </NCard>

    <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <NCard class="rounded-3xl border-0 shadow-soft">
        <div class="text-sm text-slate-500">用户总数</div>
        <div class="mt-3 text-3xl font-semibold text-slate-900">{{ overview?.totals.users ?? '--' }}</div>
      </NCard>
      <NCard class="rounded-3xl border-0 shadow-soft">
        <div class="text-sm text-slate-500">题目总数</div>
        <div class="mt-3 text-3xl font-semibold text-slate-900">{{ overview?.totals.soups ?? '--' }}</div>
      </NCard>
      <NCard class="rounded-3xl border-0 shadow-soft">
        <div class="text-sm text-slate-500">房间总数</div>
        <div class="mt-3 text-3xl font-semibold text-slate-900">{{ overview?.totals.rooms ?? '--' }}</div>
      </NCard>
      <NCard class="rounded-3xl border-0 shadow-soft">
        <div class="text-sm text-slate-500">AI 模型</div>
        <div class="mt-3 text-xl font-semibold text-slate-900">{{ overview?.aiModel ?? '--' }}</div>
      </NCard>
    </div>

    <NCard class="rounded-3xl border-0 shadow-soft">
      <NTabs type="line" animated>
        <NTabPane name="users" tab="用户管理">
          <div class="grid gap-4">
            <div
              v-for="user in users"
              :key="user.id"
              class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div class="grid gap-4 lg:grid-cols-[1fr_1fr_220px_220px_auto] lg:items-end">
                <NInput v-model:value="user.nickname" placeholder="昵称" />
                <NInput v-model:value="user.email" placeholder="邮箱，可留空" />
                <NSelect v-model:value="user.status" :options="userStatusOptions" />
                <NInput v-model:value="user.rolesText" placeholder="角色，逗号分隔" />
                <NButton type="primary" @click="saveUser(user)">保存用户</NButton>
              </div>
              <div class="mt-3 text-sm text-slate-500">
                {{ user.username }} · {{ user.bio || '暂无简介' }}
              </div>
            </div>
          </div>
        </NTabPane>

        <NTabPane name="soups" tab="题库管理">
          <div class="grid gap-4">
            <div
              v-for="soup in soups"
              :key="soup.id"
              class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div class="grid gap-4">
                <div class="grid gap-4 lg:grid-cols-[1fr_220px_220px_auto] lg:items-end">
                  <NInput v-model:value="soup.title" placeholder="题目标题" />
                  <NSelect v-model:value="soup.difficulty" :options="difficultyOptions" />
                  <NSelect v-model:value="soup.status" :options="soupStatusOptions" />
                  <NButton type="primary" @click="saveSoup(soup)">保存题目</NButton>
                </div>
                <NInput v-model:value="soup.description" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
                <NInput v-model:value="soup.answer" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
              </div>
            </div>
          </div>
        </NTabPane>

        <NTabPane name="rooms" tab="房间管理">
          <div class="grid gap-4">
            <div
              v-for="room in rooms"
              :key="room.roomCode"
              class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div class="grid gap-4 lg:grid-cols-[1fr_220px_220px_auto] lg:items-end">
                <NInput v-model:value="room.name" placeholder="房间名称" />
                <NSelect v-model:value="room.status" :options="roomStatusOptions" />
                <NInputNumber v-model:value="room.capacity" :min="2" :max="16" />
                <NButton type="primary" @click="saveRoom(room)">保存房间</NButton>
              </div>
              <NInput
                v-model:value="room.description"
                class="mt-4"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 4 }"
              />
              <div class="mt-3 text-sm text-slate-500">房间号：{{ room.roomCode }}</div>
            </div>
          </div>
        </NTabPane>

        <NTabPane name="ai" tab="AI 配置">
          <div class="grid gap-5">
            <div class="grid gap-5 lg:grid-cols-2">
              <NCheckbox v-model:checked="aiConfig.enabled">启用 AI 主持人</NCheckbox>
              <NInput v-model:value="aiConfig.model" placeholder="模型名称" />
              <NInput v-model:value="aiConfig.baseUrl" placeholder="模型服务地址" />
              <NInput
                v-model:value="aiConfig.apiKey"
                type="password"
                show-password-on="click"
                placeholder="模型访问密钥"
              />
              <NInputNumber v-model:value="aiConfig.temperature" :min="0" :max="2" :step="0.1" />
              <NInputNumber v-model:value="aiConfig.maxTokens" :min="64" :max="4096" :step="64" />
            </div>
            <NInput
              v-model:value="aiConfig.systemPrompt"
              type="textarea"
              :autosize="{ minRows: 8, maxRows: 14 }"
              placeholder="AI 系统提示词"
            />
            <div>
              <NButton type="primary" @click="saveAiConfig">保存 AI 配置</NButton>
            </div>
          </div>
        </NTabPane>
      </NTabs>
    </NCard>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  NButton,
  NCard,
  NCheckbox,
  NInput,
  NInputNumber,
  NSelect,
  NTabPane,
  NTabs,
  NTag,
  NText,
  useMessage
} from 'naive-ui'

import type { AiConfig, AdminOverview } from '@/api/admin'
import {
  getAdminAiConfig,
  getAdminOverview,
  getAdminRooms,
  getAdminSoups,
  getAdminUsers,
  updateAdminAiConfig,
  updateAdminRoom,
  updateAdminSoup,
  updateAdminUser
} from '@/api/admin'
import { unwrapResponse } from '@/api/request'

const message = useMessage()
const loading = ref(false)
const overview = ref<AdminOverview | null>(null)
const users = ref<Array<{
  id: string
  username: string
  nickname: string
  email: string
  bio: string
  status: 'active' | 'blocked' | 'deleted'
  rolesText: string
}>>([])
const soups = ref<Array<{
  id: string
  title: string
  description: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  status: 'draft' | 'published' | 'archived'
}>>([])
const rooms = ref<Array<{
  roomCode: string
  name: string
  description: string
  status: 'waiting' | 'playing' | 'revealed' | 'finished'
  capacity: number
}>>([])
const aiConfig = reactive<AiConfig>({
  enabled: true,
  provider: 'openai-compatible',
  baseUrl: '',
  apiKey: '',
  model: '',
  systemPrompt: '',
  temperature: 0.3,
  maxTokens: 512
})

const userStatusOptions = [
  { label: '正常', value: 'active' },
  { label: '封禁', value: 'blocked' },
  { label: '删除', value: 'deleted' }
]

const difficultyOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' }
]

const soupStatusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' }
]

const roomStatusOptions = [
  { label: '等待中', value: 'waiting' },
  { label: '游戏中', value: 'playing' },
  { label: '已公布答案', value: 'revealed' },
  { label: '已结束', value: 'finished' }
]

async function reloadAll() {
  loading.value = true

  try {
    const [overviewData, usersData, soupsData, roomsData, aiData] = await Promise.all([
      getAdminOverview(),
      getAdminUsers({ page: 1, pageSize: 20 }),
      getAdminSoups({ page: 1, pageSize: 20 }),
      getAdminRooms({ page: 1, pageSize: 20 }),
      getAdminAiConfig()
    ])

    overview.value = unwrapResponse(overviewData)
    users.value = unwrapResponse(usersData).list.map((item) => ({
      id: item.id,
      username: item.username,
      nickname: item.nickname,
      email: item.email || '',
      bio: item.bio || '',
      status: item.status as 'active' | 'blocked' | 'deleted',
      rolesText: item.roles.join(',')
    }))
    soups.value = unwrapResponse(soupsData).list.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      answer: item.answer,
      difficulty: item.difficulty,
      status: item.status as 'draft' | 'published' | 'archived'
    }))
    rooms.value = unwrapResponse(roomsData).list.map((item) => ({
      roomCode: item.roomCode,
      name: item.name,
      description: item.description,
      status: item.status,
      capacity: item.capacity
    }))

    Object.assign(aiConfig, unwrapResponse(aiData))
  } catch (error) {
    message.error(error instanceof Error ? error.message : '后台数据加载失败')
  } finally {
    loading.value = false
  }
}

async function saveUser(user: (typeof users.value)[number]) {
  try {
    await updateAdminUser(user.id, {
      nickname: user.nickname,
      email: user.email,
      roles: user.rolesText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      status: user.status
    })
    message.success(`已保存用户 ${user.username}`)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存用户失败')
  }
}

async function saveSoup(soup: (typeof soups.value)[number]) {
  try {
    await updateAdminSoup(soup.id, {
      title: soup.title,
      description: soup.description,
      answer: soup.answer,
      difficulty: soup.difficulty,
      status: soup.status
    })
    message.success(`已保存题目 ${soup.title}`)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存题目失败')
  }
}

async function saveRoom(room: (typeof rooms.value)[number]) {
  try {
    await updateAdminRoom(room.roomCode, {
      name: room.name,
      description: room.description,
      status: room.status,
      capacity: room.capacity
    })
    message.success(`已保存房间 ${room.roomCode}`)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存房间失败')
  }
}

async function saveAiConfig() {
  try {
    await updateAdminAiConfig({
      ...aiConfig
    })
    message.success('AI 配置已保存')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存 AI 配置失败')
  }
}

onMounted(async () => {
  await reloadAll()
})
</script>
