import { SOCKET_CONNECTION_EVENTS } from './events'
import type {
  DisconnectEventPayload,
  SocketErrorPayload,
  SocketEventHandlerMap,
  SocketStoreBindings
} from './types'

export function createSocketEventHandlers(bindings: SocketStoreBindings): SocketEventHandlerMap {
  return {
    [SOCKET_CONNECTION_EVENTS.CONNECT]: () => {
      bindings.app?.onConnected?.()
    },
    [SOCKET_CONNECTION_EVENTS.DISCONNECT]: (payload) => {
      bindings.app?.onDisconnected?.(payload as DisconnectEventPayload)
    },
    [SOCKET_CONNECTION_EVENTS.CONNECT_ERROR]: (payload) => {
      bindings.app?.onError?.(payload as SocketErrorPayload)
    }
  }
}
