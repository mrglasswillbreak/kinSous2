"use client";
import { usePolling } from "./usePolling";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  Conversation,
  ConversationTyping,
  DirectMessage,
  UserPresence,
} from "@/types";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (!res.ok) {
        throw new Error("Could not load conversations. Please retry.");
      }
      const data = await res.json();
      setConversations(data.conversations ?? []);
      setError("");
    } catch (err) {
      console.error("useConversations: failed to load conversations", err);
      setError("Could not load conversations. Please retry.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  usePolling(refetch, 15000);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return { conversations, isLoading, error, totalUnread, refetch };
}

export function useConversation(id: string) {
  const pending = useRef<{
    content: string;
    type: string;
    id: string;
    conversationId: string;
  } | null>(null);
  const historyInitialized = useRef(false);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState<ConversationTyping[]>([]);
  const [presence, setPresence] = useState<UserPresence[]>([]);

  const refetch = useCallback(async () => {
    if (!id) return;

    try {
      const res = await fetch(`/api/messages/conversations/${id}`);
      if (!res.ok)
        throw new Error("Could not load this conversation. Please retry.");
      const data = await res.json();
      setConversation(data.conversation ?? null);
      setError("");
      if (!historyInitialized.current) {
        setOlderCursor(data.nextCursor ?? null);
        historyInitialized.current = true;
      }
      setMessages((previous) => {
        const latest = data.messages ?? [];
        const first = latest[0]?.createdAt;
        return [
          ...previous.filter((m) => first && m.createdAt < first),
          ...latest,
        ];
      });
      setTyping(data.typing ?? []);
      setPresence(data.presence ?? []);
    } catch (err) {
      console.error("useConversation: failed to load conversation", err);
      setError("Could not refresh messages. Please retry.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  usePolling(refetch, 3000);

  const loadOlder = useCallback(async () => {
    if (!olderCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const response = await fetch(
        `/api/messages/conversations/${id}?before=${encodeURIComponent(olderCursor)}`,
      );
      if (!response.ok) throw Error("Could not load older messages");
      const data = await response.json();
      setMessages((previous) => [
        ...data.messages,
        ...previous.filter(
          (m) =>
            !data.messages.some((older: DirectMessage) => older.id === m.id),
        ),
      ]);
      setOlderCursor(data.nextCursor);
    } finally {
      setLoadingOlder(false);
    }
  }, [id, olderCursor, loadingOlder]);

  const sendMessage = useCallback(
    async (content: string, type: DirectMessage["type"] = "TEXT") => {
      if (
        !pending.current ||
        pending.current.content !== content ||
        pending.current.type !== type ||
        pending.current.conversationId !== id
      )
        pending.current = {
          content,
          type,
          id: crypto.randomUUID(),
          conversationId: id,
        };
      const res = await fetch(`/api/messages/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, clientId: pending.current.id }),
      });
      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      const data = await res.json();
      pending.current = null;
      const message = data.message as DirectMessage;
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== message.id),
        message,
      ]);
      setConversation((prev) => {
        if (!prev) return prev;
        return { ...prev, lastMessage: message, updatedAt: message.createdAt };
      });
      return message;
    },
    [id],
  );

  const updateMessage = useCallback(
    async (messageId: string, content: string) => {
      const res = await fetch(
        `/api/messages/conversations/${id}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
      );
      if (!res.ok) {
        throw new Error("Failed to update message");
      }
      const data = await res.json();
      const message = data.message as DirectMessage;
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m)),
      );
      setConversation((prev) => {
        if (!prev) return prev;
        if (prev.lastMessage.id !== message.id) return prev;
        return { ...prev, lastMessage: message, updatedAt: message.createdAt };
      });
      return message;
    },
    [id],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const res = await fetch(
        `/api/messages/conversations/${id}/messages/${messageId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        throw new Error("Failed to delete message");
      }
      const data = await res.json();
      const message = data.message as DirectMessage;
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m)),
      );
      setConversation((prev) => {
        if (!prev) return prev;
        if (prev.lastMessage.id !== message.id) return prev;
        return { ...prev, lastMessage: message, updatedAt: message.createdAt };
      });
      return message;
    },
    [id],
  );

  const deleteConversation = useCallback(async () => {
    const res = await fetch(`/api/messages/conversations/${id}/delete`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error("Failed to delete conversation");
    }
  }, [id]);

  const sendTyping = useCallback(
    async (isTyping: boolean) => {
      if (!id) return;
      await fetch(`/api/messages/conversations/${id}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping }),
      });
    },
    [id],
  );

  return {
    conversation,
    messages,
    loadOlder,
    hasOlder: Boolean(olderCursor),
    loadingOlder,
    isLoading,
    error,
    typing,
    presence,
    sendMessage,
    updateMessage,
    deleteMessage,
    deleteConversation,
    sendTyping,
    refetch,
  };
}
