"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Camera,
  MapPin,
  CheckCheck,
  Loader2,
  MoreVertical,
  Phone,
  Trash2,
  Pencil,
  Ban,
  Flag,
  Video,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { DirectMessage } from "@/types";
import { useConversation } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { timeAgo } from "@/lib/mock-data";

/** Only allow absolute https:// image URLs to prevent XSS via javascript: or data: URIs. */
function safeImageUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return undefined;
    return parsed.href;
  } catch {
    return undefined;
  }
}

function MessageBubble({
  msg,
  prevSenderId,
  currentUserId,
  isActionOpen,
  onToggleActions,
  onEdit,
  onDelete,
}: {
  msg: DirectMessage;
  prevSenderId?: string;
  currentUserId: string;
  isActionOpen: boolean;
  onToggleActions: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isMe = msg.senderId === currentUserId;
  const isSystem = msg.type === "SYSTEM";
  const isDeleted = Boolean(msg.deletedAt);
  const showAvatar = !isMe && prevSenderId !== msg.senderId;
  const showActions = isMe && !isSystem && !isDeleted;

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted bg-badge px-3 py-1 rounded-full">{msg.content}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {!isMe && (
        <div className="w-7 flex-shrink-0 self-end">
          {showAvatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={msg.senderAvatarUrl}
              alt={msg.senderName}
              className="w-7 h-7 rounded-full object-cover"
            />
          )}
        </div>
      )}

      <div className={`max-w-[75%] space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
        {isDeleted ? (
          <div className="px-3 py-2 rounded-2xl text-xs text-muted bg-badge border border-card-border">
            Message deleted
          </div>
        ) : msg.type === "IMAGE" ? (
          safeImageUrl(msg.content) ? (
            <div className={`rounded-2xl overflow-hidden ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={safeImageUrl(msg.content)}
                alt="Shared image"
                className="max-w-[220px] w-full object-cover rounded-2xl"
              />
            </div>
          ) : (
            <div className="max-w-[220px] bg-badge rounded-2xl flex items-center justify-center h-24 text-muted text-xs">
              Image unavailable
            </div>
          )
        ) : (
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isMe
                ? "bg-primary text-white rounded-br-sm"
                : "bg-card border border-card-border text-charcoal rounded-bl-sm shadow-sm"
            }`}
          >
            {msg.content}
          </div>
        )}

        <div className={`flex items-center gap-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-muted">
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {msg.editedAt && !isDeleted && (
            <span className="text-[10px] text-muted/80">(edited)</span>
          )}
          {isMe && (
            <CheckCheck size={12} className={msg.read ? "text-primary" : "text-muted"} />
          )}
          {showActions && (
            <div className="relative">
              <button
                type="button"
                onClick={onToggleActions}
                className="ml-1 text-muted hover:text-charcoal"
              >
                <MoreVertical size={14} />
              </button>
              {isActionOpen && (
                <div className="absolute right-0 mt-1 w-28 rounded-xl border border-card-border bg-card shadow-lg text-xs overflow-hidden z-10">
                  {msg.type === "TEXT" && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-subtle"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex w-full items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChatThreadProps {
  conversationId: string;
}

export default function ChatThread({ conversationId }: ChatThreadProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const {
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
  } = useConversation(conversationId);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<DirectMessage | null>(null);
  const [actionMessageId, setActionMessageId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setEditingMessage(null);
    setActionMessageId(null);
    setMenuOpen(false);
  }, [conversationId]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      sendTyping(false);
    };
  }, [sendTyping]);

  useEffect(() => {
    if (!user?.userId) return;
    const sendPresence = async (status: "ONLINE" | "AWAY" | "OFFLINE") => {
      try {
        await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      } catch {
        // ignore presence errors
      }
    };

    sendPresence("ONLINE");
    const interval = setInterval(() => {
      const status = document.visibilityState === "visible" ? "ONLINE" : "AWAY";
      sendPresence(status);
    }, 20000);
    const handleVisibility = () => {
      const status = document.visibilityState === "visible" ? "ONLINE" : "AWAY";
      sendPresence(status);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      sendPresence("OFFLINE");
    };
  }, [user?.userId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending || blockedByMe || blockedByOther) return;
    setIsSending(true);
    try {
      if (editingMessage) {
        await updateMessage(editingMessage.id, text);
        setEditingMessage(null);
      } else {
        await sendMessage(text);
      }
      setInputText("");
      await sendTyping(false);
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setTimeout(() => setIsSending(false), 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && editingMessage) {
      setEditingMessage(null);
      setInputText("");
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (value.trim()) {
      sendTyping(true);
      typingTimeout.current = setTimeout(() => {
        sendTyping(false);
      }, 1500);
    } else {
      sendTyping(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (blockedByMe || blockedByOther) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/messages/uploads", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Upload failed");
      }
      const data = await res.json();
      if (!data?.url) {
        throw new Error("Upload failed");
      }
      await sendMessage(data.url, "IMAGE");
    } catch (err) {
      console.error("Image upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleBlockToggle = async () => {
    if (!other) return;
    const method = blockedByMe ? "DELETE" : "POST";
    await fetch("/api/messages/blocks", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: other.id }),
    });
    setMenuOpen(false);
    refetch();
  };

  const handleReport = async () => {
    if (!other) return;
    const reason = window.prompt("Tell us what happened");
    if (!reason) return;
    await fetch("/api/messages/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        reportedUserId: other.id,
        reason,
      }),
    });
    setMenuOpen(false);
  };

  const handleDeleteConversation = async () => {
    const confirmDelete = window.confirm("Delete this conversation?");
    if (!confirmDelete) return;
    await deleteConversation();
    router.push("/contacts");
  };

  const startCall = (mode: "audio" | "video") => {
    if (!other) return;
    const params = new URLSearchParams({ helperId: other.id, mode });
    if (conversation?.bountyRef?.id) {
      params.set("bountyId", conversation.bountyRef.id);
    }
    router.push(`/video?${params.toString()}`);
  };

  const other = conversation?.participants.find((p) => p.id !== user?.userId);
  const otherPresence = presence.find((p) => p.userId === other?.id);
  const isTyping = typing.some((t) => t.userId === other?.id && t.isTyping);
  const presenceLabel = isTyping
    ? "Typing..."
    : otherPresence?.status === "ONLINE"
      ? "● Online"
      : otherPresence?.lastSeen
        ? `Last seen ${timeAgo(otherPresence.lastSeen)}`
        : "Offline";
  const blockedByMe = conversation?.blockedByMe ?? false;
  const blockedByOther = conversation?.blockedByOther ?? false;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-card-border shadow-sm flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-badge transition-colors lg:hidden"
        >
          <ArrowLeft size={20} className="text-charcoal" />
        </motion.button>

        {isLoading || !other ? (
          <div className="flex items-center gap-2 flex-1">
            <div className="w-9 h-9 rounded-full bg-badge animate-pulse" />
            <div className="space-y-1">
              <div className="h-3 w-24 bg-badge rounded animate-pulse" />
              <div className="h-2 w-16 bg-badge rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={other.avatarUrl}
              alt={other.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-100"
            />
            <div>
              <p className="font-bold text-charcoal text-sm leading-tight">{other.name}</p>
              <p className={`text-xs font-medium ${isTyping ? "text-primary" : "text-secondary-600"}`}>
                {presenceLabel}
              </p>
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {other && (
            <>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => startCall("audio")}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-badge transition-colors"
                title="Start audio call"
                aria-label="Start audio call"
              >
                <Phone size={15} className="text-charcoal" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => startCall("video")}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-badge transition-colors"
                title="Start video call"
                aria-label="Start video call"
              >
                <Video size={15} className="text-charcoal" />
              </motion.button>
            </>
          )}
          {conversation?.bountyRef && (
            <div className="flex items-center gap-1 text-xs text-primary bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
              <MapPin size={11} />
              <span className="truncate max-w-[100px]">{conversation.bountyRef.title}</span>
            </div>
          )}
          {other && (
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMenuOpen((prev) => !prev)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-badge transition-colors"
              >
                <MoreVertical size={18} className="text-charcoal" />
              </motion.button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-card-border bg-card shadow-lg overflow-hidden z-20">
                  <button
                    type="button"
                    onClick={handleBlockToggle}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-subtle"
                  >
                    <Ban size={14} /> {blockedByMe ? "Unblock user" : "Block user"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReport}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-subtle"
                  >
                    <Flag size={14} /> Report user
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConversation}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Delete conversation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2.5">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <MessageBubble
                  msg={msg}
                  currentUserId={user?.userId ?? ""}
                  prevSenderId={i > 0 ? messages[i - 1].senderId : undefined}
                  isActionOpen={actionMessageId === msg.id}
                  onToggleActions={() =>
                    setActionMessageId((current) => (current === msg.id ? null : msg.id))
                  }
                  onEdit={() => {
                    setEditingMessage(msg);
                    setInputText(msg.content);
                    setActionMessageId(null);
                    inputRef.current?.focus();
                  }}
                  onDelete={() => {
                    setActionMessageId(null);
                    if (window.confirm("Delete this message?")) {
                      deleteMessage(msg.id);
                    }
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-card border-t border-card-border px-4 py-3 pb-safe">
        {editingMessage && (
          <div className="mb-2 flex items-center justify-between rounded-xl bg-primary-50 px-3 py-2 text-xs text-primary">
            <span>Editing message</span>
            <button
              type="button"
              onClick={() => {
                setEditingMessage(null);
                setInputText("");
              }}
              className="flex items-center gap-1 text-primary"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        )}
        {(blockedByMe || blockedByOther) && (
          <div className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
            {blockedByMe
              ? "You blocked this user. Unblock to send messages."
              : "You cannot send messages to this user."}
          </div>
        )}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={handleSelectImage}
            disabled={blockedByMe || blockedByOther || isUploading}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-badge text-muted hover:bg-primary-50 hover:text-primary transition-colors flex-shrink-0 disabled:opacity-40"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={17} />}
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => sendTyping(false)}
            placeholder={editingMessage ? "Edit message…" : "Message…"}
            disabled={blockedByMe || blockedByOther}
            className="flex-1 px-4 py-2.5 bg-subtle border border-card-border rounded-2xl text-sm text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:bg-input-surface transition-colors disabled:opacity-60"
          />

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleSend}
            disabled={!inputText.trim() || isSending || blockedByMe || blockedByOther}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white shadow-primary disabled:opacity-40 disabled:shadow-none flex-shrink-0 transition-opacity"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
