<template>
  <NCard class="rounded-3xl border-0 shadow-soft" :content-style="{ padding: '16px 18px' }">
    <div class="grid gap-4">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <NTag round type="info" size="small">房间 {{ roomCode }}</NTag>
            <NTag :type="statusTagType" size="small">{{ statusLabel }}</NTag>
            <NTag size="small" type="warning">{{ modeLabel }}</NTag>
          </div>
          <div class="space-y-1">
            <h1 class="text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">{{ title }}</h1>
            <NText depth="3" class="block max-w-4xl text-sm leading-6 lg:text-base">
              {{ description }}
            </NText>
          </div>
        </div>

        <div class="grid shrink-0 gap-2 sm:grid-cols-3 lg:w-[320px]">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div class="text-[11px] uppercase tracking-[0.18em] text-slate-400">房主</div>
            <div class="mt-1 text-sm font-semibold text-slate-900">{{ hostNickname }}</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div class="text-[11px] uppercase tracking-[0.18em] text-slate-400">人数</div>
            <div class="mt-1 text-sm font-semibold text-slate-900">{{ onlineMemberCount }}/{{ capacity }}</div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div class="text-[11px] uppercase tracking-[0.18em] text-slate-400">状态</div>
            <div class="mt-1 text-sm font-semibold text-slate-900">{{ formattedTimer }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-white/80 p-3">
        <div class="mb-2 flex items-center justify-between gap-3">
          <div class="text-sm font-semibold text-slate-900">当前成员</div>
          <div class="text-xs text-slate-500">{{ members.length }} 人在线</div>
        </div>
        <div class="flex gap-2 overflow-x-auto pb-1">
          <div
            v-for="member in members"
            :key="member.userId"
            class="flex min-w-[140px] items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div class="min-w-0">
              <div class="truncate text-sm font-semibold text-slate-900">{{ member.nickname }}</div>
              <div class="mt-0.5 text-[11px] text-slate-500">
                {{ ROOM_ROLE_LABELS[member.role] }} · {{ member.online ? '在线' : '离线' }}
              </div>
            </div>
            <span
              class="h-2 w-2 rounded-full"
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
