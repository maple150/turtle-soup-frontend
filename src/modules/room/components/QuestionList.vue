<template>
  <NCard
    class="flex h-full overflow-hidden rounded-3xl border-0 shadow-soft"
    :content-style="{ padding: '14px 16px', height: '100%' }"
    :style="cardStyle"
  >
    <div class="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-slate-900">提问记录</div>
          <div class="text-sm text-slate-500">这里只保留正式提问和 AI 回答，方便快速回看。</div>
        </div>
        <NTag size="small" type="info">{{ questions.length }} 条</NTag>
      </div>

      <div class="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <div ref="listRef" class="room-scroll flex-1 space-y-3 overflow-y-scroll pr-1">
          <div
            v-for="question in questions"
            :key="question.id"
            class="overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate font-semibold text-slate-900">{{ question.senderName }}</span>
                  <NTag size="tiny" :type="question.status === 'pending' ? 'warning' : 'success'">
                    {{ QUESTION_STATUS_LABELS[question.status] }}
                  </NTag>
                </div>
                <div class="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {{ question.content }}
                </div>
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
              <div class="mt-1.5 break-words whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {{ answerByQuestionId[question.id].content }}
              </div>
            </div>
          </div>

          <NEmpty
            v-if="questions.length === 0"
            description="暂无正式提问"
            class="flex min-h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-10"
          />
        </div>
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { NCard, NEmpty, NTag } from 'naive-ui'

import { ANSWER_TYPE_LABELS, QUESTION_STATUS_LABELS } from '@/constants/labels'
import type { AnswerRecord, FormalQuestion } from '@/stores/game'

const props = defineProps<{
  questions: FormalQuestion[]
  answers: AnswerRecord[]
  panelHeight?: number | null
}>()

const listRef = ref<HTMLElement | null>(null)
const cardStyle = computed(() => (props.panelHeight ? { height: `${props.panelHeight}px` } : undefined))

const answerByQuestionId = computed(() =>
  props.answers.reduce<Record<string, AnswerRecord>>((acc, answer) => {
    acc[answer.questionId] = answer
    return acc
  }, {})
)

const activityCursor = computed(() =>
  props.questions.map((question) => `${question.id}:${question.answeredAt ?? 'pending'}`).join('|')
)

watch(
  activityCursor,
  async () => {
    await nextTick()

    if (listRef.value) {
      requestAnimationFrame(() => {
        if (listRef.value) {
          listRef.value.scrollTop = listRef.value.scrollHeight
        }
      })
    }
  },
  { immediate: true }
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
