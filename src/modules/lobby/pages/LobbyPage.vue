<template>
  <section class="grid gap-6">
    <NCard class="rounded-3xl border-0 shadow-soft">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-3">
          <NTag round type="info">房间大厅</NTag>
          <div>
            <h1 class="text-3xl font-semibold text-slate-900">多人房间列表</h1>
            <NText depth="3" class="mt-2 block">
              浏览当前公开房间，查看状态后直接加入；也可以自己创建一桌。
            </NText>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <NButton type="primary" round @click="router.push('/lobby/create')">创建房间</NButton>
          <NButton round :loading="roomStore.loading" @click="fetchRooms">刷新列表</NButton>
        </div>
      </div>
    </NCard>

    <div class="grid gap-6 lg:grid-cols-[280px_1fr]">
      <NCard class="rounded-3xl border-0 shadow-soft">
        <template #header>筛选条件</template>
        <NSpace vertical :size="16">
          <NInput
            v-model:value="filters.keyword"
            placeholder="搜索房间名或房间号"
          />
          <NSelect v-model:value="filters.mode" :options="modeOptions" placeholder="选择模式" />
          <NSelect v-model:value="filters.status" :options="statusOptions" placeholder="选择状态" />
          <NButton block @click="applyFilters">应用筛选</NButton>
        </NSpace>
      </NCard>

      <div class="grid gap-4">
        <NCard
          v-for="room in roomStore.filteredRooms"
          :key="room.roomCode"
          class="rounded-3xl border-0 shadow-soft"
          hoverable
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <div class="text-lg font-semibold text-slate-900">{{ room.name }}</div>
                <NTag :type="statusTagType(room.status)" size="small">
                  {{ ROOM_STATUS_LABELS[room.status] }}
                </NTag>
              </div>
              <NText depth="3">{{ room.description }}</NText>
              <div class="flex flex-wrap gap-4 text-sm text-slate-500">
                <span>房间号 {{ room.roomCode }}</span>
                <span>{{ room.capacity }} 人上限</span>
                <span>{{ ROOM_MODE_LABELS[room.mode] }}</span>
                <span>房主：{{ room.hostNickname }}</span>
              </div>
            </div>

            <NButton type="primary" @click="router.push(`/room/${room.roomCode}`)">进入房间</NButton>
          </div>
        </NCard>

        <NEmpty
          v-if="!roomStore.loading && roomStore.filteredRooms.length === 0"
          description="暂无房间"
          class="rounded-3xl border border-dashed border-slate-200 bg-white py-16"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { NButton, NCard, NEmpty, NInput, NSelect, NSpace, NTag, NText } from 'naive-ui'
import { useRouter } from 'vue-router'

import { ROOM_MODE_LABELS, ROOM_STATUS_LABELS } from '@/constants/labels'
import { useRoomStore } from '@/stores/room'

const router = useRouter()
const roomStore = useRoomStore()

const filters = reactive({
  keyword: roomStore.lobbyFilters.keyword,
  mode: roomStore.lobbyFilters.mode,
  status: roomStore.lobbyFilters.status
})

const modeOptions = [
  { label: '全部模式', value: 'all' },
  { label: '休闲', value: 'casual' },
  { label: '竞技', value: 'ranked' },
  { label: '私密', value: 'private' }
]

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '等待中', value: 'waiting' },
  { label: '游戏中', value: 'playing' },
  { label: '已公布答案', value: 'revealed' },
  { label: '已结束', value: 'finished' }
]

function statusTagType(status: 'waiting' | 'playing' | 'revealed' | 'finished') {
  switch (status) {
    case 'playing':
      return 'success'
    case 'revealed':
      return 'info'
    case 'finished':
      return 'default'
    default:
      return 'warning'
  }
}

async function fetchRooms() {
  await roomStore.fetchRooms()
}

async function applyFilters() {
  roomStore.setLobbyFilters({
    keyword: filters.keyword,
    mode: filters.mode,
    status: filters.status
  })
  await fetchRooms()
}

onMounted(async () => {
  await fetchRooms()
})
</script>
