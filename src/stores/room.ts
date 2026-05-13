import { defineStore } from 'pinia'

import {
  createRoom,
  createRoomWsTicket,
  getRoomDetail,
  getRoomList,
  joinRoom as joinRoomApi,
  leaveRoom as leaveRoomApi,
  type CreateRoomParams,
  type RoomMember,
  type RoomMode,
  type RoomSnapshot,
  type RoomStatus,
  type RoomSummary
} from '@/api/room'
import { unwrapResponse } from '@/api/request'
import { ROOM_STATUS_LABELS } from '@/constants/labels'
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket'
import { SOCKET_CONNECTION_EVENTS, WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from '@/socket/events'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useGameStore } from '@/stores/game'

export interface RoomDetail extends RoomSummary {
  members: RoomMember[]
  onlineCount: number
}

interface LobbyFilters {
  keyword: string
  mode: RoomMode | 'all'
  status: RoomStatus | 'all'
}

interface RoomState {
  rooms: RoomSummary[]
  currentRoom: RoomDetail | null
  lobbyFilters: LobbyFilters
  loading: boolean
  joining: boolean
  connected: boolean
  lastSyncedAt: string | null
}

function mapRoomSummary(room: RoomSummary): RoomSummary {
  return room
}

function mapSnapshot(snapshot: RoomSnapshot): RoomDetail {
  return {
    ...snapshot,
    members: snapshot.members,
    onlineCount: snapshot.onlineCount
  }
}

