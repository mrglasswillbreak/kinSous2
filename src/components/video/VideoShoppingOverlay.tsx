"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Camera, Mic, MicOff, Video, VideoOff, Phone,
  MessageCircle, Send, X, Minimize2, CheckCircle,
} from "lucide-react";
import type { ChatMessage } from "@/types";

interface VideoShoppingOverlayProps {
  helperName: string;
  helperAvatar: string;
  seekerName: string;
  onClose?: () => void;
}

function uid() { return Math.random().toString(36).slice(2, 9); }

/** Only allow absolute https:// image URLs to prevent XSS via javascript: or data: URIs.
 * Returns the reconstructed URL from the parsed object (not the original string) so
 * taint analysis tools can see we never pass raw user input to the DOM.
 */
function safeImageUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return undefined;
    // Return parsed.href (reconstructed, not the original tainted value)
    return parsed.href;
  } catch {
    return undefined;
  }
}

export default function VideoShoppingOverlay({
  helperName, helperAvatar, seekerName, onClose,
}: VideoShoppingOverlayProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isPiPMin, setIsPiPMin] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [inputText, setInputText] = useState("");
  const dragControls = useDragControls();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys-1", senderId: "system", senderName: "KinSous",
      senderAvatarUrl: "", type: "SYSTEM",
      content: `${helperName} joined the session`,
      createdAt: new Date().toISOString(),
    },
    {
      id: "msg-1", senderId: "helper", senderName: helperName,
      senderAvatarUrl: helperAvatar, type: "TEXT",
      content: "Hey! I'm at the market now. What exactly do you need?",
      createdAt: new Date().toISOString(),
    },
  ]);

  const handleSnapshot = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 400);
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: uid(), senderId: "helper", senderName: helperName,
        senderAvatarUrl: helperAvatar, type: "SNAPSHOT",
        content: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
        createdAt: new Date().toISOString(),
      }]);
    }, 300);
  }, [helperName, helperAvatar]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    setMessages((prev) => [...prev, {
      id: uid(), senderId: "seeker", senderName: seekerName,
      senderAvatarUrl: "https://i.pravatar.cc/150?img=23",
      type: "TEXT", content: inputText, createdAt: new Date().toISOString(),
    }]);
    setInputText("");
  };

  const handleApprove = () => {
    setMessages((prev) => [...prev, {
      id: uid(), senderId: "seeker", senderName: seekerName,
      senderAvatarUrl: "https://i.pravatar.cc/150?img=23",
      type: "SYSTEM", content: "✅ Snapshot approved! Go ahead and purchase.",
      createdAt: new Date().toISOString(),
    }]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/95 flex flex-col overflow-hidden">
      {/* Camera flash */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            key="flash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Main video area */}
      <div className="flex-1 relative flex items-center justify-center bg-charcoal">
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center text-white/40">
            <Video size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Your camera</p>
          </div>
        </div>

        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full">
          {seekerName}
        </div>
        <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {helperName} · Live
        </div>

        {/* Draggable PiP */}
        <motion.div
          drag dragControls={dragControls} dragMomentum={false}
          dragConstraints={{ left: -300, right: 0, top: 0, bottom: 300 }}
          whileDrag={{ scale: 1.05, cursor: "grabbing" }}
          animate={{ width: isPiPMin ? 56 : 140, height: isPiPMin ? 56 : 200 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute top-4 right-4 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 cursor-grab"
        >
          <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-700 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={helperAvatar} alt={helperName} className="w-full h-full object-cover opacity-80" />
            {!isPiPMin && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 p-2">
                <p className="text-white text-xs font-medium">{helperName}</p>
              </div>
            )}
          </div>
          {!isPiPMin && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsPiPMin(true)}
              className="absolute top-1 right-1 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center"
            >
              <Minimize2 size={10} className="text-white" />
            </motion.button>
          )}
          {isPiPMin && (
            <button className="absolute inset-0" onClick={() => setIsPiPMin(false)}>
              <span className="sr-only">Expand</span>
            </button>
          )}
        </motion.div>

        {/* Snapshot button */}
        <motion.button
          whileTap={{ scale: 0.9 }} onClick={handleSnapshot}
          className="absolute bottom-4 right-4 flex items-center gap-2 bg-card text-charcoal text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg border border-card-border"
        >
          <Camera size={16} className="text-primary" /> Snapshot
        </motion.button>
      </div>

      {/* Controls */}
      <div className="bg-black/60 backdrop-blur-sm px-6 py-4 flex items-center justify-center gap-6">
        <motion.button
          whileTap={{ scale: 0.88 }} onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-red-500 text-white" : "bg-white/20 text-white"}`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.88 }} onClick={onClose}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
        >
          <Phone size={24} className="text-white rotate-[135deg]" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.88 }} onClick={() => setIsVideoOff(!isVideoOff)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? "bg-red-500 text-white" : "bg-white/20 text-white"}`}
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.88 }} onClick={() => setChatOpen(!chatOpen)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${chatOpen ? "bg-primary text-white" : "bg-white/20 text-white"}`}
        >
          <MessageCircle size={20} />
        </motion.button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="chat"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="absolute bottom-[88px] left-0 right-0 bg-card rounded-t-3xl max-h-[55vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
              <h3 className="font-bold text-charcoal">Live Chat</h3>
              <button onClick={() => setChatOpen(false)} aria-label="Close chat" className="text-muted"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.type === "SYSTEM" ? (
                    <p className="text-center text-xs text-muted">{msg.content}</p>
                  ) : msg.type === "SNAPSHOT" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={msg.senderAvatarUrl} alt={msg.senderName} className="w-7 h-7 rounded-full object-cover" />
                        <span className="text-xs font-semibold text-charcoal">{msg.senderName}</span>
                        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">📸 Snapshot</span>
                      </div>
                      {(() => {
                        const safeUrl = safeImageUrl(msg.content);
                        return safeUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={safeUrl} alt="snapshot" className="w-full max-w-xs rounded-2xl object-cover border border-card-border" />
                        ) : null;
                      })()}
                      <motion.button
                        whileTap={{ scale: 0.95 }} onClick={handleApprove}
                        className="flex items-center gap-1.5 bg-secondary-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
                      >
                        <CheckCircle size={13} /> Approve &amp; Purchase
                      </motion.button>
                    </div>
                  ) : (
                    <div className={`flex items-start gap-2 ${msg.senderId === "seeker" ? "flex-row-reverse" : ""}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.senderAvatarUrl} alt={msg.senderName} className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                        msg.senderId === "seeker" ? "bg-primary text-white" : "bg-badge text-charcoal"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-card-border flex gap-2">
              <input
                type="text" value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message…"
                className="flex-1 bg-input-surface rounded-xl px-3 py-2 text-sm text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <motion.button
                whileTap={{ scale: 0.9 }} onClick={handleSend}
                className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0"
              >
                <Send size={16} className="text-white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
