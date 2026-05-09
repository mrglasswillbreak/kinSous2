"use client";

import ChatThread from "@/components/messages/ChatThread";
import { useParams } from "next/navigation";

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  return <ChatThread conversationId={params.id} />;
}
