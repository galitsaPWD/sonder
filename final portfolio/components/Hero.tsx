"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] as any } },
};

const avatars = [
  "/av/avatar_default.png",
  "/av/avatar_wink.png",
  "/av/avatar_shocked.png",
  "/av/avatar_sad.png",
];

export default function Hero() {
  const [avatarIdx, setAvatarIdx] = useState(0);

  const handleMouseEnter = () => {
    const randomIdx = Math.floor(Math.random() * (avatars.length - 1)) + 1;
    setAvatarIdx(randomIdx);
  };

  const handleMouseLeave = () => {
    setAvatarIdx(0);
  };

  return (
    <section className="min-h-[75vh] md:min-h-screen flex items-start md:items-center justify-center pt-32 pb-12 md:py-0" suppressHydrationWarning>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-[860px] px-6 flex flex-col md:flex-row items-center justify-between gap-12"
        suppressHydrationWarning
      >
        {/* Left — Text */}
        <div className="flex-1">
          <motion.h1 
            variants={item}
            className="text-[clamp(3.5rem,8vw,6.5rem)] font-light tracking-tighter leading-[1.05] mb-8"
          >
            Carlwyne <br /> R. Maghari
          </motion.h1>
          
          <motion.div variants={item} className="mb-10">
            <h2 className="text-xl font-medium text-text-primary mb-4">Full-Stack Developer</h2>
            <p className="text-lg text-text-secondary max-w-xl leading-relaxed">
              Self-driven developer specializing in building production-ready web and mobile applications with a genuine commitment to engineering software that works.
            </p>
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap items-center gap-8">
            <a 
              href="#projects"
              className="px-10 py-4 rounded-full bg-text-primary text-background font-medium text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              View Projects
            </a>
            
            <a 
              href="#contact"
              className="flex items-center gap-2 text-sm font-medium text-text-primary group"
            >
              Get in Touch
              <motion.span 
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <ArrowRight size={16} />
              </motion.span>
            </a>
          </motion.div>
        </div>

        {/* Right — Interactive Avatar (Desktop Only) */}
        <motion.div 
          variants={item}
          className="hidden md:block flex-shrink-0 w-[260px] h-[260px] relative rounded-full overflow-hidden border border-border bg-surface cursor-none group -translate-y-8 lg:-translate-y-12"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <AnimatePresence>
            <motion.img 
              key={avatarIdx}
              src={avatars[avatarIdx]} 
              alt="Carlwyne Avatar" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
          </AnimatePresence>
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/10 rounded-full pointer-events-none" />
        </motion.div>

      </motion.div>
    </section>
  );
}
