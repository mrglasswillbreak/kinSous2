"use client";

import { useState, useCallback, useEffect } from "react";
import type { Conversation, ConversationTyping, DirectMessage, UserPresence } from "@/types";

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

  useEffect(() => {
    const stream = new EventSource("/api/messages/stream");
    const handleRefresh = () => {
      refetch();
    };
    stream.addEventListener("conversation_updated", handleRefresh);
    stream.addEventListener("conversation_deleted", handleRefresh);
    stream.addEventListener("notification", handleRefresh);
    stream.addEventListener("error", handleRefresh);
    return () => {
      stream.close();
    };
  }, [refetch]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return { conversations, isLoading, totalUnread, refetch };
}

export function useConversation(id: string) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typing, setTyping] = useState<ConversationTyping[]>([]);
  const [presence, setPresence] = useState<UserPresence[]>([]);

  const refetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/messages/conversations/${id}`);
      if (!res.ok) {
        setConversation(null);
        setMessages([]);
        setTyping([]);
        setPresence([]);
        return;
      }
      const data = await res.json();
      setConversation(data.conversation ?? null);
      setMessages(data.messages ?? []);
      setTyping(data.typing ?? []);
      setPresence(data.presence ?? []);
    } catch (err) {
      console.error("useConversation: failed to load conversation", err);
      setConversation(null);
      setMessages([]);
      setTyping([]);
      setPresence([]);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!id) return;
    const stream = new EventSource(`/api/messages/conversations/${id}/stream`);
    const handleMessage = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as DirectMessage;
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) {
          return prev.map((m) => (m.id === payload.id ? payload : m));
        }
        return [...prev, payload];
      });
      setConversation((prev) => (prev ? { ...prev, lastMessage: payload, updatedAt: payload.createdAt } : prev));
    };
    const handleMessageUpdated = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as DirectMessage;
      setMessages((prev) => prev.map((m) => (m.id === payload.id ? payload : m)));
      setConversation((prev) =>
        prev && prev.lastMessage.id === payload.id
          ? { ...prev, lastMessage: payload, updatedAt: payload.createdAt }
          : prev
      );
    };
    const handleMessageDeleted = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as DirectMessage;
      setMessages((prev) => prev.map((m) => (m.id === payload.id ? payload : m)));
      setConversation((prev) =>
        prev && prev.lastMessage.id === payload.id
          ? { ...prev, lastMessage: payload, updatedAt: payload.createdAt }
          : prev
      );
    };
    const handleTyping = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as ConversationTyping[];
      setTyping(payload);
    };
    const handlePresence = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as UserPresence[] | UserPresence;
      if (Array.isArray(payload)) {
        setPresence(payload);
        return;
      }
      setPresence((prev) => {
        const next = prev.filter((p) => p.userId !== payload.userId);
        return [...next, payload];
      });
    };
    const handleRead = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as { readerId: string };
      setMessages((prev) =>
        prev.map((m) => (m.senderId !== payload.readerId ? { ...m, read: true } : m))
      );
    };
    stream.addEventListener("message", handleMessage);
    stream.addEventListener("message_updated", handleMessageUpdated);
    stream.addEventListener("message_deleted", handleMessageDeleted);
    stream.addEventListener("typing", handleTyping);
    stream.addEventListener("presence", handlePresence);
    stream.addEventListener("read", handleRead);
    stream.addEventListener("error", () => refetch());
    return () => {
      stream.close();
    };
  }, [id, refetch]);

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

  const updateMessage = useCallback(
    async (messageId: string, content: string) => {
      const res = await fetch(`/api/messages/conversations/${id}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        throw new Error("Failed to update message");
      }
      const data = await res.json();
      const message = data.message as DirectMessage;
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
      setConversation((prev) => {
        if (!prev) return prev;
        if (prev.lastMessage.id !== message.id) return prev;
        return { ...prev, lastMessage: message, updatedAt: message.createdAt };
      });
      return message;
    },
    [id]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const res = await fetch(`/api/messages/conversations/${id}/messages/${messageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete message");
      }
      const data = await res.json();
      const message = data.message as DirectMessage;
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
      setConversation((prev) => {
        if (!prev) return prev;
        if (prev.lastMessage.id !== message.id) return prev;
        return { ...prev, lastMessage: message, updatedAt: message.createdAt };
      });
      return message;
    },
    [id]
  );

  const deleteConversation = useCallback(async () => {
    const res = await fetch(`/api/messages/conversations/${id}/delete`, { method: "POST" });
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
    [id]
  );

  return {
    conversation,
    messages,
    isLoading,
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
