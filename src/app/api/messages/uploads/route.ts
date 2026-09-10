import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth";
import { getConversationForUser, sql, usingLocalDb } from "@/lib/db";
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (usingLocalDb() || !process.env.BLOB_READ_WRITE_TOKEN)
      return NextResponse.json(
        { error: "Private image storage is not configured" },
        { status: 503 },
      );
    const form = await req.formData();
    const file = form.get("file");
    const conversationId = form.get("conversationId");
    if (!(file instanceof File) || typeof conversationId !== "string")
      return NextResponse.json(
        { error: "Choose an image and conversation" },
        { status: 400 },
      );
    const conversation = await getConversationForUser(
      conversationId,
      session.userId,
    );
    if (
      !conversation ||
      conversation.blocked_by_me ||
      conversation.blocked_by_other
    )
      return NextResponse.json(
        { error: "Conversation unavailable" },
        { status: 403 },
      );
    if (file.size > 3 * 1024 * 1024 || file.size === 0)
      return NextResponse.json(
        { error: "Images must be between 1 byte and 3 MB" },
        { status: 400 },
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    const type = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "image/png"
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? "image/jpeg"
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
            bytes.toString("ascii", 8, 12) === "WEBP"
          ? "image/webp"
          : null;
    if (!type)
      return NextResponse.json(
        { error: "Use a PNG, JPEG or WebP image" },
        { status: 400 },
      );
    const id = randomUUID();
    const blob = await put("messages/" + id, bytes, {
      access: "private",
      contentType: type,
      addRandomSuffix: false,
    });
    try {
      await sql`INSERT INTO attachments(id,conversation_id,owner_id,pathname,content_type) VALUES(${id},${conversationId},${session.userId},${blob.pathname},${type})`;
    } catch (e) {
      await del(blob.pathname);
      throw e;
    }
    return NextResponse.json({ url: "/api/messages/uploads/" + id });
  } catch {
    return NextResponse.json(
      { error: "Upload failed. Please retry." },
      { status: 500 },
    );
  }
}
