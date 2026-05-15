<template>
  <NCard class="flex h-full rounded-3xl border-0 shadow-soft" :content-style="{ padding: '14px 16px' }">
    <div class="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-slate-900">聊天区</div>
          <div class="text-sm text-slate-500">这里只显示普通聊天和必要系统消息，列表会自动跟到最新。</div>
        </div>
        <NTag size="small" type="info">{{ visibleMessages.length }} 条</NTag>
      </div>

      <div class="flex min-h-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <div ref="listRef" class="flex-1 space-y-3 overflow-y-auto pr-1">
          <div
            v-for="message in visibleMessages"
            :key="message.id"
            class="rounded-2xl border border-slate-200 px-4 py-3 transition-opacity duration-700"
            :class="[
              message.kind === 'system' ? 'border-amber-100 bg-amber-50' : 'bg-white',
              messageOpacityClass(message)
            ]"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-900">{{ message.senderName }}</span>
                <NTag v-if="message.kind === 'system'" size="tiny" type="warning">系统</NTag>
              </div>
              <span class="text-xs text-slate-400">{{ formatTime(message.createdAt) }}</span>
            </div>
            <div class="mt-2 text-sm leading-7 text-slate-600">{{ message.content }}</div>
          </div>

          <NEmpty
            v-if="visibleMessages.length === 0"
            description="暂无聊天消息"
            class="flex min-h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-10"
          />
        </div>
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NCard, NEmpty, NTag } from 'naive-ui'

import type { ChatMessage } from '@/stores/chat'

const props = defineProps<{
  messages: ChatMessage[]
}>()

const TRANSIENT_MESSAGE_FADE_MS = 90 * 1000
const TRANSIENT_MESSAGE_REMOVE_MS = 180 * 1000

const listRef = ref<HTMLElement | null>(null)
const nowTick = ref(Date.now())
let timer: number | null = null

const visibleMessages = computed(() =>
  props.messages.filter((message) => {
    if (isQaRelatedSystemMessage(message)) {
      return false
    }

    if (!isTransientRoomActivityMessage(message)) {
      return true
    }

    return nowTick.value - new Date(message.createdAt).getTime() < TRANSIENT_MESSAGE_REMOVE_MS
  })
)

watch(
  () => visibleMessages.value.map((message) => message.id).join('|'),
  async () => {
    await nextTick()

    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  },
  { immediate: true }
)

onMounted(() => {
  timer = window.setInterval(() => {
    nowTick.value = Date.now()
  }, 30000)
})

onBeforeUnmount(() => {
  if (timer !== null) {
    window.clearInterval(timer)
  }
})

function isTransientRoomActivityMessage(message: ChatMessage) {
  if (message.kind !== 'system') {
    return false
  }

  return /加入了房间|离开了房间|joined the room|left the room/i.test(message.content)
}

function isQaRelatedSystemMessage(message: ChatMessage) {
  if (message.kind !== 'system') {
    return false
  }

  return /已回答问题|回答了问题|answered question/i.test(message.content)
}

function messageOpacityClass(message: ChatMessage) {
  if (!isTransientRoomActivityMessage(message)) {
    return 'opacity-100'
  }

  const age = nowTick.value - new Date(message.createdAt).getTime()

  if (age >= TRANSIENT_MESSAGE_REMOVE_MS) {
    return 'hidden'
  }

  if (age >= TRANSIENT_MESSAGE_FADE_MS) {
    return 'opacity-50'
  }

  return 'opacity-100'
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
