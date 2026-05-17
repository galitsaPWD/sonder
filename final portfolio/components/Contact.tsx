"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Mail, Code, Link as LinkIcon, Phone, Check, Copy } from "lucide-react";

const links = [
  { 
    name: "Email", 
    value: "magharicarlwyne@gmail.com", 
    href: "mailto:magharicarlwyne@gmail.com", 
    icon: Mail,
    copyable: true 
  },
  { 
    name: "GitHub", 
    value: "github.com/Carlwyne-Dev", 
    href: "https://github.com/Carlwyne-Dev", 
    icon: Code,
    copyable: false 
  },
  { 
    name: "LinkedIn", 
    value: "linkedin.com/in/carlwyne-maghari", 
    href: "https://linkedin.com/in/carlwyne-maghari-122946370", 
    icon: LinkIcon,
    copyable: false 
  },
  { 
    name: "Phone", 
    value: "0930 486 5506", 
    href: "tel:09304865506", 
    icon: Phone,
    copyable: true 
  },
];

export default function Contact() {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, value: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  return (
    <section id="contact" className="py-16 md:py-32 flex justify-center bg-background" suppressHydrationWarning>
      <div className="w-full max-w-[860px] px-6" suppressHydrationWarning>
        <header className="mb-20">
          <span className="text-[11px] uppercase tracking-[0.12em] text-text-muted font-bold mb-6 block">Contact</span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-light tracking-tighter text-text-primary mb-6"
          >
            Let's build something.
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <p className="text-lg text-text-secondary max-w-md">
              Currently open for freelance web and mobile development projects, as well as full-time opportunities.
            </p>
            <p className="text-[11px] uppercase tracking-[0.1em] text-text-muted">
              Pulupandan, Negros Occidental, Philippines
            </p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {links.map((link, i) => (
            <motion.a
              key={link.name}
              href={link.href}
              target={link.copyable ? undefined : "_blank"}
              rel={link.copyable ? undefined : "noopener noreferrer"}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group relative flex flex-col justify-between p-8 rounded-3xl bg-background border border-white/10 hover:border-white transition-all duration-500 overflow-hidden"
              suppressHydrationWarning
            >
              <div className="relative z-10" suppressHydrationWarning>
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-background border border-white/10 flex items-center justify-center text-text-primary/50 group-hover:text-text-primary group-hover:scale-110 group-hover:border-white transition-all duration-500">
                    <link.icon size={24} strokeWidth={1.5} />
                  </div>
                  
                  {link.copyable ? (
                    <button
                      onClick={(e) => handleCopy(e, link.value)}
                      className="p-2 rounded-xl hover:bg-white/5 text-text-primary/50 hover:text-text-primary transition-all duration-300"
                      title="Copy to clipboard"
                    >
                      <AnimatePresence mode="wait">
                        {copiedValue === link.value ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                          >
                            <Check size={18} className="text-text-primary" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                          >
                            <Copy size={18} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  ) : (
                    <div className="p-2 text-text-primary/50 group-hover:text-text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-500">
                      <ArrowUpRight size={20} strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-text-primary/50 font-bold mb-2">{link.name}</div>
                  <div className="text-base font-medium text-text-primary truncate font-mono">
                    {link.value}
                  </div>
                </div>
              </div>

              {/* Status indicator for "Copied" */}
              <AnimatePresence>
                {copiedValue === link.value && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-4 right-8 text-[10px] uppercase tracking-widest text-text-primary font-bold"
                  >
                    Copied!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
