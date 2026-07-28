import { io, type Socket } from 'socket.io-client';

export function getSocketUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return (
    (typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL
      : undefined) ?? 'http://localhost:3001'
  );
}

let socket: Socket | null = null;

/** Socket.IO client dùng chung cho chat real-time (US-14). Tự reconnect theo AC2. */
export function getSocket(accessToken: string): Socket {
  if (!socket) {
    socket = io(getSocketUrl(), {
      auth: { token: accessToken },
      // WebSocket trước, fallback về polling nếu WS bị chặn
      transports: ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
