<template>
  <section class="grid gap-6">
    <RoomHeader
      :room-code="roomCode"
      :title="roomTitle"
      :description="roomDescription"
      :status="roomStatus"
      :mode="roomMode"
      :current-round="gameStore.currentRound"
      :total-rounds="gameStore.totalRounds"
      :formatted-timer="realtimeStatus"
      :online-member-count="roomStore.onlineMemberCount"
    />

    <div class="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
      <MemberList
        :room-code="roomCode"
        :status="roomStatus"
        :members="roomMembers"
        class="xl:sticky xl:top-24 xl:self-start"
      />

      <div class="grid gap-6">
        <SoupPanel
          :soup-title="gameStore.soupTitle"
          :prompt="gameStore.prompt"
          :host-hint="gameStore.hostHint"
          :phase-label="gameStore.phaseLabel"
          :current-round="gameStore.currentRound"
          :total-rounds="gameStore.totalRounds"
          :formatted-timer="realtimeStatus"
          :questions="gameStore.questionList"
          :answers="gameStore.answerRecords"
        />

        <QuestionList
          :questions="gameStore.questionList"
          :answers="gameStore.answerRecords"
        />

        <HostControlPanel
          :can-manage-game="canManageGame"
          :can-start-game="canStartGame"
          :can-reveal-answer="canRevealAnswer"
          :can-finish-game="canFinishGame"
          :start-game-hint="startGameHint"
          :pending-questions="gameStore.pendingQuestions"
          :selected-question-id="selectedQuestionId"
          :selected-outcome="selectedOutcome"
          :answer-draft="answerDraft"
          @update:selected-question-id="selectedQuestionId = $event"
          @update:selected-outcome="selectedOutcome = $event"
          @update:answer-draft="answerDraft = $event"
          @submit-answer="handleSubmitAnswer"
          @fill-template="fillHostTemplate"
          @start-game="handleStartGame"
          @reveal-answer="handleRevealAnswer"
          @finish-game="handleFinishGame"
        />
      </div>

      <ChatPanel
        :messages="chatStore.activeMessages"
        class="xl:sticky xl:top-24 xl:self-start"
      />

      <div class="xl:col-start-2 xl:col-span-2">
        <MessageInput
          v-model="messageDraft"
          v-model:mode="messageMode"
          :disabled="submitDisabled"
          @submit="handleSubmitInput"
          @clear="messageDraft = ''"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'

import ChatPanel from '@/modules/room/components/ChatPanel.vue'
import HostControlPanel from '@/modules/room/components/HostControlPanel.vue'
import MemberList from '@/modules/room/components/MemberList.vue'
import MessageInput from '@/modules/room/components/MessageInput.vue'
import QuestionList from '@/modules/room/components/QuestionList.vue'
import RoomHeader from '@/modules/room/components/RoomHeader.vue'
import SoupPanel from '@/modules/room/components/SoupPanel.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useGameStore, type AnswerRecord } from '@/stores/game'
import { useRoomStore } from '@/stores/room'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const userStore = useUserStore()
const roomStore = useRoomStore()
const gameStore = useGameStore()
const chatStore = useChatStore()

const messageDraft = ref('')
const messageMode = ref<'chat' | 'question'>('chat')
const selectedQuestionId = ref<string | null>(null)
const selectedOutcome = ref<AnswerRecord['outcome']>('yes')
const answerDraft = ref('')

const roomCodeParam = computed(() => String(route.params.roomId || ''))
const roomTitle = computed(() => roomStore.currentRoom?.name ?? `房间 ${roomCodeParam.value}`)
const roomDescription = computed(
  () => roomStore.currentRoom?.description ?? '这里是多人实时推理房间。'
)
const roomStatus = computed(() => roomStore.currentRoom?.status ?? 'waiting')
const roomMode = computed(() => roomStore.currentRoom?.mode ?? 'casual')
const roomMembers = computed(() => roomStore.currentRoom?.members ?? [])
const roomCode = computed(() => roomStore.roomCode)
const realtimeStatus = computed(() => (roomStore.connected ? '实时同步中' : '等待连接'))

const currentUserId = computed(() => authStore.currentUserId ?? userStore.profile?.id ?? '')

const canManageGame = computed(() =>
  roomMembers.value.some(
    (member) => member.userId === currentUserId.value && member.role === 'host'
  )
)

const canStartGame = computed(
  () =>
    canManageGame.value &&
    roomStore.isInRoom &&
    roomStatus.value === 'waiting' &&
    (roomStore.connected || Boolean(roomStore.currentRoom))
)

const canRevealAnswer = computed(
  () => canManageGame.value && ['playing'].includes(roomStatus.value)
)

const canFinishGame = computed(
  () => canManageGame.value && ['playing', 'revealed'].includes(roomStatus.value)
)

const startGameHint = computed(() =>
  canStartGame.value ? '当前人数较少，也可以先开始游戏。' : ''
)

const submitDisabled = computed(
  () => messageDraft.value.trim().length === 0 || !roomStore.currentRoom || gameStore.loading || chatStore.sending
)

watch(
  () => gameStore.pendingQuestions,
  (pendingQuestions) => {
    if (!selectedQuestionId.value && pendingQuestions.length > 0) {
      selectedQuestionId.value = pendingQuestions[0].id
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => route.params.roomId,
  async (value) => {
    if (typeof value === 'string' && value) {
      await joinCurrentRoom(value)
    }
  }
)

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await router.push('/login')
    return
  }

  if (!userStore.profile) {
    await userStore.fetchCurrentUser()
  }

  if (roomCodeParam.value) {
    await joinCurrentRoom(roomCodeParam.value)
  }
})

async function joinCurrentRoom(code: string) {
  try {
    await roomStore.joinRoom(code.toUpperCase())
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加入房间失败')
    await router.push('/lobby')
  }
}

async function handleSubmitInput() {
  const content = messageDraft.value.trim()

  if (!content || !roomStore.currentRoom) {
    return
  }

  try {
    if (messageMode.value === 'chat') {
      await chatStore.sendMessage({
        roomCode: roomStore.currentRoom.roomCode,
        content
      })
    } else {
      await gameStore.submitQuestion({
        content
      })
    }

    messageDraft.value = ''
  } catch (error) {
    message.error(error instanceof Error ? error.message : '发送失败')
  }
}

async function handleSubmitAnswer() {
  if (!roomStore.currentRoom || !selectedQuestionId.value || !answerDraft.value.trim()) {
    return
  }

  try {
    await gameStore.respondToQuestion({
      questionId: selectedQuestionId.value,
      outcome: selectedOutcome.value,
      content: answerDraft.value.trim()
    })

    selectedQuestionId.value = gameStore.pendingQuestions[0]?.id ?? null
    answerDraft.value = ''
  } catch (error) {
    message.error(error instanceof Error ? error.message : '提交回答失败')
  }
}

function fillHostTemplate() {
  answerDraft.value = gameStore.answerTemplate(selectedOutcome.value)
}

async function handleStartGame() {
  if (!canStartGame.value) {
    return
  }

  try {
    await gameStore.startGame()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '开始游戏失败')
  }
}

async function handleRevealAnswer() {
  try {
    await gameStore.revealAnswer()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '公布答案失败')
  }
}

async function handleFinishGame() {
  try {
    await gameStore.finishGame()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '结束游戏失败')
  }
}
</script>
