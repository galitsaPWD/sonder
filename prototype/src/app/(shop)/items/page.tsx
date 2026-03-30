"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useVelocity, useSpring, useMotionValue } from "framer-motion";
import { ATELIER_ITEMS, ItemData } from "@/lib/data";
import { useCart } from "@/context/CartContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const CATEGORIES = [
  { id: "all", label: "All Items", icon: "grid_view" },
  { id: "jewelry", label: "Jewelry", icon: "diamond" },
  { id: "couture", label: "Couture", icon: "checkroom" },
  { id: "galerie", label: "Galerie", icon: "auto_stories" },
  { id: "living", label: "Living", icon: "chair" },
  { id: "essence", label: "Essence", icon: "water_drop" },
  { id: "horology", label: "Horology", icon: "watch" },
  { id: "cellar", label: "Cellar", icon: "wine_bar" },
  { id: "other", label: "Other", icon: "more_horiz" },
];

export default function Items() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 text-center text-[10px] uppercase tracking-[0.5em] text-secondary opacity-50 animate-pulse">Manifesting Curated...</div>}>
      <ItemsContent />
    </Suspense>
  );
}

function ItemsContent() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") as ItemData["category"]) || "all";
  const [activeCategory, setActiveCategory] = useState<ItemData["category"]>(initialCategory);
  const [direction, setDirection] = useState(0); // 1 = right, -1 = left
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const { addToCart } = useCart();
  const router = useRouter();

  // High-Precision Scroll & Hysteresis Stabilization
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const scrollOpacityVal = useMotionValue(1);
  const smoothedScrollOpacity = useSpring(scrollOpacityVal, { stiffness: 100, damping: 20 });
  
  // Calculate filteredItems BEFORE useEffects so it can be safely used in dependency arrays
  const filteredItems = ATELIER_ITEMS.filter(item => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Robust POV Intersection Observer for Active Item
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let entered: string | null = null;
        let left: string | null = null;
        
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-item-id');
          if (entry.isIntersecting) {
            entered = id;
          } else {
            left = id;
          }
        });
        
        if (entered) {
          setFocusedId(entered);
        } else if (left) {
          setFocusedId((prev) => (prev === left ? null : prev));
        }
      },
      { 
        // 60% of the item must be visible to trigger it (perfect for POV centering)
        threshold: 0.6,
        rootMargin: "-10% 0px -10% 0px" // Slight margin to trigger closer to true center
      }
    );

    const nodes = document.querySelectorAll('[data-item-id]');
    nodes.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [filteredItems, activeCategory]); // Re-bind observer when filters change
  
  useEffect(() => {
    const unsubscribe = scrollVelocity.onChange((v) => {
      const ABS_V = Math.abs(v);
      if (ABS_V > 150) {
        scrollOpacityVal.set(0); 
      } else if (ABS_V < 40) {
        scrollOpacityVal.set(1);
      }
    });
    return () => unsubscribe();
  }, [scrollVelocity, scrollOpacityVal]);

  useEffect(() => {
    const cat = searchParams.get("category") as ItemData["category"];
    if (cat && CATEGORIES.some(c => c.id === cat)) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  return (
    <main className="pt-12 pb-32 min-h-screen max-w-7xl mx-auto px-6 lg:px-12">
      <section className="mb-4 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">Volume IV Curated</span>
                <h1 className="font-headline text-5xl md:text-8xl italic tracking-tighter text-on-surface leading-none">Curated</h1>
            </div>
            <div className="hidden md:block pb-1">
                <p className="text-secondary text-[10px] uppercase tracking-[0.2em] max-w-xs leading-relaxed font-light italic">
                    Curated heritage objects for your collection.
                </p>
            </div>
        </div>
      </section>

      <section className="mb-4 relative group/filters">
        
        {/* Discovery Bar - Integrated Search */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 mb-4 relative group"
        >
            <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the Curated..."
                className="w-full pl-16 pr-14 py-5 glass-surface backdrop-blur-3xl border border-white/5 rounded-2xl text-on-surface text-sm tracking-widest placeholder:text-secondary/50 placeholder:italic transition-all focus:border-primary/30 focus:shadow-[0_0_40px_rgba(var(--primary-rgb),0.1)] outline-none"
            />
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none z-10 text-on-surface/70 transition-opacity">
                <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <AnimatePresence>
                {searchQuery.length > 0 && (
                    <motion.button 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-5 flex items-center z-10 text-outline hover:text-primary transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>

        <div className="overflow-x-auto hide-scrollbar -mx-6 px-6">
            <div className="flex items-center gap-6 min-w-max py-2">
                {CATEGORIES.map((cat, idx) => (
                    <button 
                        key={cat.id}
                        onClick={() => {
                            const currentIdx = CATEGORIES.findIndex(c => c.id === activeCategory);
                            const nextIdx = idx;
                            setDirection(nextIdx > currentIdx ? 1 : -1);
                            setActiveCategory(cat.id as ItemData["category"]);
                        }} 
                        className={`flex flex-col items-center gap-2 transition-all duration-500 ${activeCategory === cat.id ? 'opacity-100 scale-105' : 'opacity-30 hover:opacity-100'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeCategory === cat.id ? 'bg-primary text-on-primary shadow-xl ring-2 ring-primary/20' : 'bg-surface-container-high'}`}>
                            <span className="material-symbols-outlined text-base font-light">{cat.icon}</span>
                        </div>
                        <span className="text-[7px] uppercase tracking-[0.3em] font-black">{cat.label}</span>
                    </button>
                ))}
            </div>
        </div>
        {/* Subtle scroll hint */}
        <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-50"></div>
      </section>

      <motion.section 
        layout 
        className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 min-h-[50vh] relative"
      >
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            {filteredItems.map((item, i) => (
                <motion.div
                    layout
                    custom={direction}
                    initial={{ opacity: 0, x: direction * 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -100 }}
                    transition={{ 
                        duration: 0.5, 
                        ease: [0.22, 1, 0.36, 1], 
                        delay: i * 0.04,
                        layout: { duration: 0.4 } 
                    }}
                    key={`${activeCategory}-${item.id}`}
                    className={i % 2 !== 0 ? 'md:mt-16' : ''}
                >
                    <div 
                        data-item-id={item.id}
                        onClick={() => router.push(`/product/${item.id}`)}
                        className="group cursor-pointer block space-y-8"
                    >
                        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container-low curator-shadow border border-outline-variant/5">
                            <Image alt={item.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[10%] group-hover:grayscale-0" src={item.img}/>
                            <div className="absolute inset-0 bg-on-surface/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            {/* Cinematic POV Action Bar Overlay - Sovereign Actions */}
                            <div 
                                className={`absolute bottom-10 left-6 right-6 z-30 flex gap-4 justify-center transition-all duration-500 will-change-transform ${
                                    focusedId === item.id 
                                        ? 'opacity-100 translate-y-0 pointer-events-auto' 
                                        : 'opacity-0 translate-y-8 pointer-events-none'
                                }`}
                                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                            >
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart({ id: item.id, title: item.title, desc: item.desc, price: parseInt(item.price.replace(/[^\d]/g, '')), img: item.img });
                                    }}
                                    className="flex-1 max-w-[140px] py-3 bg-black/40 backdrop-blur-xl border border-white/20 text-[8px] uppercase tracking-[0.4em] font-black text-white hover:bg-black/60 transition-colors rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] active:scale-95"
                                >
                                    Add to Vault
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart({ id: item.id, title: item.title, desc: item.desc, price: parseInt(item.price.replace(/[^\d]/g, '')), img: item.img });
                                        router.push("/checkout");
                                    }}
                                    className="flex-1 max-w-[140px] py-3 bg-primary text-on-primary text-[8px] uppercase tracking-[0.4em] font-black rounded-xl active:scale-95 hover:scale-[1.05] transition-all shimmer-gold shadow-2xl"
                                >
                                    Buy Now
                                </button>
                            </div>

                        </div>
                        <div className="px-2 space-y-2">
                            <div className="flex justify-between items-end gap-8">
                                <div className="space-y-1 min-w-0">
                                    <h3 className="font-headline text-3xl italic tracking-tight text-on-surface group-hover:text-primary transition-colors truncate sm:whitespace-normal">
                                        {item.title}
                                    </h3>
                                    <p className="text-secondary text-[10px] uppercase tracking-[0.3em] font-medium">{item.desc}</p>
                                </div>
                                <span className="font-headline text-xl italic text-on-surface-variant opacity-80 whitespace-nowrap flex-shrink-0">
                                    {item.price}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
        {filteredItems.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-32 text-center space-y-4">
                <span className="material-symbols-outlined text-[4rem] text-primary/20">search_off</span>
                <p className="text-outline text-xs uppercase tracking-[0.4em] font-light">
                    No results found for "{searchQuery}" in this curation.
                </p>
                <button 
                    onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                    className="text-[10px] text-primary uppercase tracking-widest hover:underline pt-4 block mx-auto"
                >
                    Reset Curated
                </button>
            </motion.div>
        )}
      </motion.section>

      <section className="mt-40 mb-20 p-20 glass-surface -mx-6 lg:-mx-12 text-center rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 text-primary/5 opacity-50 group-hover:rotate-12 transition-transform duration-1000">
            <span className="material-symbols-outlined text-[15rem]">auto_stories</span>
        </div>
        <h2 className="font-headline text-5xl italic tracking-tighter mb-8 max-w-lg mx-auto leading-tight">Your Curated Selection is Ready for Official Review.</h2>
        <p className="text-secondary max-w-md mx-auto mb-12 text-[10px] uppercase tracking-[0.3em] font-light leading-relaxed">
            Authenticated collectors gain priority access to heritage drops and private viewings. Access your vault to finalize your selection.
        </p>
        <Link href="/checkout" className="inline-block px-16 py-6 bg-on-surface text-surface text-[10px] font-black uppercase tracking-[0.4em] rounded-md shadow-2xl hover:scale-105 transition-all shimmer-gold text-on-primary">
            Access My Vault
        </Link>
      </section>
    </main>
  );
}
