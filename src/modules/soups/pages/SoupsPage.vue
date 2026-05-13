<template>
  <section class="grid gap-6">
    <NCard class="rounded-3xl border-0 shadow-soft">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-3">
          <NTag round type="warning">题库</NTag>
          <div>
            <h1 class="text-3xl font-semibold text-slate-900">海龟汤题库</h1>
            <NText depth="3" class="mt-2 block">
              这里展示后端返回的公开题目。你可以先挑一题，再去大厅开桌。
            </NText>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <NInput v-model:value="filters.keyword" placeholder="搜索题目标题" />
          <NSelect v-model:value="filters.difficulty" :options="difficultyOptions" placeholder="选择难度" />
          <NButton type="primary" :loading="loading" @click="fetchSoups">开始搜索</NButton>
        </div>
      </div>
    </NCard>

    <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <NCard
        v-for="item in soups"
        :key="item.id"
        class="rounded-3xl border-0 shadow-soft"
        hoverable
      >
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-lg font-semibold text-slate-900">{{ item.title }}</div>
              <div class="mt-1 text-sm text-slate-500">{{ item.subtitle || '暂无副标题' }}</div>
            </div>
            <NTag size="small" :type="difficultyTagType(item.difficulty)">
              {{ difficultyLabel(item.difficulty) }}
            </NTag>
          </div>

          <NText depth="3">{{ item.description }}</NText>

          <div class="flex flex-wrap gap-2">
            <NTag v-for="tag in item.tags" :key="tag" size="small" type="info">{{ tag }}</NTag>
          </div>

          <div class="flex items-center justify-between text-sm text-slate-500">
            <span>收藏 {{ item.favoriteCount }}</span>
            <span>{{ formatDate(item.createdAt) }}</span>
          </div>
        </div>
      </NCard>

      <NEmpty
        v-if="!loading && soups.length === 0"
        description="暂无题目"
        class="md:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-slate-200 bg-white py-16"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { NButton, NCard, NEmpty, NInput, NSelect, NTag, NText, useMessage } from 'naive-ui'

import { getSoupList, type SoupDetail, type SoupDifficulty, type SoupSummary } from '@/api/soup'
import { unwrapResponse } from '@/api/request'

const message = useMessage()
const loading = ref(false)
const soups = ref<Array<SoupSummary | SoupDetail>>([])

const filters = reactive<{
  keyword: string
  difficulty: SoupDifficulty | 'all'
}>({
  keyword: '',
  difficulty: 'all'
})

const difficultyOptions = [
  { label: '全部难度', value: 'all' },
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' }
]

function difficultyLabel(value: SoupDifficulty) {
  switch (value) {
    case 'easy':
      return '简单'
    case 'medium':
      return '中等'
    default:
      return '困难'
  }
}

function difficultyTagType(value: SoupDifficulty) {
  switch (value) {
    case 'easy':
      return 'success'
    case 'medium':
      return 'warning'
    default:
      return 'error'
  }
}

function formatDate(value: number) {
  return new Date(value).toLocaleDateString('zh-CN')
}

async function fetchSoups() {
  loading.value = true

  try {
    const result = unwrapResponse(
      await getSoupList({
        page: 1,
        pageSize: 30,
        keyword: filters.keyword || undefined,
        difficulty: filters.difficulty === 'all' ? undefined : filters.difficulty
      })
    )
    soups.value = result.list
  } catch (error) {
    message.error(error instanceof Error ? error.message : '题库加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchSoups()
})
</script>
