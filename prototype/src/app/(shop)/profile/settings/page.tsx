"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Settings() {
  const router = useRouter();
  const { 
    vaultedCards, 
    vaultedAddresses, 
    userProfile, 
    addCard, 
    removeCard, 
    addAddress, 
    removeAddress, 
    updateProfile 
  } = useUser();

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: "", city: "", zip: "", country: "Philippines" });
  const [newCard, setNewCard] = useState({ number: "", name: "", expiry: "", type: "visa" as const });

  const handleAddAddress = () => {
    if (!newAddress.street || !newAddress.city) return;
    addAddress(newAddress);
    setNewAddress({ street: "", city: "", zip: "", country: "Philippines" });
    setIsAddingAddress(false);
  };

  const handleAddCard = () => {
    if (!newCard.number || !newCard.name) return;
    addCard(newCard);
    setNewCard({ number: "", name: "", expiry: "", type: "visa" });
    setIsAddingCard(false);
  };

  return (
    <main className="pt-6 pb-32 px-6 max-w-screen-xl mx-auto space-y-12">
      <section className="animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/10 pb-16 gap-12">
        <div className="space-y-4">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-secondary hover:text-primary transition-colors group"
            >
                <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
                <span className="text-[10px] uppercase tracking-[0.4em] font-black">Back</span>
            </button>
            <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-primary">Atelier Configuration</span>
                <h1 className="font-headline italic text-6xl md:text-8xl tracking-tighter text-on-surface leading-none">Settings</h1>
            </div>
        </div>

        {/* Sovereign Profile Manifest */}
        <div className="flex items-center gap-8 pl-4 md:pl-0 border-l-2 border-primary/20 md:border-l-0">
            <div className="space-y-1 text-left md:text-right order-2 md:order-1">
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface">{userProfile.name}</p>
                <p className="text-[8px] uppercase tracking-[0.2em] text-secondary font-medium">{userProfile.title} • Since {userProfile.since}</p>
                <div className="flex items-center gap-2 justify-start md:justify-end pt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-[8px] uppercase tracking-[0.4em] font-bold text-primary">{userProfile.status}</span>
                </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/10 flex items-center justify-center curator-shadow order-1 md:order-2">
                <span className="material-symbols-outlined text-3xl text-primary font-thin">person</span>
            </div>
        </div>
      </section>

      {/* Basic Information / Identity Section */}
      <section className="animate-fade-in-up" suppressHydrationWarning>
        <div className="p-10 glass-surface ghost-border rounded-[2.5rem] space-y-8 curator-shadow group overflow-hidden relative" suppressHydrationWarning>
            <div className="flex flex-col md:flex-row gap-12">
                <div className="space-y-4 flex-1">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-primary mb-2">Curator Identity</h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[8px] uppercase tracking-widest text-secondary font-bold px-1">Full Legal Name</label>
                            <input 
                                type="text" 
                                value={userProfile.name}
                                onChange={(e) => updateProfile({ name: e.target.value })}
                                className="w-full bg-surface/50 border-b border-outline-variant/30 focus:border-primary px-1 py-1 text-on-surface font-headline italic text-2xl outline-none transition-all placeholder:opacity-20"
                                placeholder="Enter Full Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[8px] uppercase tracking-widest text-secondary font-bold px-1">Contact Link (Phone)</label>
                            <input 
                                type="text" 
                                value={userProfile.phone}
                                onChange={(e) => updateProfile({ phone: e.target.value })}
                                className="w-full bg-surface/50 border-b border-outline-variant/30 focus:border-primary px-1 py-1 text-on-surface font-headline italic text-2xl outline-none transition-all placeholder:opacity-20"
                                placeholder="+63 XXX XXX XXXX"
                            />
                        </div>
                    </div>
                </div>
                <div className="md:w-64 space-y-6 flex flex-col justify-between">
                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[7px] uppercase tracking-[0.3em] leading-relaxed text-secondary italic opacity-80">
                            Updates to your curated identity will reflect across all archival manifestos and settlement protocols.
                        </p>
                    </div>
                    <button 
                        onClick={() => {}}
                        className="w-full bg-on-surface text-surface py-4 rounded-xl text-[9px] uppercase tracking-[0.4em] font-black hover:bg-primary transition-all active:scale-95 shadow-xl"
                    >
                        Save Archival Identity
                    </button>
                </div>
            </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade-in-up">
        {/* Hallmark Residency Module */}
        <div className="p-10 glass-surface ghost-border rounded-[2.5rem] space-y-8 transition-all duration-700 hover:bg-surface-container-low curator-shadow group overflow-hidden relative">
            <div className="flex items-start gap-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary/80 ring-1 ring-outline-variant/20 shadow-inner group-hover:scale-110 transition-transform duration-700">
                    <div className="w-12 h-12 rounded-xl border border-primary/10 flex items-center justify-center bg-primary/5">
                        <span className="material-symbols-outlined text-2xl font-thin">location_on</span>
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-on-surface mb-1">Hallmark Residency</h3>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-secondary/40 font-bold mb-6">Registered Delivery Destinations</p>
                    <div className="space-y-5">
                    {vaultedAddresses.length > 0 ? (
                        vaultedAddresses.map(addr => (
                        <div key={addr.id} className="bg-surface-container-lowest/50 p-6 rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-headline text-lg italic tracking-tighter text-on-surface">{addr.street}</p>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-secondary/60 font-medium">{addr.zip} • {addr.city}, {addr.country}</p>
                                </div>
                                <button onClick={() => removeAddress(addr.id)} className="text-secondary/30 hover:text-error transition-all p-1">
                                    <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                            </div>
                        </div>
                        ))
                    ) : (
                        <p className="text-[10px] text-secondary/60 leading-relaxed font-light italic px-1 pt-2">No residency credentials currently registered.</p>
                    )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isAddingAddress ? (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-6 overflow-hidden px-1"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1">
                                <label className="text-[6px] uppercase tracking-widest text-outline-variant font-bold">Street Address</label>
                                <input type="text" value={newAddress.street} onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} className="w-full bg-transparent border-b border-outline-variant/20 py-2 text-xs outline-none focus:border-primary transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[6px] uppercase tracking-widest text-outline-variant font-bold">City</label>
                                <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} className="w-full bg-transparent border-b border-outline-variant/20 py-2 text-xs outline-none focus:border-primary transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[6px] uppercase tracking-widest text-outline-variant font-bold">Postal Code</label>
                                <input type="text" value={newAddress.zip} onChange={(e) => setNewAddress({...newAddress, zip: e.target.value})} className="w-full bg-transparent border-b border-outline-variant/20 py-2 text-xs outline-none focus:border-primary transition-colors" />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleAddAddress} className="flex-1 py-4 bg-primary text-on-primary text-[8px] uppercase tracking-[0.4em] font-black rounded-xl shadow-lg active:scale-95 transition-all">Register Residency</button>
                            <button onClick={() => setIsAddingAddress(false)} className="px-6 py-4 border border-outline-variant/30 text-secondary text-[8px] uppercase tracking-[0.4em] font-black rounded-xl">Cancel</button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <button onClick={() => setIsAddingAddress(true)} className="w-full py-5 glass-surface border border-primary/20 text-primary text-[10px] uppercase tracking-[0.4em] font-black rounded-xl hover:bg-primary hover:text-on-primary transition-all duration-700 relative z-10 shadow-lg active:scale-95">Register hallmark</button>
                    </div>
                )}
            </AnimatePresence>
        </div>

        {/* Financial Credentials Module */}
        <div className="p-10 glass-surface ghost-border rounded-[2.5rem] space-y-8 transition-all duration-700 hover:bg-surface-container-low curator-shadow group overflow-hidden relative">
            <div className="flex items-start gap-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary/80 ring-1 ring-outline-variant/20 shadow-inner group-hover:scale-110 transition-transform duration-700">
                    <div className="w-12 h-12 rounded-xl border border-primary/10 flex items-center justify-center bg-primary/5">
                        <span className="material-symbols-outlined text-2xl font-thin">encrypted</span>
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-on-surface mb-1">Financial Credentials</h3>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-secondary/40 font-bold mb-6">Automated Settlement Protocols</p>
                    <div className="space-y-5">
                    {vaultedCards.length > 0 ? (
                        vaultedCards.map(card => (
                        <div key={card.id} className="bg-surface-container-lowest/50 p-6 rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all flex justify-between items-center relative overflow-hidden">
                            <div className="space-y-1.5 relative z-10">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Vaulted {card.type}</p>
                                <p className="text-[11px] text-on-surface font-mono tracking-tighter">{card.number}</p>
                            </div>
                            <button onClick={() => removeCard(card.id)} className="text-secondary/30 hover:text-error transition-all p-1 relative z-10">
                                <span className="material-symbols-outlined text-xs">close</span>
                            </button>
                        </div>
                        ))
                    ) : (
                        <p className="text-[10px] text-secondary/60 leading-relaxed font-light italic px-1 pt-2">No settlement credentials registered.</p>
                    )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isAddingCard ? (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-6 overflow-hidden px-1"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1">
                                <label className="text-[6px] uppercase tracking-widest text-outline-variant font-bold">Curator Name on Card</label>
                                <input type="text" value={newCard.name} onChange={(e) => setNewCard({...newCard, name: e.target.value})} className="w-full bg-transparent border-b border-outline-variant/20 py-2 text-xs outline-none focus:border-primary transition-colors" placeholder="Full Legal Name" />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[6px] uppercase tracking-widest text-outline-variant font-bold">Vault Number</label>
                                <input type="text" value={newCard.number} onChange={(e) => setNewCard({...newCard, number: e.target.value})} className="w-full bg-transparent border-b border-outline-variant/20 py-2 text-xs outline-none focus:border-primary transition-colors" placeholder="**** **** **** 0000" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[6px] uppercase tracking-widest text-outline-variant font-bold">Expiry Manifest</label>
                                <input type="text" value={newCard.expiry} onChange={(e) => setNewCard({...newCard, expiry: e.target.value})} className="w-full bg-transparent border-b border-outline-variant/20 py-2 text-xs outline-none focus:border-primary transition-colors" placeholder="MM/YY" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[6px] uppercase tracking-widest text-outline-variant font-bold">Provider</label>
                                <select value={newCard.type} onChange={(e) => setNewCard({...newCard, type: e.target.value as any})} className="w-full bg-transparent border-b border-outline-variant/20 py-2 text-[10px] outline-none focus:border-primary transition-colors bg-surface">
                                    <option value="visa">Visa</option>
                                    <option value="mastercard">Mastercard</option>
                                    <option value="amex">Amex</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleAddCard} className="flex-1 py-3.5 bg-primary text-on-primary text-[8px] uppercase tracking-[0.3em] font-black rounded-xl shimmer-gold">Vault Credentials</button>
                            <button onClick={() => setIsAddingCard(false)} className="px-6 py-3.5 border border-outline-variant/30 text-secondary text-[8px] uppercase tracking-[0.3em] font-black rounded-xl">Cancel</button>
                        </div>
                    </motion.div>
                ) : (
                    <button onClick={() => setIsAddingCard(true)} className="w-full py-5 glass-surface border border-primary/20 text-primary text-[10px] uppercase tracking-[0.4em] font-black rounded-xl hover:bg-primary hover:text-on-primary transition-all duration-700 relative z-10 shadow-lg active:scale-95">Vault Credentials</button>
                )}
            </AnimatePresence>
        </div>
      </section>

      <section className="pt-20 space-y-8 border-t border-outline-variant/10">
        <div className="max-w-md space-y-6">
            <h2 className="text-[12px] uppercase tracking-[0.5em] font-black text-on-surface">Curator Account Actions</h2>
            <div className="space-y-4">
                <button className="w-full text-left p-6 glass-surface border border-outline-variant/10 rounded-2xl flex justify-between items-center group hover:bg-primary/5 transition-all duration-500">
                    <span className="text-[10px] uppercase tracking-[0.4em] font-black text-secondary group-hover:text-primary transition-all">Download Curated Identity Data</span>
                    <span className="material-symbols-outlined text-sm text-outline-variant group-hover:text-primary transition-all">download</span>
                </button>
                <button className="w-full text-left p-6 glass-surface border border-outline-variant/10 rounded-2xl flex justify-between items-center group hover:bg-error/5 transition-all duration-500">
                    <span className="text-[10px] uppercase tracking-[0.4em] font-black text-error group-hover:tracking-[0.5em] transition-all">Request Registry Erasure</span>
                    <span className="material-symbols-outlined text-sm text-error/30 group-hover:text-error transition-all">delete_forever</span>
                </button>
            </div>
        </div>
      </section>
    </main>
  );
}
