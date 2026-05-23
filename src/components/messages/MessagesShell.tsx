"use client";

import ConversationList from "@/components/messages/ConversationList";
import ChatThread from "@/components/messages/ChatThread";

interface MessagesShellProps {
  conversationId?: string;
}

export default function MessagesShell({ conversationId }: MessagesShellProps) {
  const showListOnMobile = !conversationId;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-160px)] lg:h-[calc(100vh-140px)]">
        <div className={`lg:w-[360px] w-full ${showListOnMobile ? "" : "hidden lg:block"}`}>
          <ConversationList className="max-w-none mx-0 pb-6" />
        </div>
        <div className={`flex-1 ${conversationId ? "block" : "hidden lg:flex"}`}>
          {conversationId ? (
            <div className="h-full rounded-3xl border border-card-border overflow-hidden bg-background shadow-card">
              <ChatThread conversationId={conversationId} />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-3xl border border-dashed border-card-border bg-subtle text-muted">
              <p className="text-sm">Select a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
