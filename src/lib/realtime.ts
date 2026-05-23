import { EventEmitter } from "events";

export interface RealtimeEvent<T = unknown> {
  type: string;
  payload: T;
}

const globalEmitter = globalThis as typeof globalThis & {
  __kinsousEmitter?: EventEmitter;
};

const emitter = globalEmitter.__kinsousEmitter ?? new EventEmitter();
emitter.setMaxListeners(200);
globalEmitter.__kinsousEmitter = emitter;

export function publishConversationEvent<T>(conversationId: string, event: RealtimeEvent<T>) {
  emitter.emit(`conversation:${conversationId}`, event);
}

export function publishUserEvent<T>(userId: string, event: RealtimeEvent<T>) {
  emitter.emit(`user:${userId}`, event);
}

export function subscribeConversation<T>(
  conversationId: string,
  handler: (event: RealtimeEvent<T>) => void
) {
  const key = `conversation:${conversationId}`;
  emitter.on(key, handler as (event: RealtimeEvent) => void);
  return () => emitter.off(key, handler as (event: RealtimeEvent) => void);
}

export function subscribeUser<T>(userId: string, handler: (event: RealtimeEvent<T>) => void) {
  const key = `user:${userId}`;
  emitter.on(key, handler as (event: RealtimeEvent) => void);
  return () => emitter.off(key, handler as (event: RealtimeEvent) => void);
}
