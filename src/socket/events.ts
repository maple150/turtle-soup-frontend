export const SOCKET_CONNECTION_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error'
} as const

export const WS_CLIENT_EVENTS = {
  HELLO: 'system.hello',
  PING: 'system.ping',
  ROOM_SNAPSHOT_GET: 'room.snapshot.get',
  CHAT_SEND: 'chat.send',
  GAME_START: 'game.start',
  GAME_QUESTION_SEND: 'game.question.send',
  GAME_ANSWER_SEND: 'game.answer.send',
  GAME_REVEAL: 'game.reveal',
  GAME_FINISH: 'game.finish'
} as const

export const WS_SERVER_EVENTS = {
  CONNECTED: 'system.connected',
  PONG: 'system.pong',
  ACK: 'system.ack',
  ERROR: 'system.error',
  ROOM_SNAPSHOT: 'room.snapshot',
  ROOM_MEMBER_JOINED: 'room.member.joined',
  ROOM_MEMBER_LEFT: 'room.member.left',
  ROOM_STATE_UPDATED: 'room.state.updated',
  CHAT_MESSAGE: 'chat.message',
  GAME_STATE_UPDATED: 'game.state.updated',
  GAME_QUESTION_CREATED: 'game.question.created',
  GAME_ANSWER_CREATED: 'game.answer.created',
  GAME_REVEALED: 'game.revealed',
  GAME_FINISHED: 'game.finished'
} as const

export const SOCKET_EVENTS = {
  ...SOCKET_CONNECTION_EVENTS,
  ...WS_CLIENT_EVENTS,
  ...WS_SERVER_EVENTS
} as const
