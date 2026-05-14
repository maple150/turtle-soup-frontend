<template>
  <NCard class="rounded-3xl border-0 shadow-soft" :content-style="{ padding: '16px 18px' }">
    <div class="grid gap-3">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div class="text-base font-semibold text-slate-900">输入区</div>
          <div class="text-sm text-slate-500">
            普通聊天和正式提问分开输入。AI 会自动处理正式提问。
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <NRadioGroup :value="mode" size="medium" @update:value="handleModeChange">
            <NRadioButton value="chat">聊天</NRadioButton>
            <NRadioButton value="question">正式提问</NRadioButton>
          </NRadioGroup>
          <NButton size="small" type="primary" :disabled="!canStartGame" @click="$emit('start-game')">开始游戏</NButton>
          <NButton size="small" :disabled="!canRevealAnswer" @click="$emit('reveal-answer')">公布答案</NButton>
          <NButton size="small" :disabled="!canFinishGame" @click="$emit('finish-game')">结束游戏</NButton>
        </div>
      </div>

      <NAlert v-if="startGameHint" type="info" :show-icon="false">
        {{ startGameHint }}
      </NAlert>

      <div class="grid gap-3 md:grid-cols-[1fr_132px]">
        <NInput
          :value="modelValue"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 5 }"
          :placeholder="placeholder"
          @update:value="handleInput"
        />

        <div class="flex flex-col gap-3">
          <NButton type="primary" :disabled="disabled" @click="$emit('submit')">
            {{ mode === 'chat' ? '发送聊天' : '发送提问' }}
          </NButton>
          <NButton quaternary @click="$emit('clear')">清空内容</NButton>
        </div>
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NAlert, NButton, NCard, NInput, NRadioButton, NRadioGroup } from 'naive-ui'

const props = defineProps<{
  modelValue: string
  mode: 'chat' | 'question'
  disabled?: boolean
  canStartGame: boolean
  canRevealAnswer: boolean
  canFinishGame: boolean
  startGameHint?: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'update:mode', value: 'chat' | 'question'): void
  (event: 'submit'): void
  (event: 'clear'): void
  (event: 'start-game'): void
  (event: 'reveal-answer'): void
  (event: 'finish-game'): void
}>()

const placeholder = computed(() =>
  props.mode === 'chat' ? '输入聊天内容' : '输入你想向 AI 主持人提出的正式问题'
)

function handleInput(value: string) {
  emit('update:modelValue', value)
}

function handleModeChange(value: 'chat' | 'question') {
  emit('update:mode', value)
}
</script>
