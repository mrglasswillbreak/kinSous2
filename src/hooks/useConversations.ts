"use client";

import { useState, useCallback, useEffect } from "react";
import type { Conversation, DirectMessage } from "@/types";
import {
  mockConversations,
  mockConversationMessages,
  currentUser,
} from "@/lib/mock-data";

// ── useConversations ──────────────────────────────────────────────────────────

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setConversations([...mockConversations].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ));
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return { conversations, isLoading, totalUnread };
}

// ── useConversation ───────────────────────────────────────────────────────────

export function useConversation(id: string) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const conv = mockConversations.find((c) => c.id === id) ?? null;
      const msgs = mockConversationMessages[id] ?? [];
      setConversation(conv);
      // Mark all as read when opening
      setMessages(msgs.map((m) => ({ ...m, read: true })));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [id]);

  const sendMessage = useCallback(
    (content: string, type: DirectMessage["type"] = "TEXT") => {
      const newMsg: DirectMessage = {
        id: `msg-${Math.random().toString(36).slice(2, 9)}`,
        conversationId: id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatarUrl: currentUser.avatarUrl,
        type,
        content,
        read: true,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);

      // Simulate a reply after a short delay for demo
      if (type === "TEXT" && content.trim()) {
        setTimeout(() => {
          const conv = mockConversations.find((c) => c.id === id);
          if (!conv) return;
          const other = conv.participants.find((p) => p.id !== currentUser.id);
          if (!other) return;
          const replies = [
            "Got it! I'll take care of that right away 👍",
            "Perfect, on my way to the market now 🛒",
            "Understood! I'll send a snapshot when I'm there.",
            "Great, that works for me. See you soon!",
            "No problem at all, I'll handle it ✅",
          ];
          const reply: DirectMessage = {
            id: `msg-${Math.random().toString(36).slice(2, 9)}`,
            conversationId: id,
            senderId: other.id,
            senderName: other.name,
            senderAvatarUrl: other.avatarUrl,
            type: "TEXT",
            content: replies[Math.floor(Math.random() * replies.length)],
            read: true,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, reply]);
        }, 1500 + Math.random() * 1000);
      }
    },
    [id],
  );

  return { conversation, messages, isLoading, sendMessage };
}
