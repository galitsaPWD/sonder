"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";

export default function BottomNavBar() {
  const pathname = usePathname();
  const { cart } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <nav className="fixed bottom-0 left-0 w-full z-50 glass-surface h-20 md:hidden" />;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 glass-surface flex justify-around items-end pt-2 pb-5 px-6 rounded-t-[2.5rem] border-t border-primary/10 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] md:hidden">
      <Link href="/dashboard" className={`flex flex-col items-center justify-center gap-1 transition-all duration-500 ${pathname === '/dashboard' ? 'text-primary scale-110' : 'text-secondary/60 hover:text-primary'}`}>
        <span className="material-symbols-outlined text-[20px] font-light">home</span>
        <span className="text-[7px] uppercase tracking-[0.3em] font-black">{pathname === '/dashboard' ? 'Home' : 'Main'}</span>
      </Link>
      <Link href="/items" className={`flex flex-col items-center justify-center gap-1 transition-all duration-500 ${pathname.includes('/items') || pathname.includes('/product') ? 'text-primary scale-110' : 'text-secondary/60 hover:text-primary'}`}>
        <span className="material-symbols-outlined text-[20px] font-light">auto_awesome</span>
        <span className="text-[7px] uppercase tracking-[0.3em] font-black">{pathname.includes('/items') ? 'Curated' : 'Curated'}</span>
      </Link>
      <Link href="/checkout" className={`flex flex-col items-center justify-center gap-1 transition-all duration-500 relative ${pathname === '/checkout' ? 'text-primary scale-110' : 'text-secondary/60 hover:text-primary'}`}>
        <span className="material-symbols-outlined text-[20px] font-light" style={pathname === '/checkout' ? {fontVariationSettings: "'FILL' 1"} : {}}>account_balance_wallet</span>
        <span className="text-[7px] uppercase tracking-[0.3em] font-black">Vault</span>
        {/* Archival Badge */}
        {cart.length > 0 && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background animate-pulse"></div>}
      </Link>
      <Link href="/profile" className={`flex flex-col items-center justify-center gap-1 transition-all duration-500 ${pathname === '/profile' ? 'text-primary scale-110' : 'text-secondary/60 hover:text-primary'}`}>
        <span className="material-symbols-outlined text-[20px] font-light">person</span>
        <span className="text-[7px] uppercase tracking-[0.3em] font-black">Profile</span>
      </Link>
    </nav>
  );
}
