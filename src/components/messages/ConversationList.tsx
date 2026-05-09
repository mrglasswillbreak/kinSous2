"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MessageCircle, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import type { Conversation } from "@/types";
import { useConversations } from "@/hooks/useConversations";
import { timeAgo, currentUser } from "@/lib/mock-data";

function Shimmer({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-gray-100 rounded-xl ${className ?? ""}`}
    />
  );
}

function ConversationRow({ conv, index }: { conv: Conversation; index: number }) {
  const other = conv.participants.find((p) => p.id !== currentUser.id) ?? conv.participants[0];
  const lastMsg = conv.lastMessage;
  const isMe = lastMsg.senderId === currentUser.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link href={`/messages/${conv.id}`}>
        <div className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${conv.unreadCount > 0 ? "bg-primary-50/30" : ""}`}>
          <div className="relative flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={other.avatarUrl}
              alt={other.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
            {conv.unreadCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-2 border-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold text-charcoal" : "font-semibold text-charcoal/80"}`}>
                {other.name}
              </p>
              <span className="text-xs text-muted flex-shrink-0">{timeAgo(conv.updatedAt)}</span>
            </div>
            {conv.bountyRef && (
              <p className="text-xs text-primary truncate font-medium">{conv.bountyRef.title}</p>
            )}
            <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-charcoal font-medium" : "text-muted"}`}>
              {isMe ? "You: " : ""}{lastMsg.type === "IMAGE" ? "📷 Photo" : lastMsg.content}
            </p>
          </div>

          {conv.unreadCount > 0 ? (
            <div className="flex-shrink-0 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {conv.unreadCount}
            </div>
          ) : (
            <ChevronRight size={16} className="text-muted flex-shrink-0" />
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function ConversationList() {
  const { conversations, isLoading } = useConversations();
  const [query, setQuery] = useState("");

  const filtered = conversations.filter((c) => {
    if (!query) return true;
    const other = c.participants.find((p) => p.id !== currentUser.id);
    const q = query.toLowerCase();
    return (
      other?.name.toLowerCase().includes(q) ||
      c.bountyRef?.title.toLowerCase().includes(q) ||
      c.lastMessage.content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-md mx-auto pb-24">
      <div className="sticky top-0 z-10 bg-background px-4 pt-6 pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle size={22} className="text-primary" />
          <h1 className="text-2xl font-bold text-charcoal">Messages</h1>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-card overflow-hidden mx-4 mt-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-4 border-b border-gray-50 last:border-0">
              <Shimmer className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-3 w-32" />
                <Shimmer className="h-2.5 w-48" />
                <Shimmer className="h-2.5 w-40" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted gap-3">
            <MessageCircle size={40} strokeWidth={1.5} />
            <p className="font-semibold text-charcoal">No conversations yet</p>
            <p className="text-sm text-center max-w-[220px]">
              Accept a bid or start chatting with a Helper to begin messaging.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="divide-y divide-gray-50">
              {filtered.map((conv, i) => (
                <ConversationRow key={conv.id} conv={conv} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
