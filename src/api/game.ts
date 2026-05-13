export type GamePhase = 'idle' | 'waiting' | 'playing' | 'revealed' | 'finished'

export interface ScoreboardItem {
  userId: string
  nickname: string
  score: number
}

export interface GameActionRecord {
  id: string
  roomId: string
  actorId: string
  actorName: string
  type: 'system'
  content: string
  createdAt: string
}
