"use client";

import { motion } from "framer-motion";

function Shimmer({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-subtle rounded-xl ${className ?? ""}`}
    />
  );
}

export function SkeletonBountyCard() {
  return (
    <div className="bg-card rounded-3xl shadow-card p-4 space-y-3 border border-card-border">
      <div className="flex items-start gap-3">
        <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-2.5 w-32" />
        </div>
      </div>
      <Shimmer className="h-4 w-3/4" />
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-5/6" />
      <div className="flex items-center justify-between pt-1">
        <Shimmer className="h-5 w-20" />
        <Shimmer className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonHelperCard() {
  return (
    <div className="bg-card rounded-3xl shadow-card p-4 text-center w-44 flex-shrink-0">
      <Shimmer className="w-14 h-14 rounded-full mx-auto" />
      <Shimmer className="h-3.5 w-24 mx-auto mt-3" />
      <Shimmer className="h-2.5 w-16 mx-auto mt-1.5" />
      <Shimmer className="h-5 w-20 mx-auto mt-2 rounded-full" />
    </div>
  );
}

export function SkeletonProfileCard() {
  return (
    <div className="max-w-md mx-auto space-y-4 px-4 py-6">
      <div className="bg-card rounded-3xl shadow-card overflow-hidden">
        <Shimmer className="h-24 rounded-none" />
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <Shimmer className="w-20 h-20 rounded-2xl ring-4 ring-white" />
          </div>
          <Shimmer className="h-5 w-40" />
          <Shimmer className="h-3 w-28 mt-2" />
          <Shimmer className="h-3 w-full mt-2" />
          <Shimmer className="h-3 w-4/5 mt-1.5" />
        </div>
      </div>
      <div className="bg-card rounded-3xl shadow-card p-5 space-y-3">
        <Shimmer className="h-4 w-28" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonNotification() {
  return (
    <div className="flex items-start gap-3 p-4">
      <Shimmer className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Shimmer className="h-3 w-3/4" />
        <Shimmer className="h-2.5 w-1/2" />
      </div>
    </div>
  );
}

export default Shimmer;
