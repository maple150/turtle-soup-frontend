<template>
  <section class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
    <NCard class="rounded-3xl border-0 shadow-soft">
      <template #header>
        <div>
          <div class="text-2xl font-semibold text-slate-900">创建房间</div>
          <NText depth="3" class="mt-2 block">
            填好基本信息后即可开桌。人数较少也可以先开始，是否允许由后端决定。
          </NText>
        </div>
      </template>

      <NForm ref="formRef" :model="formValue" :rules="rules" label-placement="top" size="large">
        <div class="grid gap-5">
          <NFormItem label="房间名称" path="name">
            <NInput v-model:value="formValue.name" placeholder="请输入房间名称" />
          </NFormItem>
          <div class="grid gap-5 md:grid-cols-2">
            <NFormItem label="房间模式" path="mode">
              <NSelect v-model:value="formValue.mode" :options="modeOptions" placeholder="请选择模式" />
            </NFormItem>
            <NFormItem label="房间人数上限" path="capacity">
              <NSelect
                v-model:value="formValue.capacity"
                :options="capacityOptions"
                placeholder="请选择人数上限"
              />
            </NFormItem>
          </div>
          <NFormItem label="房间简介" path="description">
            <NInput
              v-model:value="formValue.description"
              type="textarea"
              :autosize="{ minRows: 4, maxRows: 6 }"
              placeholder="简单介绍一下这桌的风格"
            />
          </NFormItem>
          <div class="grid gap-4 md:grid-cols-2">
            <NCheckbox v-model:checked="formValue.isPrivate">私密房间</NCheckbox>
            <NCheckbox v-model:checked="formValue.allowSpectators">允许旁观</NCheckbox>
          </div>
          <div class="flex flex-wrap gap-3">
            <NButton type="primary" :loading="roomStore.joining" @click="handleCreate">立即创建</NButton>
            <NButton @click="router.push('/lobby')">返回大厅</NButton>
          </div>
        </div>
      </NForm>
    </NCard>

    <NCard class="rounded-3xl border-0 shadow-soft">
      <template #header>
        <div class="text-lg font-semibold text-slate-900">开桌建议</div>
      </template>

      <NSpace vertical :size="16">
        <div
          v-for="item in presets"
          :key="item.label"
          class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
        >
          <div class="text-sm text-slate-500">{{ item.label }}</div>
          <div class="mt-2 text-base font-semibold text-slate-900">{{ item.value }}</div>
        </div>
      </NSpace>
    </NCard>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import {
  NButton,
  NCard,
  NCheckbox,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NText,
  useMessage
} from 'naive-ui'
import { useRouter } from 'vue-router'

import { useRoomStore } from '@/stores/room'

const router = useRouter()
const message = useMessage()
const roomStore = useRoomStore()
const formRef = ref<FormInst | null>(null)

const formValue = reactive({
  name: '',
  description: '',
  mode: 'casual' as 'casual' | 'ranked' | 'private',
  capacity: 6,
  isPrivate: false,
  allowSpectators: true
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入房间名称', trigger: ['blur', 'input'] }
  ],
  description: [
    { required: true, message: '请输入房间简介', trigger: ['blur', 'input'] }
  ],
  mode: [
    { required: true, message: '请选择房间模式', trigger: ['change'] }
  ],
  capacity: [
    { required: true, type: 'number', message: '请选择人数上限', trigger: ['change'] }
  ]
}

const modeOptions = [
  { label: '休闲', value: 'casual' },
  { label: '竞技', value: 'ranked' },
  { label: '私密', value: 'private' }
]

const capacityOptions = [
  { label: '2 人', value: 2 },
  { label: '4 人', value: 4 },
  { label: '6 人', value: 6 },
  { label: '8 人', value: 8 }
]

const presets = [
  { label: '默认可见性', value: '公开房间，可在大厅被看到' },
  { label: '开始条件', value: '房主进入后即可决定是否开局' },
  { label: '实时同步', value: '聊天、提问和房间状态同步更新' }
]

async function handleCreate() {
  await formRef.value?.validate()

  try {
    const room = await roomStore.createRoom({
      name: formValue.name.trim(),
      description: formValue.description.trim(),
      mode: formValue.mode,
      capacity: formValue.capacity,
      isPrivate: formValue.isPrivate,
      allowSpectators: formValue.allowSpectators
    })

    message.success('房间创建成功')
    await router.push(`/room/${room.roomCode}`)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '房间创建失败')
  }
}
</script>
