<template>
  <NCard class="rounded-3xl border-0 shadow-soft">
    <div class="grid gap-5">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <NTag round type="info">房间 {{ roomCode }}</NTag>
            <NTag :type="statusTagType" size="small">{{ statusLabel }}</NTag>
            <NTag size="small" type="warning">{{ modeLabel }}</NTag>
          </div>
          <div>
            <h1 class="text-3xl font-semibold tracking-tight text-slate-900">{{ title }}</h1>
            <NText depth="3" class="mt-2 block max-w-3xl leading-7">
              {{ description }}
            </NText>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-400">房主</div>
            <div class="mt-2 text-base font-semibold text-slate-900">{{ hostNickname }}</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-400">人数</div>
            <div class="mt-2 text-base font-semibold text-slate-900">{{ onlineMemberCount }}/{{ capacity }}</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-400">状态</div>
            <div class="mt-2 text-base font-semibold text-slate-900">{{ formattedTimer }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-white/80 p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="text-sm font-semibold text-slate-900">当前成员</div>
          <div class="text-xs text-slate-500">{{ members.length }} 人</div>
        </div>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="member in members"
            :key="member.userId"
            class="flex min-w-[152px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div class="min-w-0">
              <div class="truncate text-sm font-semibold text-slate-900">{{ member.nickname }}</div>
              <div class="mt-1 text-xs text-slate-500">
                {{ ROOM_ROLE_LABELS[member.role] }} · {{ member.online ? '在线' : '离线' }}
              </div>
            </div>
            <span
              class="h-2.5 w-2.5 rounded-full"
              :class="member.online ? 'bg-emerald-500' : 'bg-slate-300'"
            />
          </div>
        </div>
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NTag, NText } from 'naive-ui'

import { ROOM_MODE_LABELS, ROOM_ROLE_LABELS, ROOM_STATUS_LABELS } from '@/constants/labels'
import type { RoomMember, RoomMode, RoomStatus } from '@/api/room'

const props = defineProps<{
  roomCode: string
  title: string
  description: string
  status: RoomStatus
  mode: RoomMode
  hostNickname: string
  capacity: number
  formattedTimer: string
  onlineMemberCount: number
  members: RoomMember[]
}>()

const statusLabel = computed(() => ROOM_STATUS_LABELS[props.status])
const modeLabel = computed(() => ROOM_MODE_LABELS[props.mode])

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
</script>
