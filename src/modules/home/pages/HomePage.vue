<template>
  <section class="grid gap-6">
    <NCard class="rounded-3xl border-0 shadow-soft">
      <div class="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div class="space-y-5">
          <NTag round type="warning">今晚开桌</NTag>
          <div class="space-y-3">
            <h1 class="text-4xl font-semibold tracking-tight text-slate-900">
              在酒馆里，随时开始一局海龟汤
            </h1>
            <NText depth="3" class="block max-w-2xl text-base leading-7">
              创建房间、邀请好友、提问推理、主持控场。这里保留了最直接的多人游玩入口，不再展示开发过程信息。
            </NText>
          </div>
          <div class="flex flex-wrap gap-3">
            <NButton type="primary" round @click="router.push('/lobby')">进入房间大厅</NButton>
            <NButton round @click="router.push('/soups')">浏览题库</NButton>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div
            v-for="metric in metrics"
            :key="metric.label"
            class="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4"
          >
            <div class="text-sm text-slate-500">{{ metric.label }}</div>
            <div class="mt-2 text-2xl font-semibold text-slate-900">{{ metric.value }}</div>
            <div class="mt-1 text-sm text-slate-500">{{ metric.caption }}</div>
          </div>
        </div>
      </div>
    </NCard>

    <div class="grid gap-6 lg:grid-cols-2">
      <NCard class="overflow-hidden rounded-3xl border-0 shadow-soft">
        <img :src="lanternsImage" alt="夜色酒馆" class="h-64 w-full rounded-3xl object-cover" />
        <div class="mt-5 space-y-2">
          <div class="text-xl font-semibold text-slate-900">夜色开场</div>
          <NText depth="3">
            适合熟人局、语音局和轻竞技局。人数少也能先开始，把节奏掌握在房主手里。
          </NText>
        </div>
      </NCard>

      <NCard class="overflow-hidden rounded-3xl border-0 shadow-soft">
        <img :src="boardImage" alt="推理线索板" class="h-64 w-full rounded-3xl object-cover" />
        <div class="mt-5 space-y-2">
          <div class="text-xl font-semibold text-slate-900">围桌推理</div>
          <NText depth="3">
            房间页会区分成员区、题面区和聊天区，正式提问与普通聊天也会分开处理，减少信息混杂。
          </NText>
        </div>
      </NCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { NButton, NCard, NTag, NText } from 'naive-ui'
import { useRouter } from 'vue-router'

import boardImage from '@/assets/home-board.svg'
import lanternsImage from '@/assets/home-lanterns.svg'

const router = useRouter()

const metrics = [
  { label: '房间大厅', value: '实时列表', caption: '查看公开房间与状态' },
  { label: '多人联机', value: '原生同步', caption: '聊天、提问、答案实时更新' },
  { label: '题库入口', value: '随时取题', caption: '开房后可直接进入推理' }
]
</script>
