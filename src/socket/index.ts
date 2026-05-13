import { SOCKET_CONNECTION_EVENTS, WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from './events'
import type {
  AppSocket,
  ClientToServerEvents,
  DisconnectEventPayload,
  ServerToClientEvents,
  SocketConnectOptions,
  SocketEventName,
  SocketListener,
  WsEnvelope
} from './types'

function buildWsUrl(roomCode: string, ticket: string, websocketPath?: string) {
  if (websocketPath) {
    if (/^wss?:\/\//.test(websocketPath)) {
      return websocketPath
    }

    if (/^https?:\/\//.test(websocketPath)) {
      const parsed = new URL(websocketPath)
      parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
      return parsed.toString()
    }
  }

  const base = import.meta.env.VITE_API_BASE_URL || '/api'

  if (/^https?:\/\//.test(base)) {
    const parsed = new URL(base)
    parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
    parsed.pathname = `/ws/rooms/${roomCode}`
    parsed.search = `ticket=${encodeURIComponent(ticket)}`
    return parsed.toString()
  }

  const url = new URL(window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = `/ws/rooms/${roomCode}`
  url.search = `ticket=${encodeURIComponent(ticket)}`
  return url.toString()
}

class SocketManager implements AppSocket {
  private socket: WebSocket | null = null
  private listeners = new Map<SocketEventName, Set<SocketListener>>()
  private activeRoomCode: string | null = null

  get connected() {
    return this.socket?.readyState === WebSocket.OPEN
  }

  async connect(options: SocketConnectOptions) {
    if (this.connected && this.activeRoomCode === options.roomCode) {
      return
    }

    this.disconnect()

    const url = buildWsUrl(options.roomCode, options.ticket, options.websocketPath)

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url)
      this.socket = socket
      this.activeRoomCode = options.roomCode

      socket.addEventListener(
        'open',
        () => {
          this.dispatch(SOCKET_CONNECTION_EVENTS.CONNECT, {
            roomCode: options.roomCode,
            userId: '',
            nickname: '',
            role: 'player'
          })
          this.emit(WS_CLIENT_EVENTS.HELLO, {
            roomCode: options.roomCode
          })
          this.emit(WS_CLIENT_EVENTS.ROOM_SNAPSHOT_GET, {
            reason: 'initial'
          })
          resolve()
        },
        { once: true }
      )

      socket.addEventListener('message', (event) => {
        try {
          const envelope = JSON.parse(String(event.data)) as WsEnvelope<keyof ServerToClientEvents>
          this.dispatch(envelope.event, envelope.data as ServerToClientEvents[keyof ServerToClientEvents])
        } catch {
          this.dispatch(SOCKET_CONNECTION_EVENTS.CONNECT_ERROR, {
            message: '无法解析实时消息'
          })
        }
      })

      socket.addEventListener('close', (event) => {
        this.handleClose({
          code: event.code,
          reason: event.reason
        })
      })

      socket.addEventListener('error', () => {
        this.dispatch(SOCKET_CONNECTION_EVENTS.CONNECT_ERROR, {
          message: '实时连接失败'
        })
        reject(new Error('实时连接失败'))
      })
    })
  }

  disconnect() {
    if (!this.socket) {
      return
    }

    const active = this.socket
    this.socket = null
    this.activeRoomCode = null

    if (active.readyState === WebSocket.OPEN || active.readyState === WebSocket.CONNECTING) {
      active.close(1000, 'manual disconnect')
    }
  }

  emit<T extends keyof ClientToServerEvents>(event: T, payload: ClientToServerEvents[T]) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('实时连接未建立')
    }

    const envelope: WsEnvelope<T, ClientToServerEvents[T]> = {
      event,
      data: payload,
      ts: Date.now(),
      reqId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }

    this.socket.send(JSON.stringify(envelope))
  }

  on<T extends keyof ServerToClientEvents>(event: T, handler: SocketListener<ServerToClientEvents[T]>) {
    const listeners = this.listeners.get(event) ?? new Set<SocketListener>()
    listeners.add(handler as SocketListener)
    this.listeners.set(event, listeners)
  }

  off<T extends keyof ServerToClientEvents>(event: T, handler?: SocketListener<ServerToClientEvents[T]>) {
    if (!handler) {
      this.listeners.delete(event)
      return
    }

    const listeners = this.listeners.get(event)
    listeners?.delete(handler as SocketListener)

    if (listeners && listeners.size === 0) {
      this.listeners.delete(event)
    }
  }

  private dispatch(event: string, payload: unknown) {
    const listeners = this.listeners.get(event as SocketEventName)

    if (!listeners) {
      return
    }

    for (const listener of listeners) {
      listener(payload)
    }
  }

  private handleClose(payload: DisconnectEventPayload) {
    this.socket = null
    this.activeRoomCode = null
    this.dispatch(SOCKET_CONNECTION_EVENTS.DISCONNECT, payload)
  }
}

export const socketManager = new SocketManager()

export function getSocket() {
  return socketManager
}

export function connectSocket(options: SocketConnectOptions) {
  return socketManager.connect(options)
}

export function disconnectSocket() {
  socketManager.disconnect()
}

export function reconnectSocket(options: SocketConnectOptions) {
  socketManager.disconnect()
  return socketManager.connect(options)
}

export * from './events'
export * from './handlers'
export * from './types'
