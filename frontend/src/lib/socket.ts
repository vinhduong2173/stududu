import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

/** Socket.IO client dùng chung cho chat real-time (US-14). Tự reconnect theo AC2. */
export function getSocket(accessToken: string): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
