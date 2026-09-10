import { get } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { sql, getConversationForUser } from "@/lib/db";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const rows = await sql`SELECT * FROM attachments WHERE id=${id}`;
  const attachment = rows[0];
  if (!attachment) return new Response("Not found", { status: 404 });
  const conversation = await getConversationForUser(
    attachment.conversation_id,
    session.userId,
  );
  if (
    !conversation ||
    conversation.blocked_by_me ||
    conversation.blocked_by_other
  )
    return new Response("Forbidden", { status: 403 });
  const blob = await get(attachment.pathname, {
    access: "private",
    useCache: false,
  });
  if (!blob || blob.statusCode !== 200)
    return new Response("Not found", { status: 404 });
  return new Response(blob.stream, {
    headers: {
      "Content-Type": attachment.content_type,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
