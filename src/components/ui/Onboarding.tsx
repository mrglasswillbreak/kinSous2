"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ChevronRight, ShoppingBag, ChefHat, Shield, MapPin, Star } from "lucide-react";

interface OnboardingProps {
  onComplete: (role: "SEEKER" | "HELPER") => void;
}

const slides = [
  {
    emoji: "🍲",
    title: "Taste Your Heritage",
    body: "Connect with local culinary helpers for authentic West African food — from Lagos markets to Houston kitchens.",
    bg: "from-primary-400 to-primary-600",
  },
  {
    emoji: "🎯",
    title: "Post a Bounty",
    body: "Need ingredients sourced, a recipe explained, or a chef for your event? Post a bounty and get bids in minutes.",
    bg: "from-orange-400 to-orange-600",
  },
  {
    emoji: "📱",
    title: "FaceTime Assist",
    body: "Shop live with your helper via video. Approve each ingredient before purchase. No surprises.",
    bg: "from-blue-400 to-blue-600",
  },
  {
    emoji: "🔒",
    title: "Safe & Secure",
    body: "Funds held in escrow (Stripe for USD, Flutterwave for NGN). Released only when you confirm delivery.",
    bg: "from-secondary-400 to-secondary-600",
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [pickingRole, setPickingRole] = useState(false);

  const isLast = slideIdx === slides.length - 1;
  const current = slides[slideIdx];

  if (pickingRole) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-16 pt-8"
      >
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-6">
          <Flame size={26} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal text-center mb-2">How will you use KinSous?</h2>
        <p className="text-muted text-sm text-center mb-8">You can switch later in Settings.</p>

        <div className="w-full max-w-sm space-y-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onComplete("SEEKER")}
            className="w-full bg-white rounded-3xl shadow-card border-2 border-transparent hover:border-primary-200 transition-all p-5 text-left flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={28} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-charcoal text-lg">I&apos;m a Seeker</p>
              <p className="text-sm text-muted mt-0.5">I want to post bounties and hire Helpers for food tasks</p>
            </div>
            <ChevronRight size={20} className="text-muted ml-auto flex-shrink-0" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onComplete("HELPER")}
            className="w-full bg-white rounded-3xl shadow-card border-2 border-transparent hover:border-secondary-200 transition-all p-5 text-left flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-secondary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <ChefHat size={28} className="text-secondary" />
            </div>
            <div>
              <p className="font-bold text-charcoal text-lg">I&apos;m a Helper</p>
              <p className="text-sm text-muted mt-0.5">I want to bid on bounties and earn with my culinary skills</p>
            </div>
            <ChevronRight size={20} className="text-muted ml-auto flex-shrink-0" />
          </motion.button>
        </div>

        <div className="mt-8 flex items-center gap-6 text-xs text-muted">
          <div className="flex items-center gap-1"><Shield size={12} className="text-secondary-500" /> Secure escrow</div>
          <div className="flex items-center gap-1"><MapPin size={12} className="text-primary" /> Local Helpers</div>
          <div className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400" /> Verified</div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Slide area */}
      <div className={`flex-1 bg-gradient-to-br ${current.bg} flex flex-col items-center justify-center px-8 pb-8 pt-16 relative overflow-hidden`}>
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 border-[60px] border-white rounded-full scale-75" />
          <div className="absolute inset-0 border-[30px] border-white rounded-full scale-110" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={slideIdx}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="text-center relative z-10"
          >
            <motion.p
              className="text-7xl mb-6"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {current.emoji}
            </motion.p>
            <h1 className="text-3xl font-bold text-white mb-3">{current.title}</h1>
            <p className="text-white/80 text-base leading-relaxed max-w-xs">{current.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="bg-background px-6 py-8 space-y-5">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setSlideIdx(i)}
              animate={{ width: i === slideIdx ? 24 : 8 }}
              className={`h-2 rounded-full transition-colors ${i === slideIdx ? "bg-primary" : "bg-gray-200"}`}
            />
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (isLast) { setPickingRole(true); } else { setSlideIdx((i) => i + 1); }
          }}
          className="w-full bg-primary text-white py-4 rounded-3xl font-bold text-base shadow-primary flex items-center justify-center gap-2"
        >
          {isLast ? "Get Started →" : "Next"}
        </motion.button>

        <button
          onClick={() => setPickingRole(true)}
          className="w-full text-center text-sm text-muted py-1"
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
