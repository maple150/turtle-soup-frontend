<template>
  <NCard class="rounded-3xl border-0 shadow-soft">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-lg font-semibold text-slate-900">主持人操作区</div>
          <div class="text-sm text-slate-500">房主可以在这里开始游戏、回答提问、公布答案和结束本局。</div>
        </div>
        <NTag :type="canManageGame ? 'error' : 'default'" size="small">
          {{ canManageGame ? '可操作' : '只读模式' }}
        </NTag>
      </div>
    </template>

    <div class="grid gap-5">
      <NAlert v-if="canManageGame && startGameHint" type="info" :show-icon="false">
        {{ startGameHint }}
      </NAlert>

      <div class="grid gap-4 md:grid-cols-3">
        <NButton type="primary" :disabled="!canStartGame" @click="$emit('start-game')">
          开始游戏
        </NButton>
        <NButton :disabled="!canRevealAnswer" @click="$emit('reveal-answer')">公布答案</NButton>
        <NButton :disabled="!canFinishGame" @click="$emit('finish-game')">结束游戏</NButton>
      </div>

      <div class="grid gap-5 lg:grid-cols-[1fr_220px]">
        <NSelect
          :value="selectedQuestionId"
          :disabled="!canManageGame"
          :options="questionOptions"
          placeholder="选择待回答的问题"
          @update:value="handleQuestionChange"
        />
        <NSelect
          :value="selectedOutcome"
          :disabled="!canManageGame"
          :options="outcomeOptions"
          placeholder="选择回答类型"
          @update:value="handleOutcomeChange"
        />
      </div>

      <NInput
        :value="answerDraft"
        :disabled="!canManageGame"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 5 }"
        placeholder="填写主持人的正式回答"
        @update:value="handleAnswerDraftChange"
      />

      <div class="flex flex-wrap gap-3">
        <NButton type="primary" :disabled="!canSubmit" @click="$emit('submit-answer')">
          提交回答
        </NButton>
        <NButton :disabled="!canManageGame" @click="$emit('fill-template')">填入模板</NButton>
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NAlert, NButton, NCard, NInput, NSelect, NTag } from 'naive-ui'

import { ANSWER_TYPE_LABELS } from '@/constants/labels'
import type { AnswerRecord, FormalQuestion } from '@/stores/game'

const props = defineProps<{
  canManageGame: boolean
  canStartGame: boolean
  canRevealAnswer: boolean
  canFinishGame: boolean
  startGameHint?: string
  pendingQuestions: FormalQuestion[]
  selectedQuestionId: string | null
  selectedOutcome: AnswerRecord['outcome']
  answerDraft: string
}>()

const emit = defineEmits<{
  (event: 'update:selected-question-id', value: string | null): void
  (event: 'update:selected-outcome', value: AnswerRecord['outcome']): void
  (event: 'update:answer-draft', value: string): void
  (event: 'submit-answer'): void
  (event: 'fill-template'): void
  (event: 'start-game'): void
  (event: 'reveal-answer'): void
  (event: 'finish-game'): void
}>()

const questionOptions = computed(() =>
  props.pendingQuestions.map((question) => ({
    label: `${question.senderName}：${question.content}`,
    value: question.id
  }))
)

const outcomeOptions = [
  { label: ANSWER_TYPE_LABELS.yes, value: 'yes' },
  { label: ANSWER_TYPE_LABELS.no, value: 'no' },
  { label: ANSWER_TYPE_LABELS.irrelevant, value: 'irrelevant' }
]

const canSubmit = computed(
  () =>
    props.canManageGame &&
    Boolean(props.selectedQuestionId) &&
    props.answerDraft.trim().length > 0
)

function handleQuestionChange(value: string | null) {
  emit('update:selected-question-id', value)
}

function handleOutcomeChange(value: AnswerRecord['outcome']) {
  emit('update:selected-outcome', value)
}

function handleAnswerDraftChange(value: string) {
  emit('update:answer-draft', value)
}
</script>