export const useRoomStore = defineStore('room', {
  state: (): RoomState => ({
    rooms: [],
    currentRoom: null,
    lobbyFilters: {
      keyword: '',
      mode: 'all',
      status: 'all'
    },
    loading: false,
    joining: false,
    connected: false,
    lastSyncedAt: null
  }),

  getters: {
    currentRoomId: (state) => state.currentRoom?.id ?? null,
    isInRoom: (state) => Boolean(state.currentRoom),
    filteredRooms: (state) =>
      state.rooms.filter((room) => {
        const matchesKeyword =
          !state.lobbyFilters.keyword ||
          room.name.toLowerCase().includes(state.lobbyFilters.keyword.toLowerCase()) ||
          room.roomCode.toLowerCase().includes(state.lobbyFilters.keyword.toLowerCase())
        const matchesMode = state.lobbyFilters.mode === 'all' || room.mode === state.lobbyFilters.mode
        const matchesStatus =
          state.lobbyFilters.status === 'all' || room.status === state.lobbyFilters.status

        return matchesKeyword && matchesMode && matchesStatus
      }),
    onlineMemberCount: (state) => state.currentRoom?.onlineCount ?? 0,
    roomCode: (state) => state.currentRoom?.roomCode ?? '--',
    roomStatusLabel: (state) =>
      state.currentRoom ? ROOM_STATUS_LABELS[state.currentRoom.status] : '未知状态'
  },

  actions: {
    setLobbyFilters(filters: Partial<LobbyFilters>) {
      this.lobbyFilters = {
        ...this.lobbyFilters,
        ...filters
      }
    },

    async fetchRooms() {
      this.loading = true

      try {
        const result = unwrapResponse(
          await getRoomList({
            page: 1,
            pageSize: 50,
            keyword: this.lobbyFilters.keyword || undefined,
            mode: this.lobbyFilters.mode === 'all' ? undefined : this.lobbyFilters.mode,
            status: this.lobbyFilters.status === 'all' ? undefined : this.lobbyFilters.status
          })
        )

        this.rooms = result.list.map(mapRoomSummary)
        this.lastSyncedAt = new Date().toISOString()
      } finally {
        this.loading = false
      }
    },

    async createRoom(payload: CreateRoomParams) {
      this.joining = true

      try {
        const room = unwrapResponse(await createRoom(payload))
        await this.fetchRooms()
        await this.joinRoom(room.roomCode)
        return room
      } finally {
        this.joining = false
      }
    },

    async fetchRoomDetail(roomCode: string) {
      const room = unwrapResponse(await getRoomDetail(roomCode))

      this.currentRoom = {
        ...room,
        members: this.currentRoom?.roomCode === room.roomCode ? this.currentRoom.members : [],
        onlineCount: this.currentRoom?.roomCode === room.roomCode ? this.currentRoom.onlineCount : 0
      }
      this.lastSyncedAt = new Date().toISOString()
    },

    async joinRoom(roomCode: string) {
      this.joining = true

      try {
        await joinRoomApi(roomCode)
        await this.fetchRoomDetail(roomCode)
        await this.connectRoomSocket(roomCode)
      } finally {
        this.joining = false
      }
    },

    async leaveCurrentRoom() {
      if (!this.currentRoom) {
        return
      }

      const leavingCode = this.currentRoom.roomCode

      try {
        await leaveRoomApi(leavingCode)
      } finally {
        disconnectSocket()
        useChatStore().closeRoomChannel(leavingCode)
        useGameStore().resetState()
        this.currentRoom = null
        this.connected = false
        this.lastSyncedAt = new Date().toISOString()
      }
    },

    syncRoomSnapshot(snapshot: RoomSnapshot) {
      this.currentRoom = mapSnapshot(snapshot)
      this.connected = true
      this.lastSyncedAt = new Date().toISOString()

      useChatStore().syncMessages(snapshot.roomCode, snapshot.chatMessages)
      useChatStore().initializeRoomChannel(snapshot.roomCode)
      useGameStore().initializeForRoom(snapshot.roomCode)
      useGameStore().applyRoomSnapshot(snapshot)
    },

    async connectRoomSocket(roomCode: string) {
      const appStore = useAppStore()
      const authStore = useAuthStore()
      const chatStore = useChatStore()
      const gameStore = useGameStore()
      const socket = getSocket()

      const ticket = unwrapResponse(await createRoomWsTicket(roomCode))

      socket.off(SOCKET_CONNECTION_EVENTS.CONNECT)
      socket.off(SOCKET_CONNECTION_EVENTS.DISCONNECT)
      socket.off(SOCKET_CONNECTION_EVENTS.CONNECT_ERROR)
      socket.off(WS_SERVER_EVENTS.ROOM_SNAPSHOT)
      socket.off(WS_SERVER_EVENTS.ROOM_STATE_UPDATED)
      socket.off(WS_SERVER_EVENTS.CHAT_MESSAGE)
      socket.off(WS_SERVER_EVENTS.GAME_QUESTION_CREATED)
      socket.off(WS_SERVER_EVENTS.GAME_ANSWER_CREATED)
      socket.off(WS_SERVER_EVENTS.GAME_REVEALED)
      socket.off(WS_SERVER_EVENTS.GAME_FINISHED)
      socket.off(WS_SERVER_EVENTS.ERROR)
      socket.off(WS_SERVER_EVENTS.ACK)

      socket.on(SOCKET_CONNECTION_EVENTS.CONNECT, () => {
        this.connected = true
        appStore.setSocketStatus('connected')
      })

      socket.on(SOCKET_CONNECTION_EVENTS.DISCONNECT, () => {
        this.connected = false
        appStore.setSocketStatus('disconnected')
      })

      socket.on(SOCKET_CONNECTION_EVENTS.CONNECT_ERROR, (payload) => {
        this.connected = false
        appStore.setSocketStatus('error')
        appStore.pushNotification({
          type: 'error',
          title: '实时连接失败',
          description: payload.message
        })
      })

      socket.on(WS_SERVER_EVENTS.ROOM_SNAPSHOT, (payload) => {
        this.syncRoomSnapshot(payload)
      })

      socket.on(WS_SERVER_EVENTS.ROOM_STATE_UPDATED, () => {
        try {
          socket.emit(WS_CLIENT_EVENTS.ROOM_SNAPSHOT_GET, {
            reason: 'manual'
          })
        } catch {
          // Ignore transient snapshot refresh failures.
        }
      })

      socket.on(WS_SERVER_EVENTS.CHAT_MESSAGE, (payload) => {
        chatStore.receiveMessage(roomCode, payload)
      })

      socket.on(WS_SERVER_EVENTS.GAME_QUESTION_CREATED, () => {
        gameStore.receiveSystemEvent('收到新的正式提问。')
      })

      socket.on(WS_SERVER_EVENTS.GAME_ANSWER_CREATED, () => {
        gameStore.receiveSystemEvent('主持人已回答问题。')
      })

      socket.on(WS_SERVER_EVENTS.GAME_REVEALED, () => {
        gameStore.receiveSystemEvent('房主已公布答案。')
      })

      socket.on(WS_SERVER_EVENTS.GAME_FINISHED, () => {
        gameStore.receiveSystemEvent('本局游戏已结束。')
      })

      socket.on(WS_SERVER_EVENTS.ERROR, (payload) => {
        appStore.pushNotification({
          type: 'error',
          title: '房间操作失败',
          description: payload.message
        })
      })

      socket.on(WS_SERVER_EVENTS.ACK, (payload) => {
        if (payload.message === 'connected' && authStore.currentUserName) {
          appStore.pushNotification({
            type: 'success',
            title: '已进入房间',
            description: `欢迎来到 ${this.currentRoom?.name ?? roomCode}。`
          })
        }
      })

      appStore.setSocketStatus('connecting')
      await connectSocket({
        roomCode,
        ticket: ticket.ticket,
        websocketPath: ticket.websocketPath
      })
    },

    resetState() {
      disconnectSocket()
      this.rooms = []
      this.currentRoom = null
      this.lobbyFilters = {
        keyword: '',
        mode: 'all',
        status: 'all'
      }
      this.loading = false
      this.joining = false
      this.connected = false
      this.lastSyncedAt = null
    }
  }
})
