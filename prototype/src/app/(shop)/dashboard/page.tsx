"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { ATELIER_ITEMS } from "@/lib/data";

const FEATURED_VOUCHERS = [
  { 
    id: "private_sale", 
    title: "Private Sale Access", 
    desc: "Expires in 2 days", 
    icon: "percent",
    benefit: "10% Off Entire Curated"
  },
  { 
    id: "complimentary_express", 
    title: "Complimentary Express", 
    desc: "Valid on orders > ₱30,000", 
    icon: "local_shipping",
    benefit: "Free Expedited Delivery"
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const { activeVoucherId, toggleVoucher, userProfile } = useUser();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <main className="pt-6 pb-32 px-6 max-w-screen-xl mx-auto space-y-16 animate-fade-in">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-12">
        <div className="space-y-4">
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isMounted ? 1 : 0, y: isMounted ? 0 : 10 }}
                className="space-y-4"
            >
                <span className="text-[10px] uppercase tracking-[0.4em] font-medium text-primary">Member Since 2021</span>
                <h1 className="font-headline italic text-6xl tracking-tighter text-on-surface">
                    {isMounted ? getGreeting() : 'Welcome'}, {userProfile.name || 'Curator'}
                </h1>
                <p className="text-secondary font-light tracking-wide uppercase text-xs">Curating your bespoke sanctuary in real-time</p>
            </motion.div>
        </div>
        
        {/* Vault Balance Card - Platinum Core Glass */}
        <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            className="w-full md:w-96 glass-surface p-8 rounded-[2.5rem] shadow-2xl flex flex-col gap-6 relative overflow-hidden transition-all border border-primary/20 group cursor-pointer"
        >
            {/* Geometric Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay"></div>
            
            <div className="absolute -right-8 -top-8 opacity-[0.05] pointer-events-none text-primary group-hover:rotate-12 transition-transform duration-1000">
                <span className="material-symbols-outlined text-[12rem]">account_balance_wallet</span>
            </div>
            
            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/60">Sovereign Vault Balance</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-headline italic tracking-tighter text-on-surface">₱747,000</span>
                        <span className="text-[10px] font-mono text-secondary opacity-40">.00</span>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary transition-all duration-500 group-hover:text-on-primary shadow-inner border border-primary/20">
                    <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                </div>
            </div>
            
            <div className="h-[1px] luxury-gradient w-full relative z-10 opacity-30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"></div>
            
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]"></div>
                    <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary">Platinum Member</p>
                </div>
                <button className="h-10 px-6 rounded-xl bg-on-surface text-surface text-[9px] uppercase tracking-[0.4em] font-black hover:bg-primary transition-all shadow-xl">Top Up</button>
            </div>
        </motion.div>
      </section>
      
      {/* Hallmark Navigation - High Density Grid */}
      <div className="py-12 border-t border-b border-outline-variant/10">
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-x-4 gap-y-10">
            {[
            { id: 'jewelry', icon: 'diamond', label: 'Jewelry' },
            { id: 'couture', icon: 'checkroom', label: 'Couture' },
            { id: 'galerie', icon: 'auto_stories', label: 'Galerie' },
            { id: 'living', icon: 'chair', label: 'Living' },
            { id: 'essence', icon: 'water_drop', label: 'Essence' },
            { id: 'horology', icon: 'watch', label: 'Horology' },
            { id: 'cellar', icon: 'wine_bar', label: 'Cellar' },
            { id: 'other', icon: 'more_horiz', label: 'Other' },
            ].map((item, idx) => (
            <motion.div 
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isMounted ? 1 : 0, y: isMounted ? 0 : 10 }}
                transition={{ delay: idx * 0.05 }}
            >
                <Link href={`/items?category=${item.id}`} className="flex flex-col items-center gap-3 group cursor-pointer">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] bg-surface-container-low flex items-center justify-center transition-all duration-500 group-hover:glass-surface group-hover:scale-110 shadow-sm border border-outline-variant/10 group-hover:border-primary/40 relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="material-symbols-outlined text-secondary/60 group-hover:text-primary transition-colors text-xl sm:text-2xl font-light relative z-10">{item.icon}</span>
                    </div>
                    <span className="text-[7px] sm:text-[8px] uppercase tracking-[0.4em] font-black text-secondary/40 group-hover:text-primary transition-colors text-center">{item.label}</span>
                </Link>
            </motion.div>
            ))}
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch pt-8">
        {/* Hero Feature */}
        <Link href="/items" className="md:col-span-8 group relative overflow-hidden rounded-2xl h-[480px] block shadow-xl transition-all hover:shadow-2xl">
            <Image fill priority sizes="(max-width: 768px) 100vw, 66vw" alt="Luxury curation" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB58PmMxHVCWP6-7SOkg31nufdA5ZvisEJQVjDvIYblyOiaxTt4F08rZiW5UYWOZysFHmPXCyTWOc2xbhFCAtzpzkY836gIwOHBMHBw_9k_KMHuWaKAgd8bODTQ5WOOy7yal-aImdzhwaojTLCP4qQCWigddhLbXAq__vh-8jCr3eR5485WJF3-dNzJne5s26EQSEBcB1P04axy2Hl1ROogNJXy7ljfsQKNxz6Wqo3IxVWX1LOzQu1axh9BAPrAGOEUXTxMz9pEPUk"/>
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface-variant/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-12 space-y-6">
                <span className="text-[10px] uppercase tracking-[0.4em] font-medium text-primary-fixed border-b border-primary-fixed/30 pb-2">Volume IV Curated</span>
                <h2 className="font-headline text-5xl text-surface leading-[1.05] max-w-lg tracking-tighter italic">Timeless Pieces for the Modern Collector</h2>
                <div className="inline-flex items-center gap-4 bg-surface text-on-surface px-10 py-4 rounded-md font-label uppercase text-[10px] tracking-[0.2em] font-black group-hover:bg-primary group-hover:text-on-primary transition-all shadow-2xl">
                    Open Curated
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
            </div>
        </Link>
        
        {/* Vouchers Side Card - Mechanical Slot-in */}
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:col-span-4 bg-surface-container-low p-10 rounded-3xl flex flex-col justify-between border border-outline-variant/10 curator-shadow shadow-2xl relative"
        >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none scale-150">
                <span className="material-symbols-outlined text-9xl">confirmation_number</span>
            </div>
            
            <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-center pb-6 border-b border-outline-variant/10">
                    <h3 className="font-headline italic text-2xl tracking-tight">Privilege Vault</h3>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                      <span className="material-symbols-outlined text-sm">confirmation_number</span>
                    </div>
                </div>
                <div className="space-y-5">
                    {FEATURED_VOUCHERS.map((v, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        key={v.id} 
                        onClick={() => toggleVoucher(v.id)}
                        className={`p-6 rounded-2xl flex items-center gap-5 border transition-all duration-500 cursor-pointer group hover:shadow-xl ${activeVoucherId === v.id ? 'glass-surface border-primary/40 shadow-xl scale-[1.02]' : 'bg-surface-container-lowest border-outline-variant/5 hover:border-primary/20'}`}
                      >
                          <div className={`w-14 h-14 flex-shrink-0 rounded-xl flex items-center justify-center transition-all ${activeVoucherId === v.id ? 'bg-primary text-on-primary shadow-lg shadow-primary/30' : 'bg-surface-container-high text-secondary group-hover:bg-primary-fixed/30 group-hover:text-primary border border-outline-variant/10'}`}>
                              <span className="material-symbols-outlined text-2xl font-light">{v.icon}</span>
                          </div>
                          <div className="flex-1 space-y-1">
                              <p className={`text-[10px] uppercase tracking-[0.2em] font-black transition-colors ${activeVoucherId === v.id ? 'text-primary' : 'text-on-surface'}`}>{v.title}</p>
                              <p className="text-[9px] text-secondary font-light uppercase tracking-widest">{v.benefit}</p>
                          </div>
                      </motion.div>
                    ))}
                </div>
            </div>
            <Link href="/rewards" className="mt-10 group flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-secondary hover:text-on-surface transition-all py-6 border-t border-outline-variant/15 w-full">
                All Rewards
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-2">east</span>
            </Link>
        </motion.div>
      </section>

      {/* Featured Grid — from live catalog */}
      <section className="space-y-16 py-16">
        <div className="flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-primary">Limited Curations</span>
            <h3 className="font-headline italic text-4xl tracking-tighter leading-tight">Heritage Artisanship for the Modern Era</h3>
            <div className="h-0.5 w-16 bg-primary/20"></div>
            <p className="text-secondary font-light leading-relaxed text-sm">Our midsummer series celebrates the harmony between volcanic raw materials and refined classical silhouettes.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {ATELIER_ITEMS.slice(0, 3).map((product, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, delay: i * 0.2 }}
                key={product.id}
              >
                  <Link href={`/product/${product.id}`} className={`space-y-8 group block ${i === 1 ? 'md:translate-y-12' : ''}`}>
                      <div className="aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-surface-container-low curator-shadow border border-outline-variant/10 relative shadow-2xl">
                          <Image fill sizes="(max-width: 768px) 100vw, 33vw" alt={product.title} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-1000 grayscale-[20%] group-hover:grayscale-0" src={product.img}/>
                          <div className="absolute inset-0 bg-on-surface/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      </div>
                      <div className="space-y-3 text-center">
                          <h4 className="font-headline italic text-2xl group-hover:text-primary transition-colors tracking-tight">{product.title}</h4>
                          <div className="flex flex-col items-center gap-2">
                              <p className="text-[10px] uppercase tracking-[0.4em] text-secondary/60 font-black">{product.desc}</p>
                              <p className="font-headline text-lg italic text-on-surface-variant opacity-80">{product.price}</p>
                          </div>
                      </div>
                  </Link>
              </motion.div>
            ))}
        </div>
      </section>
    </main>
  );
}
