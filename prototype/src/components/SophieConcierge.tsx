"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUI } from "@/context/UIContext";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ATELIER_ITEMS } from "@/lib/data";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Parses [[PRODUCT:id]] tags from Sophie's response
function parseMessage(content: string): { text: string; productId: string | null } {
  const match = content.match(/\[\[PRODUCT:([^\]]+)\]\]/);
  if (match) {
    return {
      text: content.replace(/\[\[PRODUCT:[^\]]+\]\]/, "").trim(),
      productId: match[1],
    };
  }
  return { text: content, productId: null };
}

function ProductSuggestionCard({
  productId,
  onNavigate,
}: {
  productId: string;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const item = ATELIER_ITEMS.find((p) => p.id === productId);
  if (!item) return null;

  const handleClick = () => {
    onNavigate();
    router.push(`/product/${item.id}`);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15 }}
      onClick={handleClick}
      className="w-full mt-3 text-left group"
    >
      <div className="flex items-center gap-4 p-3 rounded-2xl bg-surface-container border border-primary/15 hover:border-primary/40 transition-all duration-300 hover:shadow-lg active:scale-[0.98]">
        {/* Product Image */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-high">
          <Image
            fill
            src={item.img}
            alt={item.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <p className="font-headline italic text-on-surface text-sm leading-tight truncate">
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-primary font-bold text-xs">{item.price}</span>
            <span className="w-px h-2.5 bg-outline-variant/40" />
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-[10px] text-secondary font-bold">{item.rating}</span>
            </div>
          </div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-primary/60 font-black mt-1">
            Tap to View →
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export default function SophieConcierge() {
  const { isConciergeOpen, closeConcierge } = useUI();
  const { userProfile } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi ${userProfile.name || "there"}! I'm Sophie, your personal shopper at Atelier Sanctuary. Looking for something specific, or would you like me to suggest a few pieces you might love?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/sophie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      if (data.content) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
      }
    } catch (error) {
      console.error("Concierge Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again in a moment!" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isConciergeOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeConcierge}
            className="fixed inset-0 z-[9999] bg-on-surface/40 backdrop-blur-md transition-all"
          />

          {/* Concierge Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[10000] w-full md:w-[450px] bg-surface-container-lowest shadow-[-20px_0_60px_rgba(0,0,0,0.1)] safe-area-inset flex flex-col"
          >
            {/* Header */}
            <div className="p-8 pb-6 border-b border-outline-variant/10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                      <circle cx="12" cy="12.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M7 12.5C7 9.73858 9.23858 7.5 12 7.5C14.7614 7.5 17 9.73858 17 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <circle cx="10" cy="12" r="0.7" fill="currentColor" />
                      <circle cx="14" cy="12" r="0.7" fill="currentColor" />
                      <path d="M16 14.5C16.5 14.5 17.5 15.5 17.5 16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl italic tracking-tighter text-on-surface">Sophie</h2>
                    <p className="text-[9px] uppercase tracking-[0.4em] font-black text-primary/60">Personal Shopping Advisor</p>
                  </div>
                </div>
                <button
                  onClick={closeConcierge}
                  className="w-10 h-10 rounded-full glass-surface flex items-center justify-center text-secondary hover:text-primary transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined font-thin">close</span>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar scroll-smooth"
            >
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const { text, productId } = parseMessage(m.content);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] p-5 rounded-2xl ${
                          m.role === "user"
                            ? "bg-primary text-on-primary shadow-xl rounded-tr-none"
                            : "glass-surface border border-primary/5 text-on-surface rounded-tl-none shadow-sm"
                        }`}
                      >
                        <p className={`text-xs leading-relaxed tracking-wide ${m.role === "user" ? "font-medium" : "font-light"}`}>
                          {text}
                        </p>
                      </div>

                      {/* Product Suggestion Card */}
                      {m.role === "assistant" && productId && (
                        <div className="max-w-[85%] w-full">
                          <ProductSuggestionCard
                            productId={productId}
                            onNavigate={closeConcierge}
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="glass-surface border border-primary/5 p-4 py-6 rounded-2xl rounded-tl-none flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-100 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-200 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="p-6 pt-4 pb-12 bg-surface-container-lowest border-t border-outline-variant/10">
              <form onSubmit={handleSendMessage} className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Sophie anything..."
                  className="w-full pl-6 pr-16 py-5 glass-surface border border-outline-variant/30 rounded-2xl text-on-surface text-sm tracking-wide placeholder:text-secondary/40 placeholder:text-sm transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-lg transition-all hover:scale-[1.05] active:scale-95 disabled:opacity-20 disabled:scale-100 disabled:bg-secondary"
                >
                  <span className="material-symbols-outlined text-xl">east</span>
                </button>
              </form>
              <div className="mt-4 flex justify-between items-center px-2">
                <p className="text-[10px] text-secondary tracking-[0.3em] uppercase font-bold opacity-30">Atelier · Manila</p>
                <div className="flex gap-4">
                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  <span className="w-1 h-1 rounded-full bg-primary opacity-40" />
                  <span className="w-1 h-1 rounded-full bg-primary opacity-20" />
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
