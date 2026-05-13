<template>
  <NCard class="rounded-3xl border-0 shadow-soft">
    <template #header>
      <div class="space-y-1">
        <div class="text-lg font-semibold text-slate-900">房间信息</div>
        <div class="text-sm text-slate-500">左侧展示房间号、状态和成员列表。</div>
      </div>
    </template>

    <div class="grid gap-5">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-400">房间号</div>
          <div class="mt-2 text-lg font-semibold text-slate-900">{{ roomCode }}</div>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-400">当前状态</div>
          <div class="mt-2 flex items-center gap-2">
            <NTag size="small" :type="statusTagType">{{ statusLabel }}</NTag>
            <span class="text-sm text-slate-500">{{ onlineCount }}/{{ members.length }} 在线</span>
          </div>
        </div>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-white/80 p-4">
        <div class="flex items-center justify-between gap-3">
          <div class="text-sm font-semibold text-slate-900">成员列表</div>
          <div class="text-xs text-slate-500">{{ onlineCount }} 人在线</div>
        </div>

        <NSpace vertical :size="12" class="mt-4">
          <div
            v-for="member in members"
            :key="member.userId"
            class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <div class="truncate font-semibold text-slate-900">{{ member.nickname }}</div>
                  <NTag size="tiny" :type="member.role === 'host' ? 'error' : 'default'">
                    {{ ROOM_ROLE_LABELS[member.role] }}
                  </NTag>
                </div>
                <div class="mt-1 text-sm text-slate-500">
                  {{ member.online ? '在线' : '离线' }}
                </div>
              </div>

              <div class="text-xs text-slate-400">
                {{ formatTime(member.lastSeenAt) }}
              </div>
            </div>
          </div>
        </NSpace>
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NSpace, NTag } from 'naive-ui'

import { ROOM_ROLE_LABELS, ROOM_STATUS_LABELS } from '@/constants/labels'
import type { RoomMember, RoomStatus } from '@/api/room'

const props = defineProps<{
  roomCode: string
  status: RoomStatus
  members: RoomMember[]
}>()

const onlineCount = computed(() => props.members.filter((member) => member.online).length)
const statusLabel = computed(() => ROOM_STATUS_LABELS[props.status])

const statusTagType = computed(() => {
  switch (props.status) {
    case 'playing':
      return 'success'
    case 'revealed':
      return 'info'
    case 'finished':
      return 'default'
    default:
      return 'warning'
  }
})

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
