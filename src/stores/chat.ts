import { defineStore } from 'pinia'

import { WS_CLIENT_EVENTS } from '@/socket/events'
import { getSocket } from '@/services/socket'

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  content: string
  kind: 'system' | 'player'
  createdAt: string
}

interface ChatState {
  activeRoomCode: string | null
  messageMap: Record<string, ChatMessage[]>
  draftMap: Record<string, string>
  unreadMap: Record<string, number>
  sending: boolean
  connected: boolean
  lastMessageAt: string | null
}

function toChatMessage(payload: {
  id: string
  roomId: string
  senderUserId: string
  senderNickname: string
  content: string
  kind: 'chat' | 'system'
  createdAt: number
}): ChatMessage {
  return {
    id: payload.id,
    roomId: payload.roomId,
    senderId: payload.senderUserId,
    senderName: payload.senderNickname,
    content: payload.content,
    kind: payload.kind === 'system' ? 'system' : 'player',
    createdAt: new Date(payload.createdAt).toISOString()
  }
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    activeRoomCode: null,
    messageMap: {},
    draftMap: {},
    unreadMap: {},
    sending: false,
    connected: false,
    lastMessageAt: null
  }),

  getters: {
    activeMessages: (state) =>
      state.activeRoomCode ? state.messageMap[state.activeRoomCode] ?? [] : [],
    activeDraft: (state) => (state.activeRoomCode ? state.draftMap[state.activeRoomCode] ?? '' : '')
  },

  actions: {
    setActiveRoom(roomCode: string | null) {
      this.activeRoomCode = roomCode
    },

    initializeRoomChannel(roomCode: string) {
      this.setActiveRoom(roomCode)
      this.markRoomRead(roomCode)
      this.connected = true
    },

    syncMessages(roomCode: string, messages: Array<{
      id: string
      roomId: string
      senderUserId: string
      senderNickname: string
      content: string
      kind: 'chat' | 'system'
      createdAt: number
    }>) {
      this.messageMap = {
        ...this.messageMap,
        [roomCode]: messages.map(toChatMessage)
      }
      this.lastMessageAt = new Date().toISOString()
    },

    setDraft(roomCode: string, draft: string) {
      this.draftMap = {
        ...this.draftMap,
        [roomCode]: draft
      }
    },

    async sendMessage(payload: { roomCode: string; content: string }) {
      this.sending = true

      try {
        getSocket().emit(WS_CLIENT_EVENTS.CHAT_SEND, {
          content: payload.content
        })
        this.setDraft(payload.roomCode, '')
      } finally {
        this.sending = false
      }
    },

    receiveMessage(roomCode: string, message: {
      id: string
      roomId: string
      senderUserId: string
      senderNickname: string
      content: string
      kind: 'chat' | 'system'
      createdAt: number
    }) {
      const nextMessage = toChatMessage(message)
      const nextMessages = [...(this.messageMap[roomCode] ?? []), nextMessage]

      this.messageMap = {
        ...this.messageMap,
        [roomCode]: nextMessages
      }

      if (this.activeRoomCode !== roomCode) {
        this.unreadMap = {
          ...this.unreadMap,
          [roomCode]: (this.unreadMap[roomCode] ?? 0) + 1
        }
      }

      this.lastMessageAt = nextMessage.createdAt
    },

    markRoomRead(roomCode: string) {
      this.unreadMap = {
        ...this.unreadMap,
        [roomCode]: 0
      }
    },

    closeRoomChannel(roomCode: string) {
      if (this.activeRoomCode === roomCode) {
        this.activeRoomCode = null
      }

      this.connected = false
    },

    resetState() {
      this.activeRoomCode = null
      this.messageMap = {}
      this.draftMap = {}
      this.unreadMap = {}
      this.sending = false
      this.connected = false
      this.lastMessageAt = null
    }
  }
})
