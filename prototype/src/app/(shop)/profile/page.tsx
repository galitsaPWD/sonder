"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useUI } from "@/context/UIContext";
import { motion, AnimatePresence } from "framer-motion";
import { ATELIER_ITEMS } from "@/lib/data";
import AppraisalModal from "@/components/AppraisalModal";

export default function Profile() {
  const router = useRouter();
  const [showBenefits, setShowBenefits] = useState(false);
  const { vaultedCards, vaultedAddresses, galerieOrders, userProfile, addCard, removeCard, addAddress, removeAddress } = useUser();
  const { openConcierge } = useUI();
  const [activePhase, setActivePhase] = useState<"synthesis" | "transit" | "review" | null>(null);
  const [showTracker, setShowTracker] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "settings">("orders");
  const [scrollIndex, setScrollIndex] = useState(0);

  const [isAppraisalOpen, setIsAppraisalOpen] = useState(false);
  const [selectedAppraisalItem, setSelectedAppraisalItem] = useState<{title: string, id: string} | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Live Registry Uplink: Reconcile local storage orders with master registry data
  const rectifiedOrders = galerieOrders.map((order: any) => {
    const legacyMap: Record<string, string> = {
      "LUMINA-03": "jewelry-01",
      "SOLIS-01": "item-03",
      "AETHER-02": "item-05"
    };

    const targetId = legacyMap[order.id] || order.id;
    const registryItem = ATELIER_ITEMS.find(item => item.id === targetId);
    
    // Real-time Status Calculation
    const now = isMounted ? Date.now() : 1711814400000; // Fixed anchor for SSR to prevent hydration mismatch
    const createdAt = order.createdAt || now;
    const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);
    
    let dynamicStatus = "synthesis";
    if (hoursElapsed >= 48) dynamicStatus = "review";
    else if (hoursElapsed >= 12) dynamicStatus = "transit";
    else dynamicStatus = "synthesis";

    if (registryItem) {
      return { 
        ...order, 
        id: registryItem.id, 
        title: registryItem.title, 
        img: registryItem.img, 
        price: registryItem.price,
        priceValue: registryItem.priceValue,
        status: dynamicStatus,
        hoursElapsed
      };
    }
    return { ...order, status: dynamicStatus, hoursElapsed };
  });

  const handleSignOut = () => {
    router.push("/");
  };

  const simulateVaultCard = () => {
    addCard({
      number: "**** **** **** 8842",
      name: userProfile.name.toUpperCase(),
      expiry: "12/28",
      type: "visa"
    });
  };

  const simulateVaultAddress = () => {
    addAddress({
      street: "157 L.P. Leviste St",
      city: "Makati City",
      zip: "1227",
      country: "Philippines"
    });
  };

  return (
    <main className="pb-20 px-6 max-w-screen-xl mx-auto space-y-12">
      <section className="animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/10 pb-16 gap-12">
        <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between w-full">
                <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-primary px-3 py-1 bg-primary/5 rounded-full border border-primary/10">Member Since 2021</span>
            </div>
            
            <h1 className="font-headline italic text-6xl md:text-8xl tracking-tighter text-on-surface leading-none">Your Profile</h1>
        </div>
        
        {/* Tier Status Card */}
        <div className="w-full md:w-96">
          <button 
            onClick={() => setShowBenefits(!showBenefits)}
            className="w-full glass-surface p-5 rounded-2xl shadow-xl flex justify-between items-center transition-all hover:scale-[1.01] border border-primary/20 group text-left"
          >
              <div className="space-y-0.5">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-secondary font-bold">Authenticated Tier</p>
                  <p className="text-xl font-headline italic tracking-tighter text-primary leading-none">Platinum Status</p>
              </div>
              <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                      <p className="text-[8px] uppercase tracking-widest text-outline-variant font-bold">Privileges</p>
                      <p className="text-[10px] uppercase tracking-widest text-secondary font-medium">8 Active</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${showBenefits ? 'bg-primary text-on-primary' : 'bg-primary/10 text-primary group-hover:bg-primary/20'}`}>
                      <motion.span 
                        animate={{ rotate: showBenefits ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="material-symbols-outlined text-lg"
                      >expand_more</motion.span>
                  </div>
              </div>
          </button>

          <AnimatePresence>
            {showBenefits && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-3 bg-surface-container-lowest p-6 rounded-2xl shadow-xl border border-primary/20">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
                      <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-primary">Platinum Privileges</p>
                      <p className="text-[8px] font-mono text-secondary opacity-50">#PLAT-2021</p>
                    </div>
                    <ul className="space-y-3">
                      {[
                        "Complimentary Global Express Selection",
                        "Private Archival Consultations",
                        "10% Loyalty Appraisal Credit",
                        "After-Hours Atelier Access"
                      ].map((benefit, i) => (
                        <li key={i} className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-secondary font-medium">
                          <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0"></span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t border-outline-variant/10">
                      <div className="flex justify-between text-[8px] uppercase tracking-widest font-bold mb-2 text-secondary">
                        <span>Diamond Milestone</span>
                        <span>75% Secured</span>
                      </div>
                      <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full luxury-gradient w-[75%] shadow-[0_0_10px_rgba(197,160,89,0.3)]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-12 relative z-[10] pt-6 border-t border-outline-variant/10">
        <div className="md:col-span-8 space-y-10">
            
            {/* Compact Archival Archive */}
                <div className="space-y-12">
                    {/* Sovereign Status Horizon - Visually God Manifestation */}
                    <div className="relative py-12 px-8 glass-surface rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden group">
                        {/* Ambient Background Glows */}
                        <div className="absolute inset-0 pointer-events-none">
                            <AnimatePresence>
                                {activePhase && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-primary/5 blur-[100px]"
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Connection Line */}
                        <div className="absolute top-1/2 left-20 right-20 h-[1px] -translate-y-6 hidden sm:block">
                            <div className="w-full h-full bg-outline-variant/20 relative">
                                <motion.div 
                                    initial={{ width: "0%" }}
                                    animate={{ 
                                        width: activePhase === 'synthesis' ? '15%' : 
                                               activePhase === 'transit' ? '50%' : 
                                               activePhase === 'review' ? '100%' : '0%' 
                                    }}
                                    className="h-full luxury-gradient shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center relative z-10">
                            {[
                                { id: 'synthesis', label: 'Synthesis', icon: 'memory', desc: 'Crafting Content' },
                                { id: 'transit', label: 'Transit', icon: 'local_shipping', desc: 'Archival Motion' },
                                { id: 'review', label: 'Review', icon: 'verified_user', desc: 'Final Appraisal' }
                            ].map((phase, idx) => {
                                const count = rectifiedOrders.filter((o: any) => (o.status || 'synthesis') === phase.id).length;
                                const isActive = activePhase === phase.id;
                                
                                return (
                                    <button 
                                        key={phase.id}
                                        onClick={() => setActivePhase(isActive ? null : phase.id as any)}
                                        className="flex flex-col items-center gap-4 group/status transition-all relative"
                                    >
                                        <div className="relative">
                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.div 
                                                        layoutId="status-glow"
                                                        className="absolute -inset-6 bg-primary/20 blur-2xl rounded-full"
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                    />
                                                )}
                                            </AnimatePresence>
                                            
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 relative z-10 border ${
                                                isActive 
                                                ? 'bg-primary text-on-primary border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] scale-110' 
                                                : 'bg-surface-container-highest text-primary/40 border-white/5 hover:border-primary/30 group-hover/status:scale-105'
                                            }`}>
                                                <span className={`material-symbols-outlined text-2xl transition-all ${isActive ? 'font-bold' : 'font-light'}`}>
                                                    {phase.icon}
                                                </span>
                                                
                                                {count > 0 && (
                                                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-headline italic border ${
                                                        isActive ? 'bg-on-primary text-primary border-primary' : 'bg-primary text-on-primary border-surface'
                                                    }`}>
                                                        {count}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-center space-y-1">
                                            <span className={`block text-[9px] uppercase tracking-[0.4em] font-black transition-colors ${isActive ? 'text-primary' : 'text-secondary/40'}`}>
                                                {phase.label}
                                            </span>
                                            <span className={`block text-[6px] uppercase tracking-widest font-medium opacity-0 group-hover/status:opacity-40 transition-opacity whitespace-nowrap`}>
                                                {phase.desc}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {activePhase && (
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 15 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="space-y-8"
                            >
                                <div className="flex justify-between items-end px-2">
                                    <div className="space-y-1">
                                        <h2 className="font-headline text-3xl italic tracking-tighter text-on-surface uppercase">{activePhase.replace('_', ' ')} Phase</h2>
                                        <p className="font-label text-[8px] uppercase tracking-[0.4em] text-secondary">Personal Curated Highlights</p>
                                    </div>
                                </div>

                                <div 
                                    onScroll={(e) => {
                                        const scrollLeft = e.currentTarget.scrollLeft;
                                        const width = e.currentTarget.offsetWidth;
                                        setScrollIndex(Math.round(scrollLeft / width));
                                    }}
                                    className="flex gap-4 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
                                >
                                    {rectifiedOrders.filter((o: any) => (o.status || 'synthesis') === activePhase).length > 0 ? (
                                        rectifiedOrders.filter((o: any) => (o.status || 'synthesis') === activePhase).map((item: any, idx: number) => (
                                            <motion.div 
                                                layout
                                                key={`${item.id}-${idx}`} 
                                                className="w-[calc(100vw-3rem)] md:w-[500px] shrink-0 snap-center"
                                            >
                                                    <div className="aspect-[4/3] bg-surface-container rounded-xl overflow-hidden relative border border-outline-variant/10 mb-4">
                                                        <Image fill sizes="400px" className="object-cover mix-blend-multiply transition-all duration-700 group-hover:scale-110" src={item.img} alt={item.title} />
                                                        <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
                                                            <span className="bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] uppercase tracking-[0.3em] font-black border border-outline-variant/20 text-secondary">
                                                                {item.orderDate}
                                                            </span>
                                                            <span className="text-[7px] uppercase tracking-widest font-black text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/10 ml-1">
                                                                {Math.floor(item.hoursElapsed) < 1 ? 'JUST NOW' : 
                                                                 Math.floor(item.hoursElapsed) < 24 ? `${Math.floor(item.hoursElapsed)}H AGO` : 
                                                                 `${Math.floor(item.hoursElapsed / 24)}D AGO`}
                                                            </span>
                                                        </div>
                                                        <div className="absolute bottom-3 right-3">
                                                            <div className="flex flex-col items-end">
                                                                <span className="bg-surface/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-[9px] font-mono text-on-surface border border-outline-variant/10 shadow-sm leading-none">
                                                                    {item.price}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-5">
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="font-headline italic text-xl tracking-tight text-on-surface truncate flex-1">{item.title}</h3>
                                                        </div>
                                                        
                                                        <div className="pt-2 border-t border-outline-variant/5">
                                                            <AnimatePresence mode="wait">
                                                                {showTracker === idx ? (
                                                                    <motion.div 
                                                                        key="tracker"
                                                                        layoutId={`archival-manifest-${item.id}`}
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        exit={{ opacity: 0 }}
                                                                        onClick={() => setShowTracker(null)}
                                                                        className="glass-surface p-6 rounded-2xl border border-primary/20 relative overflow-hidden group/tracker cursor-pointer"
                                                                    >
                                                                        <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[8px] uppercase tracking-[0.3em] font-bold text-secondary">Tracking</span>
                    <span className="text-[8px] uppercase tracking-[0.4em] font-bold text-primary animate-pulse">
                      {item.status === 'synthesis' ? 'Processing' : item.status === 'transit' ? 'On the way' : 'Arrived'}
                    </span>
                  </div>
                  
                  {item.status === 'review' ? (
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-on-surface font-bold">Item Arrived</p>
                            <p className="text-[7px] uppercase tracking-widest text-secondary opacity-60">Ready for final check and delivery to your address.</p>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); alert('Item received'); }}
                            className="w-full py-3.5 bg-primary text-on-primary text-[8px] uppercase tracking-[0.4em] font-black rounded-xl hover:scale-[1.02] transition-all shimmer-gold shadow-xl"
                        >
                            Confirm Arrival
                        </button>
                    </div>
                  ) : (
                    <div className="relative h-12 flex items-center px-2">
                        <div className="absolute inset-0 bg-primary/5 blur-xl -z-10" />
                        
                        <div className="absolute w-[calc(100%-16px)] h-[1px] bg-outline-variant/30 mt-4">
                            <motion.div 
                                initial={{ width: "0%" }}
                                animate={{ 
                                    width: item.status === 'synthesis' 
                                        ? `${Math.max(2, Math.min((item.hoursElapsed / 12) * 100, 100))}%` 
                                        : item.status === 'transit'
                                        ? `${Math.max(2, Math.min(((item.hoursElapsed - 12) / 36) * 100, 100))}%`
                                        : '100%'
                                }}
                                className="h-full luxury-gradient shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
                            />
                        </div>
                        <div className="relative flex justify-between w-full mt-4">
                            {(item.status === 'synthesis' ? [ 
                              { label: "Confirmed", sub: "QC Warehouse", active: true },
                              { label: "Preparing", sub: "Est: 24h", active: item.hoursElapsed >= 3 },
                              { label: "Quality Check", sub: "Pending", active: item.hoursElapsed >= 6 },
                              { label: "Ready", sub: "Awaiting Courier", active: item.hoursElapsed >= 9 }
                            ] : [
                              { label: "Picked Up", sub: "QC Center", active: true },
                              { label: "In Transit", sub: "Makati Hub", active: item.hoursElapsed >= 24 },
                              { label: "Out Delivery", sub: "On the way", active: item.hoursElapsed >= 36 },
                              { label: "Arrived", sub: "Salcedo Village", active: item.status === 'review' }
                            ]).map((step, i) => (
                                <div key={i} className="flex flex-col items-center gap-3 relative">
                                    <div className="absolute -top-7 flex flex-col items-center">
                                      <span className={`text-[6px] uppercase tracking-[0.2em] transition-opacity duration-700 whitespace-nowrap ${step.active ? 'opacity-100 text-primary font-bold' : 'opacity-20'}`}>
                                          {step.label}
                                      </span>
                                      <span className={`text-[5px] opacity-40 whitespace-nowrap font-medium ${step.active ? 'visible' : 'invisible'}`}>{step.sub}</span>
                                    </div>
                                    <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-700 ${step.active ? 'bg-primary border-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)] scale-110' : 'bg-surface border-outline-variant/40 scale-75'}`}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                  )}

                                                                        </div>
                                                                    </motion.div>
                                                                ) : (
                                                                    <motion.div
                                                                        key="trigger"
                                                                        layoutId={`archival-manifest-${item.id}`}
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        exit={{ opacity: 0 }}
                                                                    >
                                                                        {item.status === 'synthesis' && (
                                                                            <button 
                                                                                onClick={() => setShowTracker(idx)}
                                                                                className="w-full flex items-center justify-between p-4 glass-surface rounded-xl border border-white/5 hover:border-primary/20 transition-all group"
                                                                            >
                                                                                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/60 flex items-center gap-2">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                                                                    Synthesis Active
                                                                                </p>
                                                                                <span className="material-symbols-outlined text-xs text-secondary/40 group-hover:text-primary transition-colors">analytics</span>
                                                                            </button>
                                                                        )}
                                                                        {item.status === 'transit' && (
                                                                            <button 
                                                                                onClick={() => setShowTracker(idx)}
                                                                                className="w-full bg-on-surface text-surface py-3.5 rounded-xl text-[8px] uppercase tracking-[0.4em] font-black hover:bg-primary transition-all flex items-center justify-center gap-3 shadow-xl group"
                                                                            >
                                                                                <motion.span 
                                                                                    animate={{ x: [0, 2, 0] }}
                                                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                                                    className="material-symbols-outlined text-sm"
                                                                                >
                                                                                    local_shipping
                                                                                </motion.span>
                                                                                Track Piece
                                                                            </button>
                                                                        )}
                                                                        {item.status === 'review' && (
                                                                            <button 
                                                                                onClick={() => {
                                                                                    setSelectedAppraisalItem({ title: item.title, id: item.id });
                                                                                    setIsAppraisalOpen(true);
                                                                                }}
                                                                                className="w-full border border-primary/20 text-primary/80 py-3.5 rounded-xl text-[8px] uppercase tracking-[0.4em] font-black hover:bg-primary/5 transition-all flex items-center justify-center gap-3 group"
                                                                            >
                                                                                <span className="material-symbols-outlined text-sm transition-transform group-hover:scale-110">verified</span>
                                                                                Gallery Review
                                                                            </button>
                                                                        )}
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="w-full py-20 flex flex-col items-center justify-center text-center opacity-40">
                                            <p className="text-[10px] uppercase tracking-[0.4em]">No objects in this phase.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Scroll Indicators */}
                                {rectifiedOrders.filter((o: any) => (o.status || 'synthesis') === activePhase).length > 1 && (
                                    <div className="flex justify-center gap-2 mt-2 pb-8">
                                        {rectifiedOrders.filter((o: any) => (o.status || 'synthesis') === activePhase).map((_, i) => (
                                            <div 
                                                key={i} 
                                                className={`h-1 transition-all duration-500 rounded-full ${i === scrollIndex ? 'w-8 bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]' : 'w-2 bg-outline-variant/30'}`}
                                            ></div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AppraisalModal 
                      isOpen={isAppraisalOpen}
                      onClose={() => setIsAppraisalOpen(false)}
                      item={selectedAppraisalItem}
                    />
                </div>

        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 space-y-10 animate-fade-in-right">
            <div className="glass-surface p-10 rounded-[2rem] border border-outline-variant/20 text-center flex flex-col items-center curator-shadow relative overflow-hidden border-primary/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-10 border border-primary/20 shadow-inner text-primary">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                        <circle cx="12" cy="12.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M7 12.5C7 9.73858 9.23858 7.5 12 7.5C14.7614 7.5 17 9.73858 17 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        <circle cx="10" cy="12" r="0.7" fill="currentColor" />
                        <circle cx="14" cy="12" r="0.7" fill="currentColor" />
                        <path d="M16 14.5C16.5 14.5 17.5 15.5 17.5 16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                </div>
                <h3 className="font-headline italic text-3xl tracking-tighter mb-4 text-on-surface">Chat with Sophie</h3>
                <p className="text-[9px] text-secondary/70 leading-relaxed mb-10 font-medium px-4 uppercase tracking-[0.2em]">Sophie is online and ready to help you.</p>
                <div className="w-full">
                    <button onClick={openConcierge} className="w-full bg-on-surface text-surface py-5 rounded-md font-label uppercase text-[10px] tracking-[0.5em] font-black hover:bg-primary transition-all shadow-2xl">
                        Message Sophie
                    </button>
                </div>
            </div>

        </div>
      </section>

      {/* Sign Out — bottom of page */}
      <div className="border-t border-outline-variant/10 pt-8 pb-4 flex justify-center">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-bold text-secondary/50 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Sign Out of Atelier
        </button>
      </div>
    </main>
  );
}
