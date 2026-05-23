"use client";

import MessagesShell from "@/components/messages/MessagesShell";
import { useParams } from "next/navigation";

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  return <MessagesShell conversationId={params.id} />;
}
