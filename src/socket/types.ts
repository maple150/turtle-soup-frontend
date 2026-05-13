import { SOCKET_CONNECTION_EVENTS, WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from './events'

export interface WsEnvelope<TEvent extends string = string, TData = unknown> {
  event: TEvent
  data: TData
  ts: number
  reqId?: string
}

export interface SocketConnectOptions {
  roomCode: string
  ticket: string
  websocketPath?: string
}

export interface ConnectEventPayload {
  roomCode: string
  userId: string
  nickname: string
  role: 'host' | 'player' | 'spectator'
}

export interface DisconnectEventPayload {
  code?: number
  reason?: string
}

export interface SocketErrorPayload {
  message: string
  reqId?: string
}

export interface WsRoomMemberPayload {
  userId: string
  nickname: string
  role: 'host' | 'player' | 'spectator'
  online: boolean
  connectedAt: number
  lastSeenAt: number
}

export interface WsChatMessagePayload {
  id: string
  roomId: string
  senderUserId: string
  senderNickname: string
  content: string
  kind: 'chat' | 'system'
  createdAt: number
}

export interface WsQuestionPayload {
  id: string
  roomId: string
  roundId: string
  askerUserId: string
  askerNickname: string
  questionText: string
  answerType: 'yes' | 'no' | 'irrelevant' | null
  answerText: string | null
  answeredByUserId: string | null
  answeredByNickname: string | null
  askedAt: number
  answeredAt: number | null
  ordinal: number
}

export interface WsRoomSnapshotPayload {
  id: string
  roomCode: string
  name: string
  description: string
  mode: 'casual' | 'ranked' | 'private'
  status: 'waiting' | 'playing' | 'revealed' | 'finished'
  hostUserId: string
  hostNickname: string
  capacity: number
  createdAt: number
  updatedAt: number
  settings: {
    allowSpectators: boolean
    isPrivate: boolean
    maxQuestionsPerRound: number
  }
  members: WsRoomMemberPayload[]
  onlineCount: number
  currentSoup: {
    id: string
    title: string
    subtitle: string | null
    description: string
    difficulty: 'easy' | 'medium' | 'hard'
    answer?: string | null
  } | null
  currentRound: {
    id: string
    roomId: string
    soupId: string | null
    hostUserId: string
    state: 'waiting' | 'playing' | 'revealed' | 'finished'
    startedAt: number
    endedAt: number | null
    answerRevealed: boolean
  } | null
  questions: WsQuestionPayload[]
  chatMessages: WsChatMessagePayload[]
  gameState: 'waiting' | 'playing' | 'revealed' | 'finished'
}

export interface WsGameStateUpdatedPayload {
  gameState: 'waiting' | 'playing' | 'revealed' | 'finished'
  currentRound: WsRoomSnapshotPayload['currentRound']
  currentSoup: WsRoomSnapshotPayload['currentSoup']
}

export interface WsGameRevealPayload {
  currentRound: WsRoomSnapshotPayload['currentRound']
  currentSoup: WsRoomSnapshotPayload['currentSoup']
}

export interface ClientToServerEvents {
  [WS_CLIENT_EVENTS.HELLO]: { roomCode: string }
  [WS_CLIENT_EVENTS.PING]: { at?: number }
  [WS_CLIENT_EVENTS.ROOM_SNAPSHOT_GET]: { reason?: 'initial' | 'reconnect' | 'manual' }
  [WS_CLIENT_EVENTS.CHAT_SEND]: { content: string }
  [WS_CLIENT_EVENTS.GAME_START]: Record<string, never>
  [WS_CLIENT_EVENTS.GAME_QUESTION_SEND]: { content: string }
  [WS_CLIENT_EVENTS.GAME_ANSWER_SEND]: {
    questionId: string
    answerType: 'yes' | 'no' | 'irrelevant'
    answerText: string
  }
  [WS_CLIENT_EVENTS.GAME_REVEAL]: Record<string, never>
  [WS_CLIENT_EVENTS.GAME_FINISH]: Record<string, never>
}

export interface ServerToClientEvents {
  [SOCKET_CONNECTION_EVENTS.CONNECT]: ConnectEventPayload
  [SOCKET_CONNECTION_EVENTS.DISCONNECT]: DisconnectEventPayload
  [SOCKET_CONNECTION_EVENTS.CONNECT_ERROR]: SocketErrorPayload
  [WS_SERVER_EVENTS.CONNECTED]: ConnectEventPayload
  [WS_SERVER_EVENTS.PONG]: { ok: true }
  [WS_SERVER_EVENTS.ACK]: { message: string }
  [WS_SERVER_EVENTS.ERROR]: SocketErrorPayload
  [WS_SERVER_EVENTS.ROOM_SNAPSHOT]: WsRoomSnapshotPayload
  [WS_SERVER_EVENTS.ROOM_MEMBER_JOINED]: {
    roomCode: string
    member?: WsRoomMemberPayload
  }
  [WS_SERVER_EVENTS.ROOM_MEMBER_LEFT]: {
    roomCode: string
    userId: string
  }
  [WS_SERVER_EVENTS.ROOM_STATE_UPDATED]: {
    roomCode: string
    status: 'waiting' | 'playing' | 'revealed' | 'finished'
    gameState: 'waiting' | 'playing' | 'revealed' | 'finished'
    onlineCount: number
    updatedAt: number
  }
  [WS_SERVER_EVENTS.CHAT_MESSAGE]: WsChatMessagePayload
  [WS_SERVER_EVENTS.GAME_STATE_UPDATED]: WsGameStateUpdatedPayload
  [WS_SERVER_EVENTS.GAME_QUESTION_CREATED]: WsQuestionPayload
  [WS_SERVER_EVENTS.GAME_ANSWER_CREATED]: WsQuestionPayload
  [WS_SERVER_EVENTS.GAME_REVEALED]: WsGameRevealPayload
  [WS_SERVER_EVENTS.GAME_FINISHED]: {
    roomCode: string
    currentRound: WsRoomSnapshotPayload['currentRound']
  }
}

export type SocketEventName = keyof ServerToClientEvents
export type SocketListener<T = unknown> = (payload: T) => void
export type SocketEventHandlerMap = Partial<Record<SocketEventName, SocketListener>>

export interface AppSocket {
  readonly connected: boolean
  connect: (options: SocketConnectOptions) => Promise<void>
  disconnect: () => void
  emit: <T extends keyof ClientToServerEvents>(event: T, payload: ClientToServerEvents[T]) => void
  on: <T extends keyof ServerToClientEvents>(event: T, handler: SocketListener<ServerToClientEvents[T]>) => void
  off: <T extends keyof ServerToClientEvents>(event: T, handler?: SocketListener<ServerToClientEvents[T]>) => void
}

export interface SocketStoreBindings {
  app?: {
    onConnected?: () => void
    onDisconnected?: (payload: DisconnectEventPayload) => void
    onError?: (payload: SocketErrorPayload) => void
  }
}
