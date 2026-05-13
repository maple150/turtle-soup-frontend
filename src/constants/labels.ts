export const APP_TITLE = '酒馆'

export const APP_SUBTITLE = '多人海龟汤在线推理'

export const ROOM_STATUS_LABELS = {
  waiting: '等待中',
  playing: '游戏中',
  revealed: '已公布答案',
  finished: '已结束'
} as const

export const ROOM_MODE_LABELS = {
  casual: '休闲',
  ranked: '竞技',
  private: '私密'
} as const

export const ROOM_ROLE_LABELS = {
  host: '房主',
  player: '玩家',
  spectator: '旁观'
} as const

export const GAME_PHASE_LABELS = {
  idle: '未开始',
  waiting: '等待中',
  playing: '游戏中',
  revealed: '已公布答案',
  finished: '已结束'
} as const

export const ANSWER_TYPE_LABELS = {
  yes: '是',
  no: '否',
  irrelevant: '无关'
} as const

export const QUESTION_STATUS_LABELS = {
  pending: '待回答',
  answered: '已回答'
} as const

export const SOCKET_STATUS_LABELS = {
  idle: '未连接',
  connecting: '连接中',
  connected: '已连接',
  disconnected: '已断开',
  error: '连接异常'
} as const
