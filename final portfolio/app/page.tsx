"use client";

import { motion } from "framer-motion";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <motion.main 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col min-h-screen"
    >
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Contact />

      
      <footer className="py-12 flex justify-center border-t border-border">
        <div className="w-full max-w-[860px] px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[11px] uppercase tracking-widest text-text-muted">
            © 2026 Carlwyne Maghari
          </p>
          <p className="text-[11px] uppercase tracking-widest text-text-muted">
            Built with Next.js & Framer Motion
          </p>
        </div>
      </footer>
    </motion.main>
  );
}


