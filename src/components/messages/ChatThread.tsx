"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Camera, MapPin, CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DirectMessage } from "@/types";
import { useConversation } from "@/hooks/useConversations";
import { currentUser } from "@/lib/mock-data";

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

function MessageBubble({ msg, prevSenderId }: { msg: DirectMessage; prevSenderId?: string }) {
  const isMe = msg.senderId === currentUser.id;
  const isSystem = msg.type === "SYSTEM";
  const showAvatar = !isMe && prevSenderId !== msg.senderId;

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted bg-gray-100 px-3 py-1 rounded-full">{msg.content}</span>
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
        {msg.type === "IMAGE" ? (
          <div className={`rounded-2xl overflow-hidden ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safeImageUrl(msg.content) ?? ""}
              alt="Shared image"
              className="max-w-[220px] w-full object-cover rounded-2xl"
            />
          </div>
        ) : (
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isMe
                ? "bg-primary text-white rounded-br-sm"
                : "bg-white border border-gray-200 text-charcoal rounded-bl-sm shadow-sm"
            }`}
          >
            {msg.content}
          </div>
        )}
        <div className={`flex items-center gap-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-muted">
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {isMe && (
            <CheckCheck size={12} className={msg.read ? "text-primary" : "text-muted"} />
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
  const { conversation, messages, isLoading, sendMessage } = useConversation(conversationId);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setInputText("");
    sendMessage(text);
    setTimeout(() => setIsSending(false), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const other = conversation?.participants.find((p) => p.id !== currentUser.id);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-charcoal" />
        </motion.button>

        {isLoading || !other ? (
          <div className="flex items-center gap-2 flex-1">
            <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
            <div className="space-y-1">
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-2 w-16 bg-gray-100 rounded animate-pulse" />
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
              <p className="text-xs text-secondary-600 font-medium">● Online</p>
            </div>
          </div>
        )}

        {conversation?.bountyRef && (
          <div className="ml-auto flex items-center gap-1 text-xs text-primary bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
            <MapPin size={11} />
            <span className="truncate max-w-[100px]">{conversation.bountyRef.title}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
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
                  prevSenderId={i > 0 ? messages[i - 1].senderId : undefined}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3 pb-safe">
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-muted hover:bg-primary-50 hover:text-primary transition-colors flex-shrink-0"
          >
            <Camera size={17} />
          </motion.button>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white transition-colors"
          />

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white shadow-primary disabled:opacity-40 disabled:shadow-none flex-shrink-0 transition-opacity"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
