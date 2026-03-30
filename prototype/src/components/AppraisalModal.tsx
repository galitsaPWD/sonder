"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface AppraisalModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    title: string;
    id: string;
  } | null;
}

export default function AppraisalModal({ isOpen, onClose, item }: AppraisalModalProps) {
  const [quality, setQuality] = useState(5);
  const [usability, setUsability] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 1500);
  };

  if (!item) return null;

  const StarRating = ({ value, onChange, label }: { value: number, onChange: (v: number) => void, label: string }) => (
    <div className="space-y-4 text-center">
      <div className="text-[8px] uppercase tracking-[0.3em] font-black text-secondary">
        <span>{label}</span>
      </div>
      <div className="flex justify-center gap-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className={`material-symbols-outlined text-4xl transition-all duration-300 ${
              star <= value ? "text-primary scale-110 drop-shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" : "text-secondary/10 hover:text-primary/30"
            }`}
            style={{ fontVariationSettings: `'FILL' ${star <= value ? 1 : 0}, 'wght' 200` }}
          >
            star
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface/80 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg glass-surface p-12 rounded-[2.5rem] border border-primary/20 shadow-2xl relative z-10 space-y-10"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-8 text-secondary/30 hover:text-primary transition-all duration-300 active:scale-95"
            >
              <span className="material-symbols-outlined text-2xl font-light">close</span>
            </button>

            <div className="text-center space-y-3">
              <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-primary">Archival Review Manifest</span>
              <h2 className="font-headline italic text-4xl tracking-tighter text-on-surface leading-none">{item.title}</h2>
            </div>

            <div className="space-y-10">
              {/* Sliders */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-[0.3em] font-bold text-secondary">
                    <span>Quality of Manifestation</span>
                    <span className="text-primary">{quality}/5</span>
                  </div>
                  <input type="range" min="1" max="5" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full h-[2px] bg-secondary/10 accent-primary cursor-pointer" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-[0.3em] font-bold text-secondary">
                    <span>Functional Utility</span>
                    <span className="text-primary">{usability}/5</span>
                  </div>
                  <input type="range" min="1" max="5" value={usability} onChange={(e) => setUsability(parseInt(e.target.value))} className="w-full h-[2px] bg-secondary/10 accent-primary cursor-pointer" />
                </div>
              </div>

              <StarRating label="Overall Archival Rating" value={overallRating} onChange={setOverallRating} />

              {/* Testimony */}
              <div className="space-y-4">
                <label className="text-[8px] uppercase tracking-[0.3em] font-bold text-secondary">Collector Testimony</label>
                <textarea 
                  placeholder="Manifest your perspective on this artifact..."
                  className="w-full bg-surface-container p-6 rounded-2xl border border-white/5 text-[10px] uppercase tracking-widest min-h-[120px] focus:border-primary/40 outline-none transition-all resize-none shadow-inner"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-5 bg-primary text-on-primary text-[10px] uppercase tracking-[0.5em] font-black rounded-2xl shimmer-gold shadow-2xl disabled:opacity-50 transition-all active:scale-95 overflow-hidden relative"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {submitting ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-on-primary animate-pulse" />
                    Confirming...
                  </>
                ) : (
                  "Submit Review"
                )}
              </span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
