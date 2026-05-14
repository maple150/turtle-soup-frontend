<template>
  <section class="grid gap-6">
    <NCard class="rounded-3xl border-0 shadow-soft" :content-style="{ padding: '20px 24px' }">
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

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <NCard class="rounded-3xl border-0 shadow-soft" :content-style="{ padding: '16px 18px' }">
        <div class="text-sm text-slate-500">用户总数</div>
        <div class="mt-2 text-2xl font-semibold text-slate-900">{{ overview?.totals.users ?? '--' }}</div>
      </NCard>
      <NCard class="rounded-3xl border-0 shadow-soft" :content-style="{ padding: '16px 18px' }">
        <div class="text-sm text-slate-500">题目总数</div>
        <div class="mt-2 text-2xl font-semibold text-slate-900">{{ overview?.totals.soups ?? '--' }}</div>
      </NCard>
      <NCard class="rounded-3xl border-0 shadow-soft" :content-style="{ padding: '16px 18px' }">
        <div class="text-sm text-slate-500">房间总数</div>
        <div class="mt-2 text-2xl font-semibold text-slate-900">{{ overview?.totals.rooms ?? '--' }}</div>
      </NCard>
      <NCard class="rounded-3xl border-0 shadow-soft" :content-style="{ padding: '16px 18px' }">
        <div class="text-sm text-slate-500">AI 模型</div>
        <div class="mt-2 text-lg font-semibold text-slate-900">{{ overview?.aiModel ?? '--' }}</div>
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
          <div class="grid gap-5">
            <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div class="text-base font-semibold text-slate-900">导入题库</div>
                  <div class="text-sm text-slate-500">
                    支持直接粘贴 JSON 数组，字段包含 title、description、content、answer 等。
                  </div>
                </div>
                <div class="flex gap-3">
                  <NButton :loading="importingSoups" @click="handleImportSoups">导入题库</NButton>
                </div>
              </div>
              <NInput
                v-model:value="importDraft"
                class="mt-4"
                type="textarea"
                :autosize="{ minRows: 5, maxRows: 10 }"
                placeholder='[{"title":"示例题目","description":"题面简介","content":"完整内容","answer":"谜底","difficulty":"medium","tags":["示例"],"status":"published","isPublic":true}]'
              />
            </div>

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
              <div class="grid gap-4 lg:grid-cols-[1fr_220px_220px_auto_auto] lg:items-end">
                <NInput v-model:value="room.name" placeholder="房间名称" />
                <NSelect v-model:value="room.status" :options="roomStatusOptions" />
                <NInputNumber v-model:value="room.capacity" :min="2" :max="16" />
                <NButton type="primary" @click="saveRoom(room)">保存房间</NButton>
                <NButton tertiary type="error" @click="handleDeleteRoom(room.roomCode)">删除房间</NButton>
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
            <div class="flex flex-wrap gap-3">
              <NButton type="primary" @click="saveAiConfig">保存 AI 配置</NButton>
              <NButton secondary :loading="testingAi" @click="handleTestAiConfig">测试连通性</NButton>
            </div>
            <NAlert v-if="aiTestResult" :type="aiTestResult.reachable ? 'success' : 'warning'">
              <div class="space-y-1">
                <div>{{ aiTestResult.reachable ? '连通性正常' : '连通性异常' }}</div>
                <div class="text-sm">
                  {{ aiTestResult.reachable ? `响应耗时 ${aiTestResult.latencyMs} ms` : aiTestResult.errorMessage || '未返回有效结果' }}
                </div>
              </div>
            </NAlert>
          </div>
        </NTabPane>
      </NTabs>
    </NCard>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  NAlert,
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

import type { AiConfig, AdminOverview, AdminSoupImportItem } from '@/api/admin'
import {
  deleteAdminRoom,
  getAdminAiConfig,
  getAdminOverview,
  getAdminRooms,
  getAdminSoups,
  getAdminUsers,
  importAdminSoups,
  updateAdminAiConfig,
  updateAdminRoom,
  updateAdminSoup,
  updateAdminUser,
  testAdminAiConfig
} from '@/api/admin'
import { unwrapResponse } from '@/api/request'

const message = useMessage()
const loading = ref(false)
const overview = ref<AdminOverview | null>(null)
const importDraft = ref('')
const importingSoups = ref(false)
const testingAi = ref(false)
const aiTestResult = ref<{
  reachable: boolean
  model: string
  provider: string
  latencyMs: number
  preview: string | null
  statusCode?: number
  errorMessage?: string
} | null>(null)
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

async function handleDeleteRoom(roomCode: string) {
  const confirmed = window.confirm(`确认删除房间 ${roomCode} 吗？此操作不可恢复。`)

  if (!confirmed) {
    return
  }

  try {
    await deleteAdminRoom(roomCode)
    message.success(`已删除房间 ${roomCode}`)
    await reloadAll()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '删除房间失败')
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

async function handleImportSoups() {
  if (!importDraft.value.trim()) {
    message.warning('请先粘贴题库 JSON')
    return
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(importDraft.value)
  } catch {
    message.error('题库 JSON 格式不正确')
    return
  }

  const rawItems = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { items?: unknown }).items)
      ? (parsed as { items: unknown[] }).items
      : null

  if (!rawItems || rawItems.length === 0) {
    message.error('请提供至少一条题库数据')
    return
  }

  const normalized = rawItems.map((item) => {
    const value = item as Partial<AdminSoupImportItem> & { [key: string]: unknown }

    return {
      title: String(value.title ?? '').trim(),
      subtitle: value.subtitle ? String(value.subtitle).trim() : undefined,
      description: String(value.description ?? '').trim(),
      content: String(value.content ?? '').trim(),
      answer: String(value.answer ?? '').trim(),
      difficulty: (['easy', 'medium', 'hard'].includes(String(value.difficulty))
        ? String(value.difficulty)
        : 'medium') as AdminSoupImportItem['difficulty'],
      tags: Array.isArray(value.tags) ? value.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
      status: (['draft', 'published', 'archived'].includes(String(value.status))
        ? String(value.status)
        : 'published') as NonNullable<AdminSoupImportItem['status']>,
      isPublic: typeof value.isPublic === 'boolean' ? value.isPublic : true
    }
  })

  if (normalized.some((item) => !item.title || !item.description || !item.content || !item.answer)) {
    message.error('题库内容不完整，请检查标题、题面、正文和答案')
    return
  }

  importingSoups.value = true

  try {
    const result = await importAdminSoups(normalized)
    message.success(`已导入 ${unwrapResponse(result).importedCount} 道题目`)
    importDraft.value = ''
    await reloadAll()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '导入题库失败')
  } finally {
    importingSoups.value = false
  }
}

async function handleTestAiConfig() {
  testingAi.value = true

  try {
    const result = unwrapResponse(
      await testAdminAiConfig({
        ...aiConfig
      })
    )

    aiTestResult.value = result

    if (result.reachable) {
      message.success(`AI 连通成功，耗时 ${result.latencyMs} ms`)
    } else {
      message.warning(result.errorMessage || 'AI 连通测试失败')
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : 'AI 连通性测试失败')
  } finally {
    testingAi.value = false
  }
}

onMounted(async () => {
  await reloadAll()
})
</script>
