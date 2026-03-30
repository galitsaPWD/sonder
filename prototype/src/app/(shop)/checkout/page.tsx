"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, Suspense } from "react";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type CheckoutStep = "review" | "settlement" | "success";

function CheckoutContent() {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { vaultedCards, vaultedAddresses, activeVoucherId, addOrder } = useUser();
  const [step, setStep] = useState<CheckoutStep>("review");
  const searchParams = useSearchParams();

  useEffect(() => {
    const initialStep = searchParams.get("step") as CheckoutStep;
    if (initialStep === "settlement") {
      setStep("settlement");
    }
  }, [searchParams]);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [settlementMethod, setSettlementMethod] = useState<"vaulted_card" | "card" | "digital" | "bank" | "cod">("vaulted_card");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const bottomBtnRef = useRef<HTMLDivElement>(null);
  // Start as true so it shows immediately if the button is off-screen (POV when opening)
  const [showStickyBar, setShowStickyBar] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run sticky logic on mobile — on desktop the sidebar button is always visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isMobile = window.innerWidth < 768;
        if (!isMobile) {
          setShowStickyBar(false);
          return;
        }
        // Force show if the summary is NOT visible (above the 80px nav bar)
        setShowStickyBar(!entry.isIntersecting);
      },
      { 
        threshold: 0.1, // Wait for at least 10% of the box to be seen
        rootMargin: '0px 0px -80px 0px' // Exactly matches the BottomNavBar height
      }
    );

    const btn = bottomBtnRef.current;
    if (btn) observer.observe(btn);

    return () => observer.disconnect();
  }, [step]); // Re-create observer when step changes

  // Selection Logic
  const [selectedIds, setSelectedIds] = useState<string[]>(cart.map(i => i.id));
  
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedItems = cart.filter(i => selectedIds.includes(i.id));

  // Voucher Logic
  const hasPrivateSale = activeVoucherId === "private_sale";
  const hasFreeShipping = activeVoucherId === "complimentary_express";
  
  const subtotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = hasPrivateSale ? subtotal * 0.1 : 0;
  const shipping = hasFreeShipping ? 0 : 45.00;
  const tax = (subtotal - discount) * 0.08;
  const grandTotal = subtotal - discount + tax + shipping;

  // Auto-select saved card if it exists
  const hasSavedCard = vaultedCards.length > 0;
  const [showSavedCard, setShowSavedCard] = useState(hasSavedCard);

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // Commit items to user galerie
      addOrder(selectedItems);
      // Remove only selected items from the global cart
      selectedIds.forEach(id => removeFromCart(id));
      setStep("success");
    }, 2500);
  };

  if (cart.length === 0 && step !== "success") {
    return (
      <main className="pt-32 pb-32 px-6 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
        <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-4xl text-outline-variant/40">shopping_bag</span>
        </div>
        <div className="space-y-2">
            <h1 className="font-headline italic text-4xl tracking-tighter">Your Vault is Empty</h1>
            <p className="text-secondary font-light max-w-xs mx-auto text-sm">Curate your collection from our galerie and return here to secure your pieces.</p>
        </div>
        <Link href="/items" className="bg-on-surface text-surface px-10 py-4 rounded-md font-label uppercase text-[10px] tracking-[0.2em] font-bold hover:scale-105 transition-all">
          Explore Curated
        </Link>
      </main>
    );
  }

  return (
    <main className="pt-10 pb-48 px-6 max-w-screen-xl mx-auto">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: REVIEW SELECTION */}
        {step === "review" && (
          <motion.div 
            key="review"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-8"
          >
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/10 pb-6">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-[0.4em] font-medium text-primary">Settlement Stage I</span>
                <h1 className="font-headline italic text-4xl md:text-5xl tracking-tighter">Vault Selection</h1>
              </div>
              <div className="text-right items-end flex flex-col">
                <p className="text-secondary font-light uppercase tracking-widest text-[8px] mb-0.5 whitespace-nowrap">Authenticated ID: <span className="font-mono font-bold text-on-surface">#26757-X</span></p>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
              <div className="md:col-span-8 space-y-6">
                <div className="flex justify-between items-center px-2">
                    <button 
                      onClick={() => setSelectedIds(selectedIds.length === cart.length ? [] : cart.map(i => i.id))}
                      className="text-[9px] uppercase tracking-[0.2em] font-bold text-primary hover:underline underline-offset-8 transition-all"
                    >
                      {selectedIds.length === cart.length ? 'Deselect Collection' : 'Select Complete Curated'}
                    </button>
                    <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-secondary">{selectedIds.length} <span className="text-outline-variant italic">of</span> {cart.length} picked</p>
                </div>
                
                <div className="space-y-4">
                    {cart.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => toggleSelection(item.id)}
                        className={`group relative p-4 sm:p-5 bg-surface-container-lowest rounded-2xl border transition-all duration-500 cursor-pointer flex gap-4 sm:gap-6 items-center ${selectedIds.includes(item.id) ? 'border-primary/40 shadow-xl scale-[1.01]' : 'border-outline-variant/10 opacity-70 hover:opacity-100'}`}
                    >
                        {/* Selector (Left) */}
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 border transition-all duration-500 rotate-45 flex-shrink-0 flex items-center justify-center ${selectedIds.includes(item.id) ? 'bg-primary border-primary' : 'border-outline-variant group-hover:border-primary/50'}`}>
                            {selectedIds.includes(item.id) && <span className="material-symbols-outlined text-[10px] sm:text-[14px] text-surface -rotate-45">check</span>}
                        </div>

                        {/* Image (Small) */}
                        <div className="w-16 h-20 sm:w-20 sm:h-28 bg-surface-container relative rounded-lg overflow-hidden flex-shrink-0 curator-shadow transition-transform duration-500 group-hover:scale-105 border border-outline-variant/5">
                            <Image fill className="object-cover" src={item.img} alt={item.title} />
                        </div>

                        {/* Content (Center) */}
                        <div className="flex-grow min-w-0 space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                <h3 className="font-headline italic text-lg sm:text-xl tracking-tight text-on-surface truncate">{item.title}</h3>
                                <div className="text-right sm:text-right">
                                    <p className="font-headline text-lg sm:text-xl italic tracking-tighter text-on-surface leading-none">₱ {(item.price * item.quantity).toLocaleString()}</p>
                                    <p className="text-[7px] uppercase tracking-[0.2em] font-bold text-outline-variant mt-1 hidden sm:block">Appraisal Value</p>
                                </div>
                            </div>
                            <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.1em] text-secondary font-light leading-snug max-w-[150px] sm:max-w-xs truncate sm:whitespace-normal">{item.desc}</p>
                            
                            <div className="flex items-center justify-between pt-2 sm:pt-3">
                                <div className="flex items-center gap-4 sm:gap-6 bg-surface-container-low px-3 sm:px-4 py-1.5 rounded-full border border-outline-variant/5">
                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="text-outline-variant hover:text-primary transition-colors disabled:opacity-20" disabled={item.quantity <= 1}>
                                        <span className="material-symbols-outlined text-xs">remove</span>
                                    </button>
                                    <span className="font-mono text-[10px] sm:text-xs w-3 text-center font-bold">{item.quantity}</span>
                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className="text-outline-variant hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-xs">add</span>
                                    </button>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="text-outline-variant/30 hover:text-error transition-colors p-1 group/del">
                                    <span className="material-symbols-outlined text-xs">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
              </div>

              <div className="md:col-span-4">
                <div 
                  ref={bottomBtnRef}
                  className="glass-surface p-10 rounded-2xl space-y-10 sticky top-32 border border-outline-variant/10 shadow-2xl animate-fade-in-right"
                >
                  <div className="space-y-2 border-b border-outline-variant/20 pb-6 text-center">
                    <h2 className="font-headline text-3xl italic tracking-tight">Summary</h2>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-secondary font-light">Stage I Certified</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-baseline">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary">Authenticated Items</span>
                        <span className="font-mono text-sm">{selectedItems.length}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-4 border-t border-dashed border-outline-variant/30">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary">Initial Subtotal</span>
                        <span className="font-headline text-xl italic text-on-surface">₱ {subtotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-6 space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <span className="material-symbols-outlined text-primary text-sm">shield</span>
                        <p className="text-[10px] text-secondary leading-relaxed uppercase tracking-wider">Securely proceed to finalize your logistics and payment vault.</p>
                    </div>
                    <button 
                        onClick={() => setStep("settlement")}
                        disabled={selectedIds.length === 0}
                        className={`w-full py-5 rounded-md font-label uppercase text-[11px] tracking-[0.3em] font-bold transition-all disabled:opacity-30 disabled:pointer-events-none shadow-xl
                        ${selectedIds.length > 0 ? 'bg-on-surface text-surface hover:scale-[1.02] shadow-[0_20px_40px_rgba(0,0,0,0.1)]' : 'bg-surface-container-highest text-secondary'}`}
                    >
                        Proceed to Settlement
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: SETTLEMENT LOGISTICS & PAYMENT */}
        {step === "settlement" && (
          <motion.div 
            key="settlement"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16"
          >
            <div className="md:col-span-8 space-y-8">
              <section className="space-y-8">
                <div className="flex flex-col gap-2 border-b border-outline-variant/10 pb-6">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setStep("review")} className="w-8 h-8 rounded-full border border-outline-variant/20 flex items-center justify-center text-secondary hover:text-primary hover:border-primary transition-all">
                        <span className="material-symbols-outlined text-xs">arrow_back</span>
                    </button>
                    <span className="text-[9px] uppercase tracking-[0.4em] font-medium text-primary">Settlement Stage II</span>
                  </div>
                  <h2 className="font-headline text-4xl md:text-5xl italic tracking-tighter">Final Review</h2>
                </div>

                <div className="space-y-8">
                    {/* Items Gallery Summary */}
                    <div className="glass-surface p-10 rounded-2xl border border-outline-variant/10 animate-fade-in duration-500">
                        <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-secondary mb-8">Selected Collection ({selectedItems.length})</h3>
                        <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar">
                            {selectedItems.map(item => (
                            <div key={item.id} className="w-20 h-28 bg-surface-container rounded-lg border border-outline-variant/10 overflow-hidden flex-shrink-0 relative curator-shadow animate-fade-in group">
                                <Image fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" src={item.img} alt={item.title} />
                                {/* Premium Cancellation (X) Button */}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromCart(item.id);
                                  }}
                                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-surface-container-highest/90 text-on-surface rounded-full flex items-center justify-center shadow-lg border border-primary/20 backdrop-blur-md transition-all hover:bg-error hover:text-surface active:scale-90 z-10"
                                  aria-label={`Remove ${item.title}`}
                                >
                                    <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                                </button>
                            </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Address Section */}
                    <div className="bg-surface-container-low p-10 rounded-2xl border border-outline-variant/10 animate-fade-in duration-700">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-secondary">Delivery Destination</h3>
                            <button className="text-[9px] uppercase tracking-[0.2em] font-bold text-primary hover:underline underline-offset-4">Modify Access</button>
                        </div>
                        <div className="flex items-start gap-6 p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                            </div>
                            <div className="flex-grow space-y-1">
                            {vaultedAddresses.length > 0 ? (
                                <>
                                <p className="font-headline text-xl italic tracking-tight">{vaultedAddresses[0].street}</p>
                                <p className="text-secondary text-sm font-light uppercase tracking-widest">{vaultedAddresses[0].zip} • {vaultedAddresses[0].city}, {vaultedAddresses[0].country}</p>
                                </>
                            ) : (
                                <p className="text-sm text-secondary font-light">No vaulted destination found.</p>
                            )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Section */}
                    <div className="bg-surface-container-low p-6 sm:p-10 rounded-2xl border border-outline-variant/10 animate-fade-in duration-1000 overflow-hidden">
                        <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-secondary mb-8">Secure Payment Vault</h3>
                        <div className="space-y-4">
                            {/* Vaulted Card Option */}
                            {hasSavedCard && (
                            <label onClick={() => { setSettlementMethod("vaulted_card"); setShowSavedCard(true); }} className={`relative flex items-center p-5 sm:p-6 rounded-xl cursor-pointer transition-all ${settlementMethod === 'vaulted_card' ? 'bg-surface-container-lowest ring-1 ring-primary/40 shadow-xl' : 'bg-surface-container-lowest/50 border border-outline-variant/10 opacity-70 hover:opacity-100'}`}>
                                <div className="flex items-center w-full justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${settlementMethod === 'vaulted_card' ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'}`}>
                                            <span className="material-symbols-outlined text-lg">verified_user</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${settlementMethod === 'vaulted_card' ? 'text-primary' : 'text-on-surface'}`}>Vaulted {vaultedCards[0].type}</span>
                                            <span className="text-[10px] text-secondary font-mono tracking-tighter opacity-60">{vaultedCards[0].number}</span>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settlementMethod === 'vaulted_card' ? 'border-primary' : 'border-outline-variant'}`}>
                                        {settlementMethod === 'vaulted_card' && <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>}
                                    </div>
                                </div>
                            </label>
                            )}

                            {/* One-Time Card Form */}
                            <div className="space-y-2">
                                <label onClick={() => { setSettlementMethod("card"); setShowSavedCard(false); }} className={`relative flex items-center p-5 sm:p-6 rounded-xl cursor-pointer transition-all ${settlementMethod === 'card' ? 'bg-surface-container-lowest ring-1 ring-primary/40 shadow-xl' : 'bg-surface-container-lowest/50 border border-outline-variant/10 opacity-70 hover:opacity-100'}`}>
                                    <div className="flex items-center w-full justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${settlementMethod === 'card' ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'}`}>
                                                <span className="material-symbols-outlined text-lg">credit_card</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${settlementMethod === 'card' ? 'text-primary' : 'text-on-surface'}`}>One-Time Settlement</span>
                                                <span className="text-[9px] text-secondary font-light uppercase tracking-[0.1em] opacity-60">Universal Credential</span>
                                            </div>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settlementMethod === 'card' ? 'border-primary' : 'border-outline-variant'}`}>
                                            {settlementMethod === 'card' && <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>}
                                        </div>
                                    </div>
                                </label>
                                
                                <AnimatePresence>
                                    {settlementMethod === 'card' && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden px-2"
                                        >
                                            <div className="pt-4 pb-6 space-y-4">
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[7px] uppercase tracking-[0.3em] font-bold text-outline-variant px-1">Galerie Card Number</p>
                                                        <input type="text" placeholder="XXXX XXXX XXXX XXXX" className="w-full bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-lg font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none placeholder:opacity-30" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <p className="text-[7px] uppercase tracking-[0.3em] font-bold text-outline-variant px-1">Expiry (MM/YY)</p>
                                                            <input type="text" placeholder="00 / 00" className="w-full bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-lg font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none placeholder:opacity-30 text-center" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[7px] uppercase tracking-[0.3em] font-bold text-outline-variant px-1">CVV</p>
                                                            <input type="text" placeholder="***" className="w-full bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-lg font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none placeholder:opacity-30 text-center" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Digital Wallet Option */}
                            <label onClick={() => setSettlementMethod("digital")} className={`relative flex items-center p-5 sm:p-6 rounded-xl cursor-pointer transition-all ${settlementMethod === 'digital' ? 'bg-surface-container-lowest ring-1 ring-primary/40 shadow-xl' : 'bg-surface-container-lowest/50 border border-outline-variant/10 opacity-70 hover:opacity-100'}`}>
                                <div className="flex items-center w-full justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${settlementMethod === 'digital' ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'}`}>
                                            <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${settlementMethod === 'digital' ? 'text-primary' : 'text-on-surface'}`}>Digital Twin Transfer</span>
                                            <span className="text-[9px] text-secondary font-light uppercase tracking-[0.1em] opacity-60">GCash • PayPal • Digital Wallet</span>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settlementMethod === 'digital' ? 'border-primary' : 'border-outline-variant'}`}>
                                        {settlementMethod === 'digital' && <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>}
                                    </div>
                                </div>
                            </label>

                            {/* Bank Transfer Option */}
                            <label onClick={() => setSettlementMethod("bank")} className={`relative flex items-center p-5 sm:p-6 rounded-xl cursor-pointer transition-all ${settlementMethod === 'bank' ? 'bg-surface-container-lowest ring-1 ring-primary/40 shadow-xl' : 'bg-surface-container-lowest/50 border border-outline-variant/10 opacity-70 hover:opacity-100'}`}>
                                <div className="flex items-center w-full justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${settlementMethod === 'bank' ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'}`}>
                                            <span className="material-symbols-outlined text-lg">account_balance</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${settlementMethod === 'bank' ? 'text-primary' : 'text-on-surface'}`}>Direct Bank Curated Settlement</span>
                                            <span className="text-[9px] text-secondary font-light uppercase tracking-[0.1em] opacity-60">Instant Settlement • Wire</span>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settlementMethod === 'bank' ? 'border-primary' : 'border-outline-variant'}`}>
                                        {settlementMethod === 'bank' && <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>}
                                    </div>
                                </div>
                            </label>

                            {/* COD / Concierge Settlement Option */}
                            <label onClick={() => setSettlementMethod("cod")} className={`relative flex items-center p-5 sm:p-6 rounded-xl cursor-pointer transition-all ${settlementMethod === 'cod' ? 'bg-surface-container-lowest ring-1 ring-primary/40 shadow-xl' : 'bg-surface-container-lowest/50 border border-outline-variant/10 opacity-70 hover:opacity-100'}`}>
                                <div className="flex items-center w-full justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${settlementMethod === 'cod' ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'}`}>
                                            <span className="material-symbols-outlined text-lg">handshake</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${settlementMethod === 'cod' ? 'text-primary' : 'text-on-surface'}`}>Concierge Settlement (COD)</span>
                                            <span className="text-[9px] text-secondary font-light uppercase tracking-[0.1em] opacity-60">At-Residency Finalization</span>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settlementMethod === 'cod' ? 'border-primary' : 'border-outline-variant'}`}>
                                        {settlementMethod === 'cod' && <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>}
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
              </section>
            </div>

            <div className="md:col-span-4">
              <div 
                ref={bottomBtnRef}
                className="glass-surface p-10 rounded-2xl space-y-10 sticky top-32 border border-outline-variant/10 shadow-2xl animate-fade-in-right"
              >
                <div className="space-y-4 border-b border-outline-variant/20 pb-8 text-center">
                    <h2 className="font-headline text-3xl italic tracking-tight">Final Appraisal</h2>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-primary font-bold">Authenticated Certificate</p>
                </div>
                
                <div className="space-y-6 pt-6 font-label uppercase text-[10px] tracking-[0.2em] font-bold text-secondary">
                  <div className="flex justify-between items-center">
                      <span>Subtotal Selection</span>
                      <span className="text-on-surface font-headline italic text-lg opacity-80">₱ {subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-primary pt-2 border-t border-dashed border-primary/20">
                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">local_offer</span> Loyalty Reward</span>
                        <span className="font-headline italic text-lg">- ₱ {discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                      <span>Atelier Surcharge (Tax)</span>
                      <span className="text-on-surface font-headline italic text-lg opacity-80">₱ {tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 pb-6 border-b border-dashed border-outline-variant/20">
                      <span className="flex items-center gap-2">Logistics {hasFreeShipping && <span className="text-primary">(COMPLIMENTARY)</span>}</span>
                      <span className="text-on-surface font-headline italic text-lg opacity-80">₱ {shipping.toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-10 pt-10">
                      <div className="text-center space-y-2">
                          <p className="text-[9px] uppercase tracking-[0.5em] text-secondary font-bold">Total Collection Value</p>
                          <p className="text-5xl font-headline italic tracking-tighter text-on-surface">₱ {grandTotal.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className="w-full bg-on-surface text-surface py-6 rounded-md font-label uppercase text-[11px] tracking-[0.4em] font-black shadow-[0_30px_60px_-10px_rgba(0,0,0,0.3)] hover:scale-[1.03] disabled:opacity-50 transition-all active:scale-95 shimmer-gold text-on-primary"
                      >
                        {isProcessing ? "Authenticating..." : "Establish Order"}
                      </button>
                    </div>
                  </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: SUCCESS (THE HALLMARK) */}
        {step === "success" && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center space-y-12 pt-24"
          >
            <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-2xl animate-pulse">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <div className="absolute -inset-3 border border-dashed border-primary/20 rounded-full animate-spin-slow"></div>
            </div>

            <div className="space-y-4 max-w-lg">
                <span className="text-[9px] uppercase tracking-[0.5em] font-bold text-primary">Establishment Successful</span>
                <h1 className="font-headline italic text-5xl tracking-tighter">Collection Secured</h1>
                <p className="text-secondary font-light leading-relaxed text-xs">Your curated pieces have been securely reserved in the vault. A Master of Logistics will reach out to verify your delivery hallmark within the hour.</p>
            </div>

            <div className="space-y-10 w-full">
                <div className="p-8 glass-surface rounded-2xl border-dashed border-outline-variant/30 max-w-md mx-auto">
                    <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-outline-variant mb-3">Official Transaction Receipt</p>
                    <p className="font-mono text-lg font-bold tracking-tighter">ORD-77492-75-PLATINUM</p>
                    
                    {/* Live Progress Simulation */}
                    <div className="mt-8 space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-[7px] uppercase tracking-[0.2em] font-bold text-primary">Hallmark Authentication</span>
                            <span className="text-[7px] font-mono opacity-50 italic text-primary">85% Complete</span>
                        </div>
                        <div className="h-0.5 w-full bg-surface-container-highest overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "85%" }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                className="h-full luxury-gradient shadow-[0_0_10px_rgba(197,160,89,0.5)]"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <div className="flex-1 p-3 bg-surface-container-low rounded-lg border border-outline-variant/10">
                            <p className="text-[7px] uppercase tracking-widest text-secondary mb-1">Status</p>
                            <p className="text-[9px] font-bold uppercase text-primary">Preparing</p>
                        </div>
                        <div className="flex-1 p-3 bg-surface-container-low rounded-lg border border-outline-variant/10">
                            <p className="text-[7px] uppercase tracking-widest text-secondary mb-1">ETA</p>
                            <p className="text-[9px] font-bold uppercase">24-48 Hours</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <Link href="/dashboard" className="px-10 py-5 border border-on-surface text-on-surface rounded-md text-[9px] uppercase tracking-[0.3em] font-bold hover:bg-on-surface hover:text-surface transition-all">Previous Sanctuary</Link>
                  <Link href="/profile" className="px-10 py-5 bg-on-surface text-surface rounded-md text-[9px] uppercase tracking-[0.3em] font-bold shadow-xl hover:scale-105 transition-all text-on-primary">Vault Tracking</Link>
                </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* FIXED VIEWPORT-ANCHORED STICKY BAR — OUTSIDE ANIMATEPRESENCE TO PREVENT CLIPPING */}
      <AnimatePresence>
        {(showStickyBar && (step === 'review' || step === 'settlement')) && (
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
            className="md:hidden fixed bottom-32 left-0 w-full px-6 z-[100]"
          >
            <div className="glass-surface p-5 rounded-3xl shadow-2xl border border-primary/20 flex items-center justify-between backdrop-blur-3xl curator-shadow">
                <div className="space-y-0.5">
                    <p className="text-[8px] uppercase tracking-[0.4em] font-bold text-secondary">
                      {step === 'review' ? 'Securing' : 'Finalizing'}
                    </p>
                    <p className="font-headline text-2xl italic text-on-surface">
                      ₱ {(step === 'review' ? subtotal : grandTotal).toLocaleString()}
                    </p>
                </div>
                <button 
                  onClick={() => step === 'review' ? setStep("settlement") : handlePlaceOrder()}
                  disabled={step === 'review' ? (selectedIds.length === 0) : isProcessing}
                  className="bg-on-surface text-surface px-10 py-4 rounded-md font-label uppercase text-[10px] tracking-[0.4em] font-black shimmer-gold shadow-2xl disabled:opacity-30 active:scale-95 transition-all text-on-primary"
                >
                  {step === 'review' ? 'Settle' : (isProcessing ? "..." : "Establish")}
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={
      <div className="pt-32 pb-32 px-6 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-secondary font-black">Authenticating Session...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
