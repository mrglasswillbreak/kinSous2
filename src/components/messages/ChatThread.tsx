"use client";

import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Camera, MapPin, CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DirectMessage } from "@/types";
import { useConversation } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function safeImageUrl(url: string): string | undefined {
  if (url.startsWith("/uploads/messages/")) return url;
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) return undefined;
    return parsed.href;
  } catch {
    return undefined;
  }
}

function MessageBubble({ msg, prevSenderId, currentUserId }: { msg: DirectMessage; prevSenderId?: string; currentUserId: string }) {
  const isMe = msg.senderId === currentUserId;
  const isSystem = msg.type === "SYSTEM";
  const showAvatar = !isMe && prevSenderId !== msg.senderId;

  if (isSystem) {
    return <div className="flex justify-center my-2"><span className="text-xs text-muted bg-badge px-3 py-1 rounded-full">{msg.content}</span></div>;
  }

  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {!isMe && <div className="w-7 flex-shrink-0 self-end">{showAvatar && <img src={msg.senderAvatarUrl} alt={msg.senderName} className="w-7 h-7 rounded-full object-cover" />}</div>}
      <div className={`max-w-[75%] space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
        {msg.type === "IMAGE" ? (
          safeImageUrl(msg.content) ? <img src={safeImageUrl(msg.content)} alt="Shared image" className="max-w-[220px] w-full object-cover rounded-2xl" /> : <div className="max-w-[220px] bg-badge rounded-2xl flex items-center justify-center h-24 text-muted text-xs">Image unavailable</div>
        ) : (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-primary text-white rounded-br-sm" : "bg-card border border-card-border text-charcoal rounded-bl-sm shadow-sm"}`}>{msg.content}</div>
        )}
        <div className={`flex items-center gap-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-muted">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {isMe && <CheckCheck size={12} className={msg.read ? "text-primary" : "text-muted"} />}
        </div>
      </div>
    </div>
  );
}

export default function ChatThread({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { conversation, messages, isLoading, sendMessage } = useConversation(conversationId);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setInputText("");
    setError(null);
    try {
      await sendMessage(text);
    } catch {
      setError("Could not send message. Please try again.");
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || isUploading) return;
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/messages/uploads", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error((await uploadRes.json().catch(() => ({}))).error || "Upload failed");
      const payload = await uploadRes.json();
      await sendMessage(payload.url, "IMAGE");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const other = conversation?.participants.find((p) => p.id !== user?.userId);

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-background">
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-card-border shadow-sm flex-shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-badge transition-colors"><ArrowLeft size={20} className="text-charcoal" /></motion.button>
        <div className="flex items-center gap-2.5 flex-1">{other && <img src={other.avatarUrl} alt={other.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-100" />}<div><p className="font-bold text-charcoal text-sm leading-tight">{other?.name ?? "Conversation"}</p><p className="text-xs text-secondary-600 font-medium">● Online</p></div></div>
        {conversation?.bountyRef && <div className="ml-auto flex items-center gap-1 text-xs text-primary bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100"><MapPin size={11} /><span className="truncate max-w-[100px]">{conversation.bountyRef.title}</span></div>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">{isLoading ? <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-primary" /></div> : <AnimatePresence initial={false}>{messages.map((msg, i) => <motion.div key={msg.id}><MessageBubble msg={msg} currentUserId={user?.userId ?? ""} prevSenderId={i > 0 ? messages[i - 1].senderId : undefined} /></motion.div>)}</AnimatePresence>}<div ref={bottomRef} /></div>

      <div className="flex-shrink-0 bg-card border-t border-card-border px-4 py-3 pb-safe">
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => imageInputRef.current?.click()} disabled={isUploading} className="w-9 h-9 flex items-center justify-center rounded-full bg-badge text-muted hover:bg-primary-50 hover:text-primary transition-colors flex-shrink-0 disabled:opacity-50"><Camera size={17} /></motion.button>
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message…" className="flex-1 px-4 py-2.5 bg-subtle border border-card-border rounded-2xl text-sm" />
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => void handleSend()} disabled={!inputText.trim() || isSending} className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-40">{isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</motion.button>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
        {(error || isUploading) && <p className="text-xs mt-2 text-muted">{isUploading ? "Uploading image…" : error}</p>}
      </div>
    </div>
  );
}
