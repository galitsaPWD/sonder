"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUI } from "@/context/UIContext";

export default function Sidebar() {
  const { isSidebarOpen, closeSidebar, openConcierge } = useUI();

  const NAV_LINKS = [
    { label: "Home", href: "/dashboard", icon: "home" },
    { label: "Curated", href: "/items?category=galerie", icon: "auto_awesome" },
    { label: "Vault", href: "/checkout", icon: "account_balance_wallet" },
    { label: "Profile", href: "/profile", icon: "person" },
  ];

  const COLLECTIONS = [
    { label: "Jewelry", href: "/items?category=jewelry" },
    { label: "Couture", href: "/items?category=couture" },
    { label: "Horology", href: "/items?category=horology" },
    { label: "Cellar", href: "/items?category=cellar" },
  ];

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 z-[70] bg-on-surface/30 backdrop-blur-sm transition-all"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 z-[80] w-[300px] bg-surface-container-lowest shadow-2xl safe-area-inset flex flex-col h-full"
          >
            {/* Fixed Header */}
            <div className="p-8 pb-4">
              <div className="flex justify-between items-center mb-8">
                <span className="font-headline text-2xl tracking-[0.2em] uppercase text-on-surface">Atelier</span>
                <button onClick={closeSidebar} className="text-secondary hover:text-primary active:scale-90 transition-all p-2 -mr-2">
                  <span className="material-symbols-outlined font-thin">close</span>
                </button>
              </div>

              {/* Fixed Archival Hub (Now pinned at the top) */}
              <nav className="space-y-6 mb-8">
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/60 mb-8 border-b border-primary/5 pb-2">Archival Hub</p>
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={closeSidebar}
                    className="flex items-center gap-6 text-secondary hover:text-primary transition-all group py-1"
                  >
                    <span className="material-symbols-outlined text-[22px] font-thin opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all">{link.icon}</span>
                    <span className="font-label text-xs uppercase tracking-[0.3em] font-bold group-hover:tracking-[0.4em] transition-all">{link.label}</span>
                  </Link>
                ))}
              </nav>
              {/* Fixed Curated Items Label (Now pinned above scroll area) */}
              <nav className="mb-4">
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/60 border-b border-primary/5 pb-2">Curated Items</p>
              </nav>
            </div>

            {/* Scrollable List ONLY */}
            <div className="flex-1 overflow-y-auto px-8 py-0 thin-scrollbar scroll-smooth overflow-x-hidden">
              <nav className="space-y-6 pb-12 pt-1">
                {COLLECTIONS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={closeSidebar}
                    className="block text-secondary hover:text-primary transition-all group py-2"
                  >
                    <span className="font-label text-xs uppercase tracking-[0.2em] font-bold group-hover:pl-4 group-hover:tracking-[0.3em] transition-all">{link.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Fixed Concierge Footer */}
            <div className="p-8 border-t border-outline-variant/10 bg-surface-container-lowest">
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/60 mb-4 px-1">Concierge</p>
                <div className="bg-surface-container-low p-6 rounded-2xl border border-primary/5 shadow-inner">
                    <p className="text-[11px] text-on-surface font-headline italic mb-2">Curatorial Support</p>
                    <p className="text-[10px] text-secondary leading-relaxed mb-4 font-medium opacity-60 italic">Sophie is available for bespoke viewings and logistics.</p>
                    <button 
                        onClick={openConcierge}
                        className="w-full bg-primary text-on-primary py-3.5 rounded-xl text-[9px] uppercase tracking-[0.4em] font-black hover:bg-on-surface transition-all active:scale-95 shadow-xl"
                    >
                        Contact Sophie
                    </button>
                </div>
                
                <div className="mt-8 flex items-center justify-between text-outline/30 text-[9px] uppercase tracking-[0.4em] font-bold">
                    <span>v 2.1.0</span>
                    <span>© Atelier</span>
                </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
