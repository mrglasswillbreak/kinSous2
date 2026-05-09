"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Truck, CheckCircle2, Clock, Navigation, MapPin } from "lucide-react";
import type { DeliveryTracking, DeliveryStage } from "@/types";
import { mockDeliveryTracking } from "@/lib/mock-data";

const stageOrder: DeliveryStage[] = ["MARKET", "IN_TRANSIT", "ARRIVED"];

const stepIcons: Record<DeliveryStage, React.ReactNode> = {
  MARKET: <ShoppingCart size={16} />,
  IN_TRANSIT: <Truck size={16} />,
  ARRIVED: <CheckCircle2 size={16} />,
};

function Stepper({ tracking }: { tracking: DeliveryTracking }) {
  const currentIdx = stageOrder.indexOf(tracking.currentStage);
  return (
    <div className="relative">
      <div className="absolute top-5 left-5 right-5 h-0.5 bg-badge z-0">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentIdx / (stageOrder.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="relative z-10 flex justify-between">
        {tracking.steps.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={step.stage} className="flex flex-col items-center gap-2">
              <motion.div
                animate={{
                  scale: isCurrent ? [1, 1.2, 1] : 1,
                  backgroundColor: isDone ? "#27AE60" : isCurrent ? "#E67E22" : "#E5E7EB",
                }}
                transition={{
                  scale: isCurrent ? { repeat: Infinity, duration: 2 } : { duration: 0.3 },
                  backgroundColor: { duration: 0.4 },
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm"
              >
                {isDone ? (
                  <CheckCircle2 size={18} className="text-white" />
                ) : (
                  <span className={isCurrent ? "text-white" : "text-gray-400"}>{stepIcons[step.stage]}</span>
                )}
              </motion.div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${isCurrent ? "text-primary" : isDone ? "text-secondary-600" : "text-muted"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted max-w-[70px] leading-tight">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapPlaceholder({ tracking }: { tracking: DeliveryTracking }) {
  return (
    <div className="relative w-full h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 border border-card-border">
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-4 grid-rows-4 h-full">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="border border-gray-300" />
          ))}
        </div>
      </div>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 256">
        <path d="M 0 128 Q 80 80 160 128 T 320 128" stroke="#CBD5E1" strokeWidth="6" fill="none" />
        <path d="M 160 0 Q 180 64 160 128 T 160 256" stroke="#CBD5E1" strokeWidth="4" fill="none" />
      </svg>

      {/* Destination */}
      <div className="absolute bottom-8 left-1/3 flex flex-col items-center">
        <MapPin size={22} className="text-primary drop-shadow-md" />
        <span className="text-[10px] font-semibold text-charcoal bg-white/80 px-1.5 py-0.5 rounded-full mt-0.5 shadow-sm">You</span>
      </div>

      {/* Helper pulsing marker */}
      <div className="absolute top-1/3 right-1/3 flex items-center justify-center">
        <motion.div
          className="absolute w-14 h-14 rounded-full bg-primary/20"
          animate={{ scale: [1, 2], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute w-14 h-14 rounded-full bg-primary/15"
          animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
        />
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 w-8 h-8 rounded-full bg-primary shadow-md flex items-center justify-center border-2 border-white"
        >
          <Navigation size={14} className="text-white" />
        </motion.div>
      </div>

      <p className="absolute bottom-2 right-2 text-[10px] text-gray-400">Mapbox GL · Live</p>
    </div>
  );
}

export default function Tracker() {
  const [tracking] = useState<DeliveryTracking>(mockDeliveryTracking);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-charcoal">Live Tracking</h2>
        <p className="text-muted text-sm mt-0.5">Your order is on the way</p>
      </div>

      {/* Helper info */}
      <div className="flex items-center gap-3 bg-card rounded-3xl p-4 shadow-card">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tracking.helper.avatarUrl} alt={tracking.helper.name}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-primary-100"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-secondary-500 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-charcoal">{tracking.helper.name}</p>
          <p className="text-xs text-muted">Your Helper · ⭐ {tracking.helper.chefScore}</p>
        </div>
        {tracking.estimatedArrivalMinutes && (
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{tracking.estimatedArrivalMinutes}</p>
            <p className="text-xs text-muted flex items-center gap-1 justify-end">
              <Clock size={10} /> min away
            </p>
          </div>
        )}
      </div>

      <MapPlaceholder tracking={tracking} />

      <div className="bg-card rounded-3xl p-5 shadow-card space-y-4">
        <h3 className="font-bold text-charcoal">Delivery Progress</h3>
        <Stepper tracking={tracking} />
      </div>

      {tracking.helperLocation && (
        <div className="bg-card rounded-3xl p-4 shadow-card">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Helper Status</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary-50 rounded-2xl p-3">
              <p className="text-xs text-muted">Speed</p>
              <p className="text-lg font-bold text-charcoal">
                {tracking.helperLocation.speed ?? "--"} <span className="text-sm font-normal">km/h</span>
              </p>
            </div>
            <div className="bg-secondary-50 rounded-2xl p-3">
              <p className="text-xs text-muted">Location updated</p>
              <p className="text-sm font-bold text-charcoal">{elapsed}s ago</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
