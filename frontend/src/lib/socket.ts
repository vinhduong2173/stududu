import { io, type Socket } from 'socket.io-client';

function getSocketUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      return window.location.origin;
    }
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
}

let socket: Socket | null = null;

/** Socket.IO client dùng chung cho chat real-time (US-14). Tự reconnect theo AC2. */
export function getSocket(accessToken: string): Socket {
  if (!socket) {
    socket = io(getSocketUrl(), {
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
