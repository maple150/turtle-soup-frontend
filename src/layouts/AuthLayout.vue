<template>
  <NConfigProvider>
    <NGlobalStyle />
    <NMessageProvider>
      <div class="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.2),_transparent_32%),linear-gradient(180deg,_#fff7ed_0%,_#eff6ff_100%)]"
        />

        <div class="relative z-10 grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_480px]">
          <section
            class="hidden rounded-[32px] border border-white/60 bg-white/70 p-10 shadow-soft backdrop-blur lg:block"
          >
            <NTag round type="warning">欢迎来到酒馆</NTag>
            <div class="mt-6 flex items-center gap-4">
              <img :src="tavernLogo" alt="酒馆" class="h-16 w-16 rounded-3xl shadow-soft" />
              <div>
                <h1 class="text-4xl font-semibold tracking-tight text-slate-900">和熟人开一桌推理局</h1>
                <p class="mt-3 max-w-xl text-base leading-7 text-slate-600">
                  这里适合开房、聊天、提问和主持，多人实时同步，进入房间后就能直接开始一局海龟汤。
                </p>
              </div>
            </div>

            <div class="mt-10 grid gap-4 sm:grid-cols-2">
              <div
                v-for="item in highlights"
                :key="item.title"
                class="rounded-3xl border border-slate-200 bg-white/80 p-5"
              >
                <div class="text-sm text-slate-500">{{ item.title }}</div>
                <div class="mt-2 text-lg font-semibold text-slate-900">{{ item.value }}</div>
              </div>
            </div>
          </section>

          <div class="relative">
            <RouterView />
          </div>
        </div>
      </div>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import {
  NConfigProvider,
  NGlobalStyle,
  NMessageProvider,
  NTag
} from 'naive-ui'
import { RouterView } from 'vue-router'

import tavernLogo from '@/assets/tavern-logo.svg'

const highlights = [
  { title: '即时加入', value: '创建房间后即可邀请好友' },
  { title: '实时同步', value: '房间状态、聊天和提问同步更新' },
  { title: '轻量注册', value: '只需用户名和密码即可开始' },
  { title: '原生房间', value: '围绕多人推理场景设计' }
]
</script>
