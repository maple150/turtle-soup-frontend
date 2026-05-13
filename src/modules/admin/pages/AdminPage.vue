<template>
  <section class="grid gap-6">
    <NCard class="rounded-3xl border-0 shadow-soft">
      <div class="space-y-3">
        <NTag round type="error">管理后台</NTag>
        <div>
          <h1 class="text-3xl font-semibold text-slate-900">后台入口预留中</h1>
          <NText depth="3" class="mt-2 block">
            后台管理能力暂未开放。后续可以在这里接入题目审核、房间巡检和用户处理流程。
          </NText>
        </div>
      </div>
    </NCard>
  </section>
</template>

<script setup lang="ts">
import { NCard, NTag, NText } from 'naive-ui'
</script>
