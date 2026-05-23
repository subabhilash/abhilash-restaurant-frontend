import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://127.0.0.1:8099";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
    reconnectionDelayMax: 10000,
  });

  socket.on("connect", () => console.info("[Socket] connected:", socket?.id));
  socket.on("disconnect", (reason) => console.info("[Socket] disconnected:", reason));
  socket.on("connect_error", (err) => console.warn("[Socket] error:", err.message));

  socket.connect();
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinOrderRoom(orderId: number) {
  socket?.emit("join_order", { order_id: orderId });
}

// ── Typed events ──────────────────────────────────────────────────────────────

export type SocketEvent =
  | "order.created"
  | "order.status_changed";

export interface OrderCreatedPayload {
  order_id: number;
  order_number: string;
}

export interface OrderStatusChangedPayload {
  order_id: number;
  status: string;
}

export function onSocketEvent<T>(event: SocketEvent, cb: (data: T) => void): () => void {
  if (!socket) return () => {};
  socket.on(event, cb);
  return () => socket?.off(event, cb);
}
