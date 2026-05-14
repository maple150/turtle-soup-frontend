<template>
  <NCard class="h-full rounded-3xl border-0 shadow-soft" :content-style="{ padding: '16px 18px' }">
    <div class="grid h-full min-h-0 gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-lg font-semibold text-slate-900">聊天区</div>
          <div class="text-sm text-slate-500">普通聊天独立展示，列表会自动滚动到最新消息。</div>
        </div>
        <NTag size="small" type="info">{{ messages.length }} 条</NTag>
      </div>

      <div
        ref="listRef"
        class="min-h-0 space-y-3 overflow-y-auto pr-1"
      >
      <div
        v-for="message in messages"
        :key="message.id"
        class="rounded-2xl border border-slate-200 px-4 py-3"
        :class="message.kind === 'system' ? 'border-amber-100 bg-amber-50' : 'bg-slate-50'"
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
        v-if="messages.length === 0"
        description="暂无聊天消息"
        class="rounded-2xl border border-dashed border-slate-200 py-10"
      />
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { NCard, NEmpty, NTag } from 'naive-ui'

import type { ChatMessage } from '@/stores/chat'

const props = defineProps<{
  messages: ChatMessage[]
}>()

const listRef = ref<HTMLElement | null>(null)

watch(
  () => props.messages.length,
  async () => {
    await nextTick()

    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  },
  { immediate: true }
)

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
