import request, {
  type ApiResponse,
  type PaginatedData,
  type PaginationParams
} from './request'

export type RoomMode = 'casual' | 'ranked' | 'private'
export type RoomStatus = 'waiting' | 'playing' | 'revealed' | 'finished'
export type RoomRole = 'host' | 'player' | 'spectator'

export interface RoomSettings {
  allowSpectators: boolean
  isPrivate: boolean
  maxQuestionsPerRound: number
}

export interface RoomSummary {
  id: string
  roomCode: string
  name: string
  description: string
  mode: RoomMode
  status: RoomStatus
  hostUserId: string
  hostNickname: string
  capacity: number
  settings?: RoomSettings
  currentRoundId?: string | null
  currentSoupId?: string | null
  createdAt: number
  updatedAt: number
  startedAt?: number | null
  endedAt?: number | null
}

export interface RoomMember {
  userId: string
  nickname: string
  role: RoomRole
  online: boolean
  connectedAt: number
  lastSeenAt: number
}

export interface RoomSnapshot extends RoomSummary {
  members: RoomMember[]
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
    state: RoomStatus
    startedAt: number
    endedAt: number | null
    answerRevealed: boolean
  } | null
  questions: Array<{
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
  }>
  chatMessages: Array<{
    id: string
    roomId: string
    senderUserId: string
    senderNickname: string
    content: string
    kind: 'chat' | 'system'
    createdAt: number
  }>
  gameState: RoomStatus
}

export interface RoomListParams extends PaginationParams {
  keyword?: string
  mode?: RoomMode
  status?: RoomStatus
}

export interface CreateRoomParams {
  name: string
  description: string
  mode: RoomMode
  capacity: number
  isPrivate?: boolean
  allowSpectators?: boolean
  maxQuestionsPerRound?: number
}

export interface JoinRoomParams {
  nickname?: string
}

export interface JoinRoomResult {
  room: RoomSummary
  member: {
    userId: string
    nickname: string
    role: RoomRole
  }
}

export interface LeaveRoomResult {
  roomCode: string
  left: boolean
}

export interface WsTicketResult {
  ticket: string
  roomCode: string
  expiresIn: number
  websocketPath: string
}

export function getRoomList(params?: RoomListParams) {
  return request.get<ApiResponse<PaginatedData<RoomSummary>>>('/rooms', {
    params
  })
}

export function getRoomDetail(roomCode: string) {
  return request.get<ApiResponse<RoomSummary>>(`/rooms/${roomCode}`)
}

export function createRoom(params: CreateRoomParams) {
  return request.post<ApiResponse<RoomSummary>>('/rooms', {
    allowSpectators: true,
    isPrivate: false,
    maxQuestionsPerRound: 20,
    ...params
  })
}

export function joinRoom(roomCode: string, params?: JoinRoomParams) {
  return request.post<ApiResponse<JoinRoomResult>>(`/rooms/${roomCode}/join`, params)
}

export function leaveRoom(roomCode: string) {
  return request.post<ApiResponse<LeaveRoomResult>>(`/rooms/${roomCode}/leave`)
}

export function createRoomWsTicket(roomCode: string) {
  return request.post<ApiResponse<WsTicketResult>>(`/rooms/${roomCode}/ws-ticket`)
}
