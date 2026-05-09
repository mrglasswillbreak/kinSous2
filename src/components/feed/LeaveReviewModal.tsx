"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Send, CheckCircle } from "lucide-react";

interface LeaveReviewModalProps {
  open: boolean;
  onClose: () => void;
  helperName: string;
  helperAvatarUrl: string;
}

export default function LeaveReviewModal({
  open,
  onClose,
  helperName,
  helperAvatarUrl,
}: LeaveReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = () => {
    if (rating === 0 || !comment.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setRating(0);
        setComment("");
        onClose();
      }, 2000);
    }, 1000);
  };

  const stars = hovered || rating;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl"
          >
            <div className="w-10 h-1 bg-badge rounded-full mx-auto mt-3" />

            <div className="px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-charcoal">Leave a Review</h2>
              <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}>
                <X size={20} className="text-muted" />
              </motion.button>
            </div>

            <div className="px-5 pb-8 space-y-5">
              {done ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8 gap-3"
                >
                  <div className="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center">
                    <CheckCircle size={36} className="text-secondary-500" />
                  </div>
                  <p className="text-xl font-bold text-charcoal">Review Submitted!</p>
                  <p className="text-muted text-sm text-center">Thank you for your feedback.</p>
                </motion.div>
              ) : (
                <>
                  {/* Helper */}
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={helperAvatarUrl}
                      alt={helperName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-primary-100"
                    />
                    <div>
                      <p className="font-bold text-charcoal">{helperName}</p>
                      <p className="text-xs text-muted">How was your experience?</p>
                    </div>
                  </div>

                  {/* Star rating */}
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Rating</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <motion.button
                          key={s}
                          whileTap={{ scale: 0.85 }}
                          onMouseEnter={() => setHovered(s)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(s)}
                          className="focus:outline-none"
                        >
                          <Star
                            size={32}
                            className={`transition-colors ${
                              s <= stars
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200 fill-gray-200"
                            }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                    {stars > 0 && (
                      <p className="text-xs text-muted mt-1">
                        {["", "Poor", "Fair", "Good", "Great", "Excellent!"][stars]}
                      </p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Comment</p>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder="Share your experience with this helper…"
                      className="w-full px-4 py-3 border border-card-border rounded-2xl text-sm bg-input-surface text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSubmit}
                    disabled={rating === 0 || !comment.trim() || submitting}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl font-bold shadow-primary disabled:opacity-50"
                  >
                    <Send size={16} />
                    {submitting ? "Submitting…" : "Submit Review"}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
