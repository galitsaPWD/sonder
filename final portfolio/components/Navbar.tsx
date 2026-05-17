"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, User, Code2, Briefcase, Mail, FileText } from "lucide-react";

const navLinks = [
  { name: "About", href: "#about" },
  { name: "Skills", href: "#skills" },
  { name: "Projects", href: "#projects" },
  { name: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [isDark, setIsDark] = useState(true);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6" suppressHydrationWarning>
        <div className="w-full max-w-[860px] px-6 flex justify-between items-center" suppressHydrationWarning>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-default"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border bg-surface block sm:hidden">
              <img 
                src="/av/avatar_default.png" 
                alt="Carlwyne Avatar" 
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            <span className="text-xl font-medium tracking-tighter">CM</span>
          </motion.div>

          <div className="flex items-center gap-8">
            <ul className="hidden sm:flex gap-6">
              {navLinks.map((link) => (
                <motion.li 
                  key={link.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <a 
                    href={link.href}
                    className="relative text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200 group"
                  >
                    {link.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-text-primary transition-all duration-300 group-hover:w-full" />
                  </a>
                </motion.li>
              ))}
            </ul>

            <div className="flex items-center gap-6">
              {/* Desktop Theme Toggle */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => setIsDark(!isDark)}
                className="p-2.5 rounded-full bg-surface border border-border text-text-primary hover:bg-background transition-colors cursor-none"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Floating Bottom Dock */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex sm:hidden items-center justify-between gap-6 px-6 py-3 rounded-full backdrop-blur-2xl border ${
          isDark 
            ? "bg-black/40 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]" 
            : "bg-white/60 border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
        }`} 
        suppressHydrationWarning
      >
        {navLinks.map((link) => {
          const Icon = link.name === "About" ? User :
                       link.name === "Skills" ? Code2 :
                       link.name === "Projects" ? Briefcase : Mail;
          return (
            <motion.a 
              key={link.name}
              href={link.href}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className={`p-1.5 cursor-none transition-colors ${
                isDark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"
              }`}
              aria-label={link.name}
            >
              <Icon size={20} strokeWidth={1.5} />
            </motion.a>
          );
        })}

        {/* Resume Icon */}
        <motion.a 
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className={`p-1.5 cursor-none transition-colors ${
            isDark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"
          }`}
          aria-label="Resume"
        >
          <FileText size={20} strokeWidth={1.5} />
        </motion.a>
      </div>

      {/* Floating Resume Action Button (Desktop Only) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 z-50 hidden sm:block"
        suppressHydrationWarning
      >
        <a 
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-text-primary text-background border border-text-primary hover:bg-background hover:text-text-primary active:scale-95 transition-all duration-300 shadow-[0_12px_24px_rgba(0,0,0,0.2)] text-xs font-semibold uppercase tracking-wider cursor-none"
        >
          <FileText size={14} />
          <span>Resume</span>
        </a>
      </motion.div>
    </>
  );
}
