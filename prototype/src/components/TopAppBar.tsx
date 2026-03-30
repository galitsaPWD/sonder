"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useUI } from "@/context/UIContext";
import { useState, useEffect } from "react";

export default function TopAppBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart } = useCart();
  const { toggleSidebar, openConcierge } = useUI();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isProductPage = pathname?.startsWith("/product/");

  if (!isMounted) return <header className="fixed top-0 w-full z-50 bg-[#fcf9f8]/70 backdrop-blur-xl h-16" />;

  return (
    <header className="fixed top-0 w-full z-50 bg-[#fcf9f8]/70 backdrop-blur-xl flex items-center px-6 h-16">
      <div className="z-10">
        {isProductPage ? (
          /* On product pages: back button replaces the menu icon */
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-secondary hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="text-[9px] uppercase tracking-[0.35em] font-black">Back</span>
          </button>
        ) : (
          <button onClick={toggleSidebar} aria-label="Menu" className="text-secondary hover:opacity-70 transition-opacity active:scale-95 duration-200">
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
      </div>
      
      <Link href="/dashboard" className="absolute left-1/2 -translate-x-1/2 font-headline text-[#1c1b1b] tracking-[0.2em] uppercase text-lg cursor-pointer hover:opacity-70 transition-opacity">
        ATELIER
      </Link>

      <div className="flex-1 flex justify-end items-center z-10">
        {(pathname === "/profile" || pathname === "/profile/settings") ? (
          <Link href="/profile/settings" className="text-secondary hover:text-primary transition-all duration-500 hover:scale-110 active:scale-95">
              <span className="material-symbols-outlined text-2xl font-thin">settings</span>
          </Link>
        ) : !isProductPage ? (
          <button onClick={openConcierge} className="flex items-center gap-2 text-secondary hover:text-primary transition-all duration-500 hover:scale-110 active:scale-95 bg-primary/8 hover:bg-primary/15 border border-primary/20 rounded-full px-3 py-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
              <circle cx="12" cy="12.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 12.5C7 9.73858 9.23858 7.5 12 7.5C14.7614 7.5 17 9.73858 17 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="10" cy="12" r="0.7" fill="currentColor" />
              <circle cx="14" cy="12" r="0.7" fill="currentColor" />
              <path d="M16 14.5C16.5 14.5 17.5 15.5 17.5 16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-[9px] uppercase tracking-[0.3em] font-black text-primary/70 hidden sm:block">Sophie</span>
          </button>
        ) : (
          /* On product pages: pill, icon only */
          <button onClick={openConcierge} className="flex items-center gap-2 text-secondary hover:text-primary transition-all duration-500 hover:scale-110 active:scale-95 bg-primary/8 hover:bg-primary/15 border border-primary/20 rounded-full px-3 py-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
              <circle cx="12" cy="12.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 12.5C7 9.73858 9.23858 7.5 12 7.5C14.7614 7.5 17 9.73858 17 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="10" cy="12" r="0.7" fill="currentColor" />
              <circle cx="14" cy="12" r="0.7" fill="currentColor" />
              <path d="M16 14.5C16.5 14.5 17.5 15.5 17.5 16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
