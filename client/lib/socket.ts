import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

const SOCKET_URL = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SOCKET_URL)
  ? process.env.NEXT_PUBLIC_SOCKET_URL
  : 'http://localhost:3001'

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

