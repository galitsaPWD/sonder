"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ATELIER_ITEMS } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";

export default function Product() {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [showFloatingActions, setShowFloatingActions] = useState(true); // Default to true: POV-first!
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  
  const id = params.id as string;
  const item = ATELIER_ITEMS.find((product) => product.id === id);

  useEffect(() => {
    // RESET: When navigating between products (Vase -> Lamp), 
    // we MUST reset to true so the next product starts with a visible bar (POV-first).
    setShowFloatingActions(true);
  }, [id]);

  useEffect(() => {
    // We observe the sentinel to know when the static CTA buttons enter the user's POV.
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isMobile = window.innerWidth < 1024; // Desktop uses the sticky sidebar
        if (!isMobile) {
          setShowFloatingActions(false);
          return;
        }
        // Force show if the button section is NOT visible (above the 80px nav bar)
        setShowFloatingActions(!entry.isIntersecting);
      },
      { 
        threshold: 0,
        rootMargin: '0px 0px -80px 0px' // Exactly matches the BottomNavBar height
      }
    );

    const target = buttonRef.current;
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, [id, item?.id]); // Re-mount when product changes to solve "stuck" state 
  if (!item) {
    return (
        <main className="pt-32 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center h-screen">
          <span className="material-symbols-outlined text-6xl text-outline mb-6">search_off</span>
          <h1 className="font-headline italic text-4xl mb-4 tracking-tighter text-on-background">Artifact Unavailable</h1>
          <p className="text-secondary mb-12">The curated piece you are seeking does not exist or has been removed from the galerie.</p>
          <button onClick={() => router.back()} className="bg-surface-container-high py-4 px-8 rounded-md font-label uppercase text-[11px] tracking-[0.2em] font-bold hover:bg-surface-container-highest transition-colors">
              Return to Collection
          </button>
        </main>
    );
  }

  const handleAdd = () => {
    addToCart({
      id: item.id,
      title: item.title,
      desc: item.desc,
      price: item.priceValue,
      img: item.img
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // Provide some related items based on category
  const relatedItems = ATELIER_ITEMS.filter(i => i.category === item.category && i.id !== item.id).slice(0, 3);
  // Pad with random items if category is too small
  if (relatedItems.length < 3) {
      const padding = ATELIER_ITEMS.filter(i => i.id !== item.id && !relatedItems.includes(i)).slice(0, 3 - relatedItems.length);
      relatedItems.push(...padding);
  }

  return (
    <div className="min-h-screen pb-32">
        <section className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-20 items-start mt-6">
            <div className="md:col-span-7 space-y-12 animate-fade-in">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container-low curator-shadow border border-outline-variant/5">
                    <Image fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover hover:scale-110 transition-transform duration-1000 grayscale-[5%] hover:grayscale-0" src={item.img} alt={item.title} />
                </div>
            </div>
            
            <div className="md:col-span-5 md:sticky md:top-32 space-y-12 mt-12 animate-fade-in-right">
                <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-outline-variant/10 pb-6 mb-8">
                        <span className="text-primary font-label uppercase tracking-[0.4em] text-[10px] font-bold">Registry No. {item.id}</span>
                        <div className="h-px w-8 bg-outline-variant/20"></div>
                        <span className="text-secondary font-label uppercase tracking-[0.3em] text-[9px] font-medium">Bespoke Availability</span>
                    </div>
                    <h1 className="font-headline italic text-5xl lg:text-7xl leading-[1.05] text-on-surface tracking-tighter">
                        {item.title}
                    </h1>
                    <div className="flex items-baseline gap-6 pt-4">
                        <span className="text-4xl font-headline italic text-on-surface opacity-90 tracking-tighter">{item.price}</span>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-secondary font-light">Authenticated Pricing</span>
                    </div>

                    {/* Sovereign Social Proof */}
                    <div className="flex items-center gap-6 pt-4 border-t border-outline-variant/10">
                        <div className="flex items-center gap-1.5">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className={`material-symbols-outlined text-sm ${i < Math.floor(item.rating) ? 'text-primary fill-1' : 'text-outline-variant'}`}>
                                    star
                                </span>
                            ))}
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface pl-2">
                                {item.rating} <span className="text-secondary/50">({item.reviewCount})</span>
                            </span>
                        </div>
                        <div className="h-4 w-px bg-outline-variant/30"></div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary italic">
                                {item.soldCount} Sold
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-10">
                    <p className="text-secondary text-sm leading-relaxed max-w-sm font-light uppercase tracking-widest text-[11px] border-l-2 border-primary/20 pl-6 italic">
                        {item.longDesc}
                    </p>
                    <div className="space-y-4 pt-6 border-t border-outline-variant/10">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-secondary">Material Hallmark</span>
                            <span className="text-xs text-on-surface italic font-headline">{item.desc}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-secondary">Curated Category</span>
                            <span className="text-xs text-on-surface capitalize italic font-headline">{item.category}</span>
                        </div>
                    </div>
                </div>
                
                <div ref={buttonRef} className="pt-12 space-y-6">
                    <button 
                        onClick={() => {
                            addToCart({ id: item.id, title: item.title, desc: item.desc, price: item.priceValue, img: item.img });
                            router.push("/checkout?step=settlement");
                        }} 
                        className="w-full py-6 rounded-md font-label uppercase text-[11px] tracking-[0.4em] font-black shadow-2xl transition-all active:scale-[0.98] hover:scale-[1.02] bg-primary text-on-primary shimmer-gold shadow-[0_20px_40px_rgba(var(--primary-rgb),0.2)]"
                    >
                        Buy Now
                    </button>
                    <button 
                        onClick={handleAdd} 
                        className={`w-full py-5 rounded-md font-label uppercase text-[10px] tracking-[0.3em] font-bold transition-all active:scale-[0.98]
                        ${isAdded ? 'bg-primary/20 text-primary grayscale cursor-not-allowed' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
                    >
                        {isAdded ? "Secured in Vault" : "Add to Vault"}
                    </button>
                </div>
                <div className="pt-8 flex items-center justify-center gap-4 text-outline-variant opacity-60">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    <span className="text-[8px] uppercase tracking-[0.5em] font-bold">Individually Hallmarked in our Manila Atelier</span>
                </div>
            </div>
        </section>
        
        <section className="mt-40 glass-surface py-32 rounded-3xl px-12 relative overflow-hidden group">
            <div className="absolute -right-40 -bottom-40 text-primary/5 opacity-30 group-hover:rotate-12 transition-transform duration-1000">
                <span className="material-symbols-outlined text-[30rem]">military_tech</span>
            </div>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-center relative z-10">
                <div className="order-2 md:order-1 space-y-12">
                    <div className="space-y-4">
                        <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-primary">The Artisan Process</span>
                        <h2 className="font-headline text-5xl lg:text-6xl italic tracking-tighter text-on-surface leading-tight">{item.craftTitle}</h2>
                    </div>
                    <div className="space-y-8 text-on-surface-variant text-[14px] leading-relaxed uppercase tracking-widest font-light">
                        <p className="border-l border-primary/20 pl-8">{item.craftP1}</p>
                        <p className="border-l border-primary/20 pl-8">{item.craftP2}</p>
                    </div>
                    <div className="pt-10">
                        <Link href="/items" className="bg-on-surface text-surface px-12 py-5 rounded-md text-[10px] uppercase tracking-[0.4em] font-black hover:scale-110 transition-all shadow-xl">
                            Explore Collection 
                        </Link>
                    </div>
                </div>
                <div className="relative order-1 md:order-2 rounded-3xl overflow-hidden h-[640px] curator-shadow group-hover:scale-[1.02] transition-transform duration-700">
                    <Image fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" src={item.img} alt="Craft detail" />
                </div>
            </div>
        </section>

        {/* Curator Perspectives (Reviews) */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-32 border-t border-outline-variant/10">
            <div className="flex flex-col md:flex-row justify-between items-baseline gap-8 mb-20 animate-fade-in">
                <div className="space-y-4">
                    <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-primary">Archival Feedback</span>
                    <h2 className="font-headline text-5xl italic tracking-tighter text-on-surface">Curator Perspectives</h2>
                </div>
                <div className="flex items-center gap-6 glass-surface px-8 py-5 rounded-2xl border border-primary/10">
                    <div className="text-center">
                        <p className="text-3xl font-headline italic text-primary">{item.rating}</p>
                        <p className="text-[8px] uppercase tracking-widest font-black text-secondary">AURA SCORE</p>
                    </div>
                    <div className="w-px h-10 bg-outline-variant/20"></div>
                    <div className="text-center">
                        <p className="text-3xl font-headline italic text-on-surface">{item.reviewCount}</p>
                        <p className="text-[8px] uppercase tracking-widest font-black text-secondary">ENTRIES</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {item.reviews.length > 0 ? (
                    item.reviews.map((review, i) => (
                        <div key={i} className="p-10 rounded-3xl bg-surface-container-low border border-outline-variant/5 shadow-2xl space-y-6 hover:translate-y-[-4px] transition-transform duration-500 group">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface">Curator {review.curator}</p>
                                    <p className="text-[9px] text-secondary/60 font-medium italic">{review.date}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, starIdx) => (
                                        <span key={starIdx} className={`material-symbols-outlined text-[10px] ${starIdx < review.rating ? 'text-primary' : 'text-outline-variant/30'}`}>
                                            star
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-on-surface-variant font-light italic leading-relaxed border-l-2 border-primary/20 pl-6 group-hover:border-primary transition-colors">
                                "{review.comment}"
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="md:col-span-2 text-center py-20 bg-surface-container-low/50 rounded-3xl border border-dashed border-outline-variant/20">
                        <span className="material-symbols-outlined text-4xl text-outline-variant/40 mb-4 font-light">edit_note</span>
                        <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-secondary italic">This artifact awaits its first curatorial entry.</p>
                    </div>
                )}
            </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-32">
            <div className="mb-16">
                <h3 className="font-label uppercase tracking-[0.3em] text-[10px] text-secondary text-center mb-4">Complete the Curation</h3>
                <div className="h-px bg-outline-variant/20 w-12 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedItems.map((relItem) => (
                    <Link href={`/product/${relItem.id}`} key={relItem.id} className="space-y-4 group">
                        <div className="relative aspect-[4/5] bg-surface-container-lowest rounded-lg overflow-hidden">
                            <Image fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-700" src={relItem.img} alt={relItem.title} />
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <span className="font-body text-xs text-on-surface">{relItem.title}</span>
                            <span className="font-body text-xs text-secondary">{relItem.price}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>

        {/* Floating Action Bar */}
        <AnimatePresence>
            {showFloatingActions && (
                <motion.div 
                    key={`floating-bar-${item.id}`} // Unique key + logic reset means no "stuck" stale data
                    initial={{ y: 20, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.95 }}
                    transition={{ 
                        duration: 0.4,
                        ease: [0.33, 1, 0.68, 1]
                    }}
                    className="fixed bottom-32 left-4 right-4 sm:left-6 sm:right-6 z-[100] max-w-5xl mx-auto"
                >
                    <div className="bg-surface-container-highest/98 backdrop-blur-2xl p-3 sm:p-4 rounded-[2rem] border border-primary/20 shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex items-center justify-between gap-4 overflow-hidden">
                        <div className="flex items-center gap-4 pl-4">
                            <div className="space-y-1">
                                <h4 className="font-headline italic text-on-surface text-lg leading-none hidden sm:block">{item.title}</h4>
                                <div className="flex items-center gap-3">
                                    <span className="text-primary font-bold text-sm tracking-tighter">{item.price}</span>
                                    <div className="h-2.5 w-px bg-outline-variant/30"></div>
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[10px] text-primary fill-1">star</span>
                                        <span className="text-[10px] font-bold text-secondary tracking-widest">{item.rating}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleAdd}
                                className={`h-12 w-12 sm:w-auto sm:px-8 rounded-xl sm:rounded-2xl font-label uppercase text-[10px] tracking-[0.2em] font-bold transition-all active:scale-[0.98] flex items-center justify-center
                                ${isAdded ? 'bg-primary/10 text-primary cursor-not-allowed' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
                            >
                                <span className="material-symbols-outlined text-lg sm:hidden" style={!isAdded ? {fontVariationSettings: "'FILL' 1"} : {}}>
                                    {isAdded ? 'check' : 'account_balance_wallet'}
                                </span>
                                <span className="hidden sm:inline">{isAdded ? "Secured" : "Add to Vault"}</span>
                            </button>
                            <button 
                                onClick={() => {
                                    addToCart({ id: item.id, title: item.title, desc: item.desc, price: item.priceValue, img: item.img });
                                    router.push("/checkout?step=settlement");
                                }} 
                                className="h-12 px-6 sm:px-10 rounded-xl sm:rounded-2xl font-label uppercase text-[10px] tracking-[0.3em] font-black bg-primary text-on-primary shadow-2xl active:scale-[0.98] hover:scale-[1.05] transition-all"
                            >
                                Buy Now
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
