<template>
  <section class="grid gap-3">
    <RoomHeader
      :room-code="roomCode"
      :title="roomTitle"
      :description="roomDescription"
      :status="roomStatus"
      :mode="roomMode"
      :host-nickname="hostNickname"
      :capacity="roomCapacity"
      :formatted-timer="realtimeStatus"
      :online-member-count="roomStore.onlineMemberCount"
      :members="roomMembers"
    />

    <div class="grid items-stretch gap-4 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
      <div class="h-full" :style="desktopColumnStyle">
        <QuestionList
          :questions="gameStore.questionList"
          :answers="gameStore.answerRecords"
          :panel-height="desktopColumnHeight"
        />
      </div>

      <div class="h-full" :style="desktopColumnStyle">
        <div ref="centerMeasureRef" class="flex h-full min-h-0 flex-col gap-4">
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

          <div class="mt-auto">
            <MessageInput
              v-model="messageDraft"
              v-model:mode="messageMode"
              :disabled="submitDisabled"
              :can-start-game="canStartGame"
              :can-finish-game="canFinishGame"
              :start-game-hint="startGameHint"
              @submit="handleSubmitInput"
              @clear="messageDraft = ''"
              @start-game="handleStartGame"
              @finish-game="handleFinishGame"
            />
          </div>
        </div>
      </div>

      <div class="h-full" :style="desktopColumnStyle">
        <ChatPanel :messages="chatStore.activeMessages" :panel-height="desktopColumnHeight" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'

import ChatPanel from '@/modules/room/components/ChatPanel.vue'
import MessageInput from '@/modules/room/components/MessageInput.vue'
import QuestionList from '@/modules/room/components/QuestionList.vue'
import RoomHeader from '@/modules/room/components/RoomHeader.vue'
import SoupPanel from '@/modules/room/components/SoupPanel.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useGameStore } from '@/stores/game'
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
const centerMeasureRef = ref<HTMLElement | null>(null)
const sidePanelHeight = ref<number | null>(null)
const isDesktopLayout = ref(false)
let resizeObserver: ResizeObserver | null = null
let mediaQuery: MediaQueryList | null = null

const roomCodeParam = computed(() => String(route.params.roomId || ''))
const roomTitle = computed(() => roomStore.currentRoom?.name ?? `房间 ${roomCodeParam.value}`)
const roomDescription = computed(() => roomStore.currentRoom?.description ?? '这里是多人实时推理房间。')
const roomStatus = computed(() => roomStore.currentRoom?.status ?? 'waiting')
const roomMode = computed(() => roomStore.currentRoom?.mode ?? 'casual')
const roomMembers = computed(() => roomStore.currentRoom?.members ?? [])
const roomCode = computed(() => roomStore.roomCode)
const hostNickname = computed(() => roomStore.currentRoom?.hostNickname ?? '房主')
const roomCapacity = computed(() => roomStore.currentRoom?.capacity ?? 0)
const realtimeStatus = computed(() => (roomStore.connected ? '实时同步中' : '等待连接'))

const currentUserId = computed(() => authStore.currentUserId ?? userStore.profile?.id ?? '')

const canManageGame = computed(() =>
  roomMembers.value.some((member) => member.userId === currentUserId.value && member.role === 'host')
)

const canStartGame = computed(
  () =>
    canManageGame.value &&
    roomStore.isInRoom &&
    roomStatus.value === 'waiting' &&
    (roomStore.connected || Boolean(roomStore.currentRoom))
)

const canFinishGame = computed(
  () =>
    canManageGame.value &&
    roomStore.isInRoom &&
    roomStore.connected &&
    roomStatus.value === 'playing'
)

const startGameHint = computed(() => (canStartGame.value ? '当前人数较少，也可以先开始游戏。' : ''))

const submitDisabled = computed(
  () => messageDraft.value.trim().length === 0 || !roomStore.currentRoom || gameStore.loading || chatStore.sending
)

onMounted(async () => {
  initializeDesktopPanelSync()

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

onBeforeUnmount(() => {
  resizeObserver?.disconnect()

  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleDesktopMediaChange)
  }
})

const desktopColumnHeight = computed(() =>
  isDesktopLayout.value && sidePanelHeight.value ? sidePanelHeight.value : null
)

const desktopColumnStyle = computed(() =>
  desktopColumnHeight.value ? { height: `${desktopColumnHeight.value}px` } : undefined
)

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
        content,
        roomId: roomStore.currentRoom.id,
        senderId: currentUserId.value || authStore.currentUserId || 'local',
        senderName: userStore.displayName || authStore.currentUserName || '我'
      })
    }

    messageDraft.value = ''
  } catch (error) {
    message.error(error instanceof Error ? error.message : '发送失败')
  }
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

async function handleFinishGame() {
  if (!canFinishGame.value) {
    return
  }

  try {
    await gameStore.finishGame()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '结束游戏失败')
  }
}

function initializeDesktopPanelSync() {
  mediaQuery = window.matchMedia('(min-width: 1280px)')
  isDesktopLayout.value = mediaQuery.matches
  mediaQuery.addEventListener('change', handleDesktopMediaChange)

  resizeObserver = new ResizeObserver(() => {
    updateSidePanelHeight()
  })

  if (centerMeasureRef.value) {
    resizeObserver.observe(centerMeasureRef.value)
  }

  void nextTick(() => {
    updateSidePanelHeight()
  })
}

function handleDesktopMediaChange(event: MediaQueryListEvent) {
  isDesktopLayout.value = event.matches
  updateSidePanelHeight()
}

function updateSidePanelHeight() {
  if (!isDesktopLayout.value || !centerMeasureRef.value) {
    sidePanelHeight.value = null
    return
  }

  sidePanelHeight.value = Math.ceil(centerMeasureRef.value.scrollHeight)
}
</script>
