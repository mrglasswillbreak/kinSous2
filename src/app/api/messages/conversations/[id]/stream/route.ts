import { getSession } from "@/lib/auth";
import {
  getConversationForUser,
  getPresenceForUsers,
  listTypingForConversation,
} from "@/lib/db";
import { subscribeConversation } from "@/lib/realtime";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return new Response("Not authenticated", { status: 401 });
  }

  const { id } = await params;
  const conversation = await getConversationForUser(id, session.userId);
  if (!conversation) {
    return new Response("Conversation not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: { type: string; payload: unknown }) => {
        controller.enqueue(
          encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`)
        );
      };

      Promise.all([
        listTypingForConversation(id),
        getPresenceForUsers(conversation.participants.map((p) => p.id)),
      ])
        .then(([typing, presence]) => {
          send({
            type: "typing",
            payload: typing.map((t) => ({
              userId: t.user_id,
              isTyping: t.is_typing,
              updatedAt: t.updated_at,
            })),
          });
          send({
            type: "presence",
            payload: presence.map((p) => ({
              userId: p.user_id,
              status: p.status,
              lastSeen: p.last_seen,
            })),
          });
        })
        .catch(() => {
          // ignore init errors
        });

      const unsubscribe = subscribeConversation(id, send);
      const heartbeat = setInterval(() => send({ type: "ping", payload: Date.now() }), 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
