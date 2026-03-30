"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";

type AuthMode = "signin" | "signup";

export default function Auth() {
  const router = useRouter();
  const { userProfile } = useUser();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signin" && step === 1) {
      setStep(2);
    } else {
      router.push("/dashboard");
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === "signin" ? "signup" : "signin");
    setStep(1);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-surface">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[60%] opacity-20 blur-[120px] bg-primary/10 rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[5%] w-[30%] h-[50%] opacity-10 blur-[100px] bg-primary/5 rounded-full"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-[420px] animate-fade-in">
        <div className="text-center mb-16">
          <h1 className="font-headline italic text-4xl tracking-tighter text-on-surface mb-2">ATELIER</h1>
          <p className="font-label text-[10px] uppercase tracking-[0.3em] text-secondary">Est. MMXXIV</p>
        </div>
        
        <div className="bg-surface-container-lowest p-8 md:p-12 rounded-[2rem] shadow-[0_40px_80px_rgba(28,27,27,0.03)] border border-primary/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-50"></div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${step}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              <header className="mb-10 text-center">
                <h2 className="font-headline text-3xl mb-3 text-on-surface italic tracking-tighter">
                  {mode === "signin" ? (step === 1 ? "Welcome back" : "Security Check") : "Create Profile"}
                </h2>
                <p className="text-secondary/60 text-[10px] uppercase tracking-widest leading-relaxed">
                  {mode === "signin" 
                    ? (step === 1 ? "Enter your details to access the vault" : "Verify your identity credentials") 
                    : "Register your curatorial profile to begin"}
                </p>
              </header>
              
              <form className="space-y-8" onSubmit={handleNext}>
                {mode === "signup" && (
                  <div className="group">
                    <label className="block font-label text-[9px] uppercase tracking-widest text-secondary mb-2 px-1" htmlFor="name">Full Name</label>
                    <div className="relative bg-surface p-4 rounded-xl border border-outline-variant/20 focus-within:border-primary/40 transition-all shadow-inner">
                      <input 
                        className="bg-transparent border-none focus:ring-0 outline-none w-full text-on-surface placeholder:text-outline-variant text-sm font-medium" 
                        id="name" 
                        placeholder={userProfile.name} 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                )}

                {step === 1 ? (
                  <div className="group">
                    <label className="block font-label text-[9px] uppercase tracking-widest text-secondary mb-2 px-1" htmlFor="phone">Phone Number</label>
                    <div className="relative bg-surface p-4 rounded-xl border border-outline-variant/20 focus-within:border-primary/40 transition-all shadow-inner flex items-center">
                      <span className="text-secondary/40 text-xs mr-3 border-r border-outline-variant/20 pr-3 font-mono">+63</span>
                      <input 
                        className="bg-transparent border-none focus:ring-0 outline-none w-full text-on-surface placeholder:text-outline-variant text-sm font-medium tracking-widest" 
                        id="phone" 
                        placeholder="9XX XXX XXXX" 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="group animate-fade-in">
                    <label className="block font-label text-[9px] uppercase tracking-widest text-secondary mb-2 px-1" htmlFor="password">Password</label>
                    <div className="relative bg-surface p-4 rounded-xl border border-outline-variant/20 focus-within:border-primary/40 transition-all shadow-inner">
                      <input 
                        className="bg-transparent border-none focus:ring-0 outline-none w-full text-on-surface placeholder:text-outline-variant text-sm font-medium tracking-[0.2em]" 
                        id="password" 
                        placeholder="••••••••" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                        required 
                      />
                    </div>
                    <div className="flex justify-end mt-3 px-1">
                      <button type="button" onClick={() => setStep(1)} className="text-[9px] uppercase tracking-widest text-primary/60 hover:text-primary font-bold transition-colors">
                        Forgot Password?
                      </button>
                    </div>
                  </div>
                )}

                <button className="w-full bg-on-surface text-surface py-5 px-6 rounded-xl font-label text-[10px] uppercase tracking-[0.4em] font-black shadow-2xl active:scale-[0.98] transition-all duration-300 hover:bg-primary shimmer-gold" type="submit">
                  {mode === "signin" && step === 1 ? "Next" : (mode === "signin" ? "Enter Vault" : "Create Profile")}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
          
          <div className="relative flex items-center my-10">
            <div className="flex-grow border-t border-outline-variant/15"></div>
            <span className="flex-shrink mx-4 font-label text-[8px] uppercase tracking-[0.3em] text-outline-variant font-bold">Or continue with</span>
            <div className="flex-grow border-t border-outline-variant/15"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => router.push("/dashboard")} className="flex items-center justify-center gap-3 py-3 px-4 bg-surface hover:bg-surface-container-low transition-all duration-300 border border-outline-variant/20 rounded-xl group">
              <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="currentColor"></path>
              </svg>
              <span className="font-label text-[9px] uppercase tracking-widest text-on-surface font-bold">Google</span>
            </button>
            <button type="button" onClick={() => router.push("/dashboard")} className="flex items-center justify-center gap-3 py-3 px-4 bg-surface hover:bg-surface-container-low transition-all duration-300 border border-outline-variant/20 rounded-xl group">
              <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
              </svg>
              <span className="font-label text-[9px] uppercase tracking-widest text-on-surface font-bold">Facebook</span>
            </button>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <button 
            type="button"
            onClick={toggleMode}
            className="font-label text-[10px] uppercase tracking-[0.3em] text-secondary hover:text-primary transition-all group"
          >
            {mode === "signin" ? (
              <>Don't have an account? <span className="text-primary font-black group-hover:tracking-[0.4em] transition-all">Create Profile</span></>
            ) : (
              <>Already have an account? <span className="text-primary font-black group-hover:tracking-[0.4em] transition-all">Log In</span></>
            )}
          </button>
        </div>
      </div>
      
      {/* Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuADGOH3wgrvDQxFSUsvcYoaLOutH8UMRY0gENKV2XXeuhJsl4X649qCyGtw71XLE4HOhAb10KO9g0QT6jZ0RKjUlpAJt9Yio2mkgIWi7ADizQ1rjzKaliL_qptmuHeyIxHM9wLmOgmvUFv_gVZLNHP1pHf-kxOfGMM-XJvJHxJVjoZqPV2gnOziEF6-YN8307t_hwmV1FCFREGJqQNivOXICpEX7ltCHL0Jvsywe3SYoMlgnJ2QdBZrBlltNm286Whoaf4S_eX8drA')"}}></div>
    </main>
  );
}
