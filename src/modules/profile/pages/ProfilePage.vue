<template>
  <section class="grid gap-6 lg:grid-cols-[320px_1fr]">
    <NCard class="rounded-3xl border-0 shadow-soft">
      <div class="space-y-5 text-center">
        <img :src="tavernLogo" alt="酒馆" class="mx-auto h-20 w-20 rounded-3xl shadow-soft" />
        <div>
          <div class="text-2xl font-semibold text-slate-900">{{ userStore.displayName }}</div>
          <NText depth="3" class="mt-2 block">个人资料概览</NText>
        </div>
        <div class="grid gap-3">
          <div
            v-for="item in stats"
            :key="item.label"
            class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
          >
            <div class="text-sm text-slate-500">{{ item.label }}</div>
            <div class="mt-2 text-xl font-semibold text-slate-900">{{ item.value }}</div>
          </div>
        </div>
      </div>
    </NCard>

    <div class="grid gap-6">
      <NCard class="rounded-3xl border-0 shadow-soft">
        <template #header>
          <div class="text-lg font-semibold text-slate-900">编辑资料</div>
        </template>

        <NForm ref="formRef" :model="formValue" :rules="rules" label-placement="top">
          <div class="grid gap-5 md:grid-cols-2">
            <NFormItem label="用户名">
              <NInput :value="userStore.profile?.username || ''" disabled />
            </NFormItem>
            <NFormItem label="昵称" path="nickname">
              <NInput v-model:value="formValue.nickname" placeholder="请输入昵称" />
            </NFormItem>
            <NFormItem label="邮箱" path="email">
              <NInput v-model:value="formValue.email" placeholder="可选，留空则不展示" />
            </NFormItem>
            <NFormItem label="当前身份">
              <NInput :value="userStore.userRoles.join('、') || '玩家'" disabled />
            </NFormItem>
            <NFormItem label="个人简介" path="bio" class="md:col-span-2">
              <NInput
                v-model:value="formValue.bio"
                type="textarea"
                :autosize="{ minRows: 4, maxRows: 6 }"
                placeholder="介绍一下你自己"
              />
            </NFormItem>
          </div>

          <div class="mt-2 flex gap-3">
            <NButton type="primary" :loading="userStore.loading" @click="handleSave">保存资料</NButton>
            <NButton @click="resetForm">重置</NButton>
          </div>
        </NForm>
      </NCard>

      <NCard class="rounded-3xl border-0 shadow-soft">
        <template #header>
          <div class="text-lg font-semibold text-slate-900">账号说明</div>
        </template>

        <div class="grid gap-4 md:grid-cols-3">
          <div
            v-for="panel in panels"
            :key="panel.label"
            class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
          >
            <div class="text-sm text-slate-500">{{ panel.label }}</div>
            <div class="mt-2 text-base font-semibold text-slate-900">{{ panel.value }}</div>
          </div>
        </div>
      </NCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { NButton, NCard, NForm, NFormItem, NInput, NText, useMessage } from 'naive-ui'

import tavernLogo from '@/assets/tavern-logo.svg'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const formValue = reactive({
  nickname: '',
  email: '',
  bio: ''
})

const rules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: ['blur', 'input'] }
  ],
  email: [
    {
      validator: (_rule, value: string) =>
        value.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: '邮箱格式不正确',
      trigger: ['blur', 'input']
    }
  ]
}

const stats = computed(() => [
  { label: '当前状态', value: userStore.profile ? '已登录' : '未登录' },
  { label: '资料更新时间', value: userStore.lastFetchedAt ? '已同步' : '待同步' },
  { label: '身份', value: userStore.userRoles.join('、') || '玩家' }
])

const panels = [
  { label: '昵称默认值', value: '默认与用户名一致，可随时修改' },
  { label: '邮箱展示', value: '邮箱可选，留空时前端不展示' },
  { label: '个人简介', value: '简介默认留空，可自行填写' }
]

function resetForm() {
  formValue.nickname = userStore.profile?.nickname || ''
  formValue.email = userStore.profile?.email || ''
  formValue.bio = userStore.profile?.bio || ''
}

watch(
  () => userStore.profile,
  () => {
    resetForm()
  },
  { immediate: true }
)

async function handleSave() {
  await formRef.value?.validate()

  try {
    await userStore.updateProfile({
      nickname: formValue.nickname.trim(),
      email: formValue.email.trim(),
      bio: formValue.bio.trim()
    })
    message.success('个人资料已保存')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败')
  }
}

onMounted(async () => {
  if (!userStore.profile) {
    await userStore.fetchCurrentUser()
  }
})
</script>
