"use client";

import ChatThread from "@/components/messages/ChatThread";
import { use } from "react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ConversationPage({ params }: Props) {
  const { id } = use(params);
  return <ChatThread conversationId={id} />;
}
