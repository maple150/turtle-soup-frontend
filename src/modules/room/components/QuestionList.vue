<template>
  <NCard class="h-full rounded-3xl border-0 shadow-soft" :content-style="{ padding: '16px 18px' }">
    <div class="grid h-full min-h-0 gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-lg font-semibold text-slate-900">提问记录</div>
          <div class="text-sm text-slate-500">左侧只保留正式提问和 AI 回答，便于快速回看。</div>
        </div>
        <NTag size="small" type="info">{{ questions.length }} 条</NTag>
      </div>

      <div class="min-h-0 space-y-3 overflow-y-auto pr-1">
        <div
          v-for="question in questions"
          :key="question.id"
          class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="truncate font-semibold text-slate-900">{{ question.senderName }}</span>
                <NTag size="tiny" :type="question.status === 'pending' ? 'warning' : 'success'">
                  {{ QUESTION_STATUS_LABELS[question.status] }}
                </NTag>
              </div>
              <div class="mt-2 text-sm leading-6 text-slate-700">{{ question.content }}</div>
            </div>
            <span class="shrink-0 text-[11px] text-slate-400">{{ formatTime(question.createdAt) }}</span>
          </div>

          <div
            v-if="answerByQuestionId[question.id]"
            class="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-slate-900">
                  {{ answerByQuestionId[question.id].responderName }}
                </span>
                <NTag size="tiny" :type="answerTagType(answerByQuestionId[question.id].outcome)">
                  {{ ANSWER_TYPE_LABELS[answerByQuestionId[question.id].outcome] }}
                </NTag>
              </div>
              <span class="text-[11px] text-slate-400">
                {{ formatTime(answerByQuestionId[question.id].createdAt) }}
              </span>
            </div>
            <div class="mt-1.5 text-sm leading-6 text-slate-600">
              {{ answerByQuestionId[question.id].content }}
            </div>
          </div>
        </div>

        <NEmpty
          v-if="questions.length === 0"
          description="暂无正式提问"
          class="rounded-2xl border border-dashed border-slate-200 py-10"
        />
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NEmpty, NTag } from 'naive-ui'

import { ANSWER_TYPE_LABELS, QUESTION_STATUS_LABELS } from '@/constants/labels'
import type { AnswerRecord, FormalQuestion } from '@/stores/game'

const props = defineProps<{
  questions: FormalQuestion[]
  answers: AnswerRecord[]
}>()

const answerByQuestionId = computed(() =>
  props.answers.reduce<Record<string, AnswerRecord>>((acc, answer) => {
    acc[answer.questionId] = answer
    return acc
  }, {})
)

function answerTagType(outcome: AnswerRecord['outcome']) {
  switch (outcome) {
    case 'yes':
      return 'success'
    case 'no':
      return 'error'
    default:
      return 'info'
  }
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
