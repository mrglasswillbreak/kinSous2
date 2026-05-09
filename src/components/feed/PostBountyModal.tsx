"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, MapPin, DollarSign, Image as ImageIcon, Loader2, CheckCircle } from "lucide-react";
import type { BountyCategory } from "@/types";
import { categoryLabels } from "@/lib/mock-data";

interface PostBountyModalProps {
  open: boolean;
  onClose: () => void;
}

const categories = Object.keys(categoryLabels) as BountyCategory[];

const steps = ["Details", "Location", "Budget"];

export default function PostBountyModal({ open, onClose }: PostBountyModalProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "GROCERY" as BountyCategory,
    tags: "",
    city: "",
    country: "Nigeria",
    address: "",
    budget: "",
    currency: "NGN" as "USD" | "NGN",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const canProceed = [
    form.title.length >= 10 && form.description.length >= 20 && !!form.category,
    form.city.length >= 2 && form.address.length >= 5,
    Number(form.budget) > 0,
  ][step];

  const handleNext = () => {
    if (step < 2) { setStep((s) => s + 1); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setStep(0);
        setForm({
          title: "", description: "", category: "GROCERY", tags: "",
          city: "", country: "Nigeria", address: "",
          budget: "", currency: "NGN",
        });
        onClose();
      }, 2000);
    }, 1400);
  };

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
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-badge rounded-full mx-auto mt-3 flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-charcoal">Post a Bounty</h2>
                <p className="text-xs text-muted">Step {step + 1} of 3 – {steps[step]}</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}>
                <X size={20} className="text-muted" />
              </motion.button>
            </div>

            {/* Step indicator */}
            <div className="px-5 flex-shrink-0">
              <div className="flex gap-1.5">
                {steps.map((s, i) => (
                  <motion.div
                    key={s}
                    animate={{ flex: i === step ? 2 : 1 }}
                    className={`h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-badge"}`}
                  />
                ))}
              </div>
            </div>

            {/* Form content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 gap-3"
                  >
                    <motion.div
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle size={36} className="text-secondary-500" />
                    </motion.div>
                    <p className="text-xl font-bold text-charcoal">Bounty Posted!</p>
                    <p className="text-muted text-sm text-center">
                      Helpers in your area will start bidding shortly.
                    </p>
                  </motion.div>
                ) : step === 0 ? (
                  <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-charcoal block mb-1.5">Title</label>
                      <input
                        value={form.title} onChange={set("title")}
                        placeholder="e.g. Need fresh Egusi leaves from Wuse market"
                        className="w-full px-4 py-3 border border-card-border rounded-2xl text-sm bg-input-surface text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-200"
                      />
                      <p className="text-xs text-muted mt-1">{form.title.length}/80 chars (min 10)</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-charcoal block mb-1.5">Description</label>
                      <textarea
                        value={form.description} onChange={set("description")}
                        rows={4} placeholder="Describe exactly what you need, quality requirements, any special instructions…"
                        className="w-full px-4 py-3 border border-card-border rounded-2xl text-sm bg-input-surface text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-charcoal block mb-1.5">Category</label>
                      <div className="relative">
                        <select
                          value={form.category} onChange={set("category")}
                          className="w-full px-4 py-3 border border-card-border rounded-2xl text-sm bg-input-surface text-charcoal appearance-none focus:outline-none focus:ring-2 focus:ring-primary-200"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>{categoryLabels[c]}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-charcoal block mb-1.5">Tags (comma-separated)</label>
                      <input
                        value={form.tags} onChange={set("tags")}
                        placeholder="egusi, fresh, west-african"
                        className="w-full px-4 py-3 border border-card-border rounded-2xl text-sm bg-input-surface text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-200"
                      />
                    </div>
                    <div className="border-2 border-dashed border-card-border rounded-2xl p-6 flex flex-col items-center gap-2 text-muted cursor-pointer hover:border-primary-200 transition-colors">
                      <ImageIcon size={24} strokeWidth={1.5} />
                      <p className="text-sm">Add reference photos (optional)</p>
                      <p className="text-xs">Tap to upload</p>
                    </div>
                  </motion.div>
                ) : step === 1 ? (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="flex items-start gap-2 bg-primary-50 rounded-2xl p-3">
                      <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-charcoal">
                        Your location is used to find nearby Helpers. Only your city is shown publicly.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-charcoal block mb-1.5">Street / Area</label>
                      <input
                        value={form.address} onChange={set("address")}
                        placeholder="e.g. Wuse Zone 4, near Jabi Lake"
                        className="w-full px-4 py-3 border border-card-border rounded-2xl text-sm bg-input-surface text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-charcoal block mb-1.5">City</label>
                      <input
                        value={form.city} onChange={set("city")}
                        placeholder="e.g. Abuja, Lagos, Atlanta"
                        className="w-full px-4 py-3 border border-card-border rounded-2xl text-sm bg-input-surface text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-charcoal block mb-1.5">Country</label>
                      <div className="relative">
                        <select
                          value={form.country} onChange={set("country")}
                          className="w-full px-4 py-3 border border-card-border rounded-2xl text-sm bg-input-surface text-charcoal appearance-none focus:outline-none focus:ring-2 focus:ring-primary-200"
                        >
                          <option>Nigeria</option>
                          <option>United States</option>
                          <option>United Kingdom</option>
                          <option>Canada</option>
                          <option>Ghana</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-charcoal block mb-1.5">Budget</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                            {form.currency === "USD" ? "$" : "₦"}
                          </span>
                          <input
                            type="number" value={form.budget} onChange={set("budget")}
                            placeholder="0"
                            className="w-full pl-7 pr-4 py-3 border border-card-border rounded-2xl text-sm bg-input-surface text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-200"
                          />
                        </div>
                      </div>
                      <div className="w-28">
                        <label className="text-xs font-semibold text-charcoal block mb-1.5">Currency</label>
                        <div className="relative">
                          <select
                            value={form.currency} onChange={set("currency")}
                            className="w-full px-3 py-3 border border-card-border rounded-2xl text-sm bg-input-surface text-charcoal appearance-none focus:outline-none focus:ring-2 focus:ring-primary-200"
                          >
                            <option value="NGN">NGN ₦</option>
                            <option value="USD">USD $</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-secondary-50 rounded-2xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-secondary-700">Pricing tips</p>
                      <ul className="text-xs text-secondary-600 space-y-1">
                        <li>• Grocery run (30 min): ₦2,000–5,000 / $10–25</li>
                        <li>• Cooking help (1 hr): ₦3,000–8,000 / $15–40</li>
                        <li>• Catering (event): ₦50,000+ / $200+</li>
                      </ul>
                    </div>

                    <div className="bg-subtle rounded-2xl p-4 space-y-2 text-sm">
                      <p className="font-semibold text-charcoal">Summary</p>
                      <p className="text-muted truncate"><strong>Title:</strong> {form.title || "–"}</p>
                      <p className="text-muted"><strong>Category:</strong> {categoryLabels[form.category]}</p>
                      <p className="text-muted"><strong>Location:</strong> {form.city || "–"}, {form.country}</p>
                      <p className="text-muted">
                        <strong>Budget:</strong> {form.budget ? `${form.currency === "USD" ? "$" : "₦"}${Number(form.budget).toLocaleString()}` : "–"}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {!done && (
              <div className="px-5 py-4 border-t border-card-border flex gap-3 flex-shrink-0">
                {step > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setStep((s) => s - 1)}
                    className="flex-1 bg-badge text-charcoal py-3.5 rounded-2xl font-semibold text-sm"
                  >
                    Back
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleNext}
                  disabled={!canProceed || submitting}
                  className="flex-[2] bg-primary text-white py-3.5 rounded-2xl font-bold text-sm shadow-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Posting…</>
                  ) : step < 2 ? (
                    "Continue →"
                  ) : (
                    "Post Bounty 🎯"
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
