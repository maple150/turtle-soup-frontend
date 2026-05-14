<template>
  <NCard class="rounded-3xl border-0 shadow-soft" :content-style="{ padding: '14px 16px' }">
    <div class="grid gap-3">
      <div class="rounded-[22px] bg-slate-900 px-4 py-4 text-white">
        <div class="flex flex-wrap items-center gap-2">
          <NTag round type="warning">{{ soupTitle }}</NTag>
          <NTag round type="success">{{ phaseLabel }}</NTag>
        </div>
        <div class="mt-3 text-xs uppercase tracking-[0.22em] text-slate-300">当前题面</div>
        <div class="mt-1.5 max-h-28 overflow-y-auto text-lg font-semibold leading-7">{{ prompt }}</div>
        <div class="mt-2 text-sm leading-6 text-slate-300">
          {{ hostHint }}
        </div>
      </div>

      <div class="grid gap-2 md:grid-cols-4">
        <div
          v-for="panel in panels"
          :key="panel.label"
          class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5"
        >
          <div class="text-[11px] uppercase tracking-[0.18em] text-slate-400">{{ panel.label }}</div>
          <div class="mt-0.5 text-base font-semibold text-slate-900">{{ panel.value }}</div>
          <div class="mt-0.5 text-[11px] text-slate-500">{{ panel.caption }}</div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm leading-6 text-slate-600">
        房间操作已整合到下方输入区。普通聊天与正式提问会分开发送，正式提问将由 AI 自动回答。
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NTag } from 'naive-ui'

import type { AnswerRecord, FormalQuestion } from '@/stores/game'

const props = defineProps<{
  soupTitle: string
  prompt: string
  hostHint: string
  phaseLabel: string
  currentRound: number
  totalRounds: number
  formattedTimer: string
  questions: FormalQuestion[]
  answers: AnswerRecord[]
}>()

const panels = computed(() => [
  {
    label: '回合',
    value: props.currentRound > 0 ? `第 ${props.currentRound} 回合` : '未开始',
    caption: '当前进度'
  },
  {
    label: '状态',
    value: props.phaseLabel,
    caption: '房间游戏状态'
  },
  {
    label: '问题数',
    value: String(props.questions.length),
    caption: '正式提问'
  },
  {
    label: '回答数',
    value: String(props.answers.length),
    caption: 'AI 回答'
  }
])
</script>
