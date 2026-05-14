"use client";

import { useState, useCallback, useEffect } from "react";
import type { Conversation, DirectMessage } from "@/types";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/messages/conversations");
      if (!res.ok) {
        setConversations([]);
        return;
      }
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch (err) {
      console.error("useConversations: failed to load conversations", err);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return { conversations, isLoading, totalUnread, refetch };
}

export function useConversation(id: string) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/messages/conversations/${id}`);
      if (!res.ok) {
        setConversation(null);
        setMessages([]);
        return;
      }
      const data = await res.json();
      setConversation(data.conversation ?? null);
      setMessages(data.messages ?? []);
    } catch (err) {
      console.error("useConversation: failed to load conversation", err);
      setConversation(null);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const sendMessage = useCallback(
    async (content: string, type: DirectMessage["type"] = "TEXT") => {
      const res = await fetch(`/api/messages/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type }),
      });
      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      const data = await res.json();
      const message = data.message as DirectMessage;
      setMessages((prev) => [...prev, message]);
      setConversation((prev) => {
        if (!prev) return prev;
        return { ...prev, lastMessage: message, updatedAt: message.createdAt };
      });
      return message;
    },
    [id]
  );

  return { conversation, messages, isLoading, sendMessage, refetch };
}
