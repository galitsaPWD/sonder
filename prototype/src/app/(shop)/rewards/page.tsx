"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/context/UserContext";

const ALL_REWARDS = [
  { 
    id: "private_sale", 
    title: "Private Sale Access", 
    desc: "Personalized invitation to our curated private curated sale. Exclusive to Platinum tier members.",
    icon: "percent",
    benefit: "10% OFF ENTIRE CURATED COLLECTION",
    type: "Status"
  },
  { 
    id: "complimentary_express", 
    title: "Complimentary Express", 
    desc: "Sovereign delivery at zero cost for any order exceeding the curator's threshold.",
    icon: "local_shipping",
    benefit: "FREE EXPEDITED DELIVERY",
    type: "Logistics"
  },
  { 
    id: "atelier_tour", 
    title: "Atelier Discovery", 
    desc: "A private invitation to visit our Florence atelier and meet the master craftsmen.",
    icon: "location_on",
    benefit: "PRIVATE STUDIO TOUR",
    type: "Experience"
  },
  { 
    id: "early_access", 
    title: "Early Access", 
    desc: "Gain first-look access to our Limited Edition drops 48 hours before the public release.",
    icon: "schedule",
    benefit: "PRIORITY RESERVATION",
    type: "Access"
  },
];

export default function Rewards() {
  const { activeVoucherId, toggleVoucher } = useUser();

  return (
    <main className="pt-24 pb-32 px-6 max-w-screen-xl mx-auto space-y-16">
      <header className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[10px] uppercase tracking-[0.4em] font-medium text-primary">Loyalty Hub</span>
          <h1 className="font-headline italic text-5xl tracking-tighter">Your Privileges</h1>
          <p className="text-secondary font-light leading-relaxed">As a Platinum tier member, you hold keys to the inner sanctum of the Atelier. Curate your benefits below.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {ALL_REWARDS.map((reward, i) => (
            <div 
              key={reward.id}
              onClick={() => toggleVoucher(reward.id)}
              className={`p-10 rounded-2xl border transition-all duration-700 cursor-pointer group relative overflow-hidden flex flex-col justify-between h-[360px] animate-fade-in ${activeVoucherId === reward.id ? 'glass-surface border-primary/40 shadow-2xl scale-[1.02] ring-1 ring-primary/20' : 'bg-surface-container-low border-outline-variant/10 hover:border-primary/30 curator-shadow hover:-translate-y-1'}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
                {/* Background Pattern */}
                <div className={`absolute top-0 right-0 p-8 opacity-5 transition-transform duration-700 group-hover:scale-110 ${activeVoucherId === reward.id ? 'text-primary' : ''}`}>
                    <span className="material-symbols-outlined text-[160px] translate-x-1/4 -translate-y-1/4">{reward.icon}</span>
                </div>

                <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-start">
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border ${activeVoucherId === reward.id ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-secondary'}`}>
                            {reward.type}
                        </span>
                        {activeVoucherId === reward.id && (
                          <span className="flex items-center gap-2 text-primary font-label text-[10px] uppercase tracking-widest font-bold animate-pulse">
                              <span className="material-symbols-outlined text-sm">verified</span>
                              Activated
                          </span>
                        )}
                    </div>
                    <div>
                        <h2 className="font-headline italic text-3xl mb-3 tracking-tight">{reward.title}</h2>
                        <p className="text-secondary text-sm leading-relaxed max-w-xs">{reward.desc}</p>
                    </div>
                </div>

                <div className="pt-8 border-t border-outline-variant/15 flex justify-between items-end relative z-10">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-secondary mb-1">Benefit</p>
                        <p className={`font-label text-sm font-bold tracking-widest ${activeVoucherId === reward.id ? 'text-primary' : 'text-on-surface'}`}>{reward.benefit}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeVoucherId === reward.id ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-secondary group-hover:bg-primary-fixed group-hover:text-on-primary-container'}`}>
                        <span className="material-symbols-outlined">{activeVoucherId === reward.id ? 'check' : 'add'}</span>
                    </div>
                </div>
            </div>
          ))}
      </div>

      <section className="bg-surface-container-lowest p-12 rounded-2xl border border-outline-variant/10 text-center space-y-6">
          <div className="w-16 h-1 w-16 mx-auto bg-outline-variant/20"></div>
          <h3 className="font-headline text-2xl italic tracking-tight">The Heritage Program</h3>
          <p className="max-w-xl mx-auto text-secondary text-sm leading-relaxed font-light">
              Your benefits accrue with every curation. Reach the next threshold to unlock the "Atelier Bespoke" level—granting you direct commission priority with our master artisans.
          </p>
          <div className="pt-4">
              <Link href="/dashboard" className="text-secondary hover:text-primary font-label text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Return to Dashboard
              </Link>
          </div>
      </section>
    </main>
  );
}
