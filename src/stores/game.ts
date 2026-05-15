import { defineStore } from 'pinia'

import { ANSWER_TYPE_LABELS, GAME_PHASE_LABELS } from '@/constants/labels'
import type { WsGameStateUpdatedPayload, WsQuestionPayload } from '@/socket/types'
import { WS_CLIENT_EVENTS } from '@/socket/events'
import { getSocket } from '@/services/socket'

export type GamePhase = 'idle' | 'waiting' | 'playing' | 'revealed' | 'finished'

export interface FormalQuestion {
  id: string
  roomId: string
  senderId: string
  senderName: string
  content: string
  status: 'pending' | 'answered'
  createdAt: string
  answeredAt: string | null
}

export interface AnswerRecord {
  id: string
  roomId: string
  questionId: string
  responderName: string
  outcome: 'yes' | 'no' | 'irrelevant'
  content: string
  createdAt: string
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

interface GameState {
  currentRoomCode: string | null
  phase: GamePhase
  currentRound: number
  totalRounds: number
  timerSeconds: number
  soupTitle: string
  prompt: string
  hostHint: string
  questionList: FormalQuestion[]
  answerRecords: AnswerRecord[]
  actionHistory: GameActionRecord[]
  loading: boolean
  connected: boolean
  lastEventAt: string | null
}

function formatTimestamp(value: number | null) {
  return value ? new Date(value).toISOString() : null
}

function normalizeSoupTitle(value?: string | null) {
  if (!value || value === 'Unassigned Soup') {
    return '待选择题目'
  }

  return value
}

function normalizeSoupPrompt(value?: string | null) {
  if (!value || value === 'Host has not assigned a soup yet.') {
    return '房主还没有为本局选择题目。'
  }

  return value
}

function mapQuestionPayload(question: WsQuestionPayload): FormalQuestion {
  return {
    id: question.id,
    roomId: question.roomId,
    senderId: question.askerUserId,
    senderName: question.askerNickname,
    content: question.questionText,
    status: question.answerType ? 'answered' : 'pending',
    createdAt: new Date(question.askedAt).toISOString(),
    answeredAt: formatTimestamp(question.answeredAt)
  }
}

function mapAnswerPayload(question: WsQuestionPayload): AnswerRecord | null {
  if (!question.answerType || !question.answerText || !question.answeredByNickname || !question.answeredAt) {
    return null
  }

  return {
    id: `answer-${question.id}`,
    roomId: question.roomId,
    questionId: question.id,
    responderName: question.answeredByNickname,
    outcome: question.answerType,
    content: question.answerText,
    createdAt: new Date(question.answeredAt).toISOString()
  }
}

function createOptimisticQuestion(payload: {
  roomId: string
  senderId: string
  senderName: string
  content: string
}): FormalQuestion {
  return {
    id: `temp-question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    roomId: payload.roomId,
    senderId: payload.senderId,
    senderName: payload.senderName,
    content: payload.content,
    status: 'pending',
    createdAt: new Date().toISOString(),
    answeredAt: null
  }
}

function isOptimisticQuestionMatch(question: FormalQuestion, payload: WsQuestionPayload) {
  if (!question.id.startsWith('temp-question-')) {
    return false
  }

  if (question.roomId !== payload.roomId) {
    return false
  }

  if (question.senderId !== payload.askerUserId) {
    return false
  }

  if (question.content !== payload.questionText) {
    return false
  }

  return Math.abs(new Date(question.createdAt).getTime() - payload.askedAt) <= 15000
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    currentRoomCode: null,
    phase: 'idle',
    currentRound: 0,
    totalRounds: 1,
    timerSeconds: 0,
    soupTitle: '',
    prompt: '',
    hostHint: 'AI 主持人会根据题面自动回答正式提问，公布答案与结束游戏仍由房主决定。',
    questionList: [],
    answerRecords: [],
    actionHistory: [],
    loading: false,
    connected: false,
    lastEventAt: null
  }),

  getters: {
    phaseLabel: (state) => GAME_PHASE_LABELS[state.phase],
    pendingQuestions: (state) => state.questionList.filter((item) => item.status === 'pending')
  },

  actions: {
    initializeForRoom(roomCode: string) {
      this.currentRoomCode = roomCode
      this.connected = true
    },

    applyRoomSnapshot(snapshot: {
      roomCode: string
      status: 'waiting' | 'playing' | 'revealed' | 'finished'
      currentSoup: {
        title: string
        description: string
      } | null
      currentRound: {
        id: string
      } | null
      questions: Array<{
        id: string
        roomId: string
        askerUserId: string
        askerNickname: string
        questionText: string
        answerType: 'yes' | 'no' | 'irrelevant' | null
        answerText: string | null
        answeredByNickname: string | null
        askedAt: number
        answeredAt: number | null
        ordinal: number
      }>
      gameState: 'waiting' | 'playing' | 'revealed' | 'finished'
    }) {
      this.currentRoomCode = snapshot.roomCode
      this.phase = snapshot.gameState
      this.currentRound = snapshot.currentRound ? 1 : 0
      this.totalRounds = 1
      this.soupTitle = normalizeSoupTitle(snapshot.currentSoup?.title)
      this.prompt = normalizeSoupPrompt(snapshot.currentSoup?.description ?? '房主还没有开始本局游戏。')
      this.questionList = snapshot.questions.map((question) => ({
        id: question.id,
        roomId: question.roomId,
        senderId: question.askerUserId,
        senderName: question.askerNickname,
        content: question.questionText,
        status: question.answerType ? 'answered' : 'pending',
        createdAt: new Date(question.askedAt).toISOString(),
        answeredAt: formatTimestamp(question.answeredAt)
      }))
      this.answerRecords = snapshot.questions
        .filter((question) => question.answerType && question.answerText && question.answeredByNickname)
        .map((question) => ({
          id: `answer-${question.id}`,
          roomId: question.roomId,
          questionId: question.id,
          responderName: question.answeredByNickname as string,
          outcome: question.answerType as 'yes' | 'no' | 'irrelevant',
          content: question.answerText as string,
          createdAt: new Date(question.answeredAt as number).toISOString()
        }))
      this.lastEventAt = new Date().toISOString()
    },

    receiveSystemEvent(message: string) {
      this.actionHistory = [
        ...this.actionHistory,
        {
          id: `event-${Date.now()}`,
          roomId: this.currentRoomCode ?? '',
          actorId: 'system',
          actorName: '系统',
          type: 'system',
          content: message,
          createdAt: new Date().toISOString()
        }
      ]
      this.lastEventAt = new Date().toISOString()
    },

    receiveQuestion(question: WsQuestionPayload) {
      const nextQuestion = mapQuestionPayload(question)
      const optimisticIndex = this.questionList.findIndex((item) => isOptimisticQuestionMatch(item, question))
      const exists = this.questionList.some((item) => item.id === nextQuestion.id)

      if (optimisticIndex >= 0) {
        this.questionList = this.questionList.map((item, index) => (index === optimisticIndex ? nextQuestion : item))
      } else if (exists) {
        this.questionList = this.questionList.map((item) => (item.id === nextQuestion.id ? nextQuestion : item))
      } else {
        this.questionList = [...this.questionList, nextQuestion]
      }

      this.questionList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      this.lastEventAt = new Date().toISOString()
    },

    receiveAnswer(question: WsQuestionPayload) {
      const nextQuestion = mapQuestionPayload(question)
      const nextAnswer = mapAnswerPayload(question)

      this.questionList = this.questionList.some((item) => item.id === nextQuestion.id)
        ? this.questionList.map((item) => (item.id === nextQuestion.id ? nextQuestion : item))
        : [...this.questionList, nextQuestion]

      if (nextAnswer) {
        this.answerRecords = this.answerRecords.some((item) => item.questionId === nextAnswer.questionId)
          ? this.answerRecords.map((item) => (item.questionId === nextAnswer.questionId ? nextAnswer : item))
          : [...this.answerRecords, nextAnswer]
      }

      this.answerRecords.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      this.lastEventAt = new Date().toISOString()
    },

    applyRealtimeGameState(payload: WsGameStateUpdatedPayload) {
      this.phase = payload.gameState
      this.currentRound = payload.currentRound ? 1 : 0
      this.totalRounds = 1
      this.soupTitle = normalizeSoupTitle(payload.currentSoup?.title)
      this.prompt = normalizeSoupPrompt(
        payload.currentSoup?.description ?? (this.prompt || '房主还没有开始本局游戏。')
      )
      this.lastEventAt = new Date().toISOString()
    },

    markGameFinished() {
      this.phase = 'finished'
      this.lastEventAt = new Date().toISOString()
    },

    async startGame() {
      this.loading = true

      try {
        getSocket().emit(WS_CLIENT_EVENTS.GAME_START, {})
      } finally {
        this.loading = false
      }
    },

    async submitQuestion(payload: { content: string; roomId: string; senderId: string; senderName: string }) {
      this.loading = true

      try {
        const optimisticQuestion = createOptimisticQuestion({
          roomId: payload.roomId,
          senderId: payload.senderId,
          senderName: payload.senderName,
          content: payload.content
        })

        this.questionList = [...this.questionList, optimisticQuestion]
        this.questionList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        this.lastEventAt = new Date().toISOString()

        try {
          getSocket().emit(WS_CLIENT_EVENTS.GAME_QUESTION_SEND, {
            content: payload.content
          })
        } catch (error) {
          this.questionList = this.questionList.filter((item) => item.id !== optimisticQuestion.id)
          this.lastEventAt = new Date().toISOString()
          throw error
        }
      } finally {
        this.loading = false
      }
    },

    async respondToQuestion(payload: {
      questionId: string
      outcome: AnswerRecord['outcome']
      content: string
    }) {
      this.loading = true

      try {
        getSocket().emit(WS_CLIENT_EVENTS.GAME_ANSWER_SEND, {
          questionId: payload.questionId,
          answerType: payload.outcome,
          answerText: payload.content
        })
      } finally {
        this.loading = false
      }
    },

    async finishGame() {
      this.loading = true

      try {
        getSocket().emit(WS_CLIENT_EVENTS.GAME_FINISH, {})
      } finally {
        this.loading = false
      }
    },

    answerTemplate(outcome: AnswerRecord['outcome']) {
      const templates: Record<AnswerRecord['outcome'], string> = {
        yes: `是。${ANSWER_TYPE_LABELS.yes}，这个方向很关键。`,
        no: `否。${ANSWER_TYPE_LABELS.no}，这条线索不是核心。`,
        irrelevant: `无关。${ANSWER_TYPE_LABELS.irrelevant}，关键点不在这里。`
      }

      return templates[outcome]
    },

    resetState() {
      this.currentRoomCode = null
      this.phase = 'idle'
      this.currentRound = 0
      this.totalRounds = 1
      this.timerSeconds = 0
      this.soupTitle = ''
      this.prompt = ''
      this.hostHint = 'AI 主持人会根据题面自动回答正式提问，公布答案与结束游戏仍由房主决定。'
      this.questionList = []
      this.answerRecords = []
      this.actionHistory = []
      this.loading = false
      this.connected = false
      this.lastEventAt = null
    }
  }
})
