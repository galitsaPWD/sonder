"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const moods = [
  { src: "/av/avatar_default.png",         label: "default" },
  { src: "/av/avatar_sad.png",     label: "sad"     },
  { src: "/av/avatar_wink.png",    label: "wink"    },
  { src: "/av/avatar_shocked.png", label: "shocked" },
];

export default function AvatarMood() {
  const [currentMood, setCurrentMood] = useState(0);

  const handleMouseEnter = () => {
    // Pick one random non-default mood and stay on it
    const next = Math.floor(Math.random() * (moods.length - 1)) + 1;
    setCurrentMood(next);
  };

  const handleMouseLeave = () => {
    setCurrentMood(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.4 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
      className="relative w-64 h-64 rounded-full overflow-hidden bg-background border-2 border-black dark:border-white/20 flex-shrink-0 cursor-none select-none"
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={moods[currentMood].label}
          src={moods[currentMood].src}
          alt={`Carlwyne — ${moods[currentMood].label}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </AnimatePresence>

      {/* Subtle hover glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
}
