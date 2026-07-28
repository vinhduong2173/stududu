import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** Socket.IO client dùng chung cho chat real-time (US-14). Tự reconnect theo AC2. */
export function getSocket(accessToken: string): Socket {
  if (!socket) {
    const socketUrl = typeof window !== 'undefined'
      ? `http://${window.location.hostname}:3001`
      : (process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001');

    socket = io(socketUrl, {
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
