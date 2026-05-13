<template>
  <NCard class="rounded-[32px] border-0 shadow-soft">
    <div class="space-y-8">
      <div class="space-y-3">
        <NTag round type="warning">登录</NTag>
        <div>
          <h2 class="text-3xl font-semibold text-slate-900">回到房间，继续推理</h2>
          <NText depth="3" class="mt-2 block">
            使用用户名和密码登录，进入大厅后就可以加入房间或自己开一桌。
          </NText>
        </div>
      </div>

      <NForm ref="formRef" :model="formValue" :rules="rules" label-placement="top" size="large">
        <div class="grid gap-5">
          <NFormItem label="用户名" path="username">
            <NInput
              v-model:value="formValue.username"
              placeholder="请输入用户名"
              @keydown.enter.prevent="handleSubmit"
            />
          </NFormItem>
          <NFormItem label="密码" path="password">
            <NInput
              v-model:value="formValue.password"
              type="password"
              show-password-on="click"
              placeholder="请输入密码"
              @keydown.enter.prevent="handleSubmit"
            />
          </NFormItem>
          <NButton type="primary" size="large" block :loading="authStore.authLoading" @click="handleSubmit">
            立即登录
          </NButton>
        </div>
      </NForm>

      <div class="flex items-center justify-between gap-3 rounded-3xl bg-slate-50 px-5 py-4">
        <NText depth="3">还没有账号？</NText>
        <NButton tertiary type="primary" @click="router.push('/register')">去注册</NButton>
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NTag,
  NText,
  useMessage
} from 'naive-ui'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const formRef = ref<FormInst | null>(null)
const formValue = reactive({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [
    {
      required: true,
      message: '请输入用户名',
      trigger: ['blur', 'input']
    }
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: ['blur', 'input']
    }
  ]
}

async function handleSubmit() {
  await formRef.value?.validate()

  try {
    await authStore.login({
      username: formValue.username.trim(),
      password: formValue.password
    })

    message.success('登录成功')
    await router.push('/lobby')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '登录失败')
  }
}
</script>
