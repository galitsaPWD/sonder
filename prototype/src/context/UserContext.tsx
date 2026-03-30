"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Card {
  id: string;
  number: string;
  name: string;
  expiry: string;
  type: "visa" | "mastercard" | "amex";
}

export interface Address {
  id: string;
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  title: string;
  since: string;
  status: string;
}

interface UserContextType {
  vaultedCards: Card[];
  vaultedAddresses: Address[];
  userProfile: UserProfile;
  activeVoucherId: string | null;
  addCard: (card: Omit<Card, "id">) => void;
  removeCard: (id: string) => void;
  addAddress: (address: Omit<Address, "id">) => void;
  removeAddress: (id: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  toggleVoucher: (id: string) => void;
  galerieOrders: any[];
  addOrder: (items: any[]) => void;
  isUserMounted: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [vaultedCards, setVaultedCards] = useState<Card[]>([]);
  const [vaultedAddresses, setVaultedAddresses] = useState<Address[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    phone: "",
    title: "Curator",
    since: "2021",
    status: "Platinum Status"
  });
  const [galerieOrders, setGalerieOrders] = useState<any[]>([
    {
      id: "item-03",
      title: "Solis Lounge Chair",
      img: "/assets/items/solis-lounge-chair.jpg",
      price: 75000,
      createdAt: 1711756800000, // Fixed: March 30, 2026, 00:00:00 (Synthesis/Transit transition)
      orderId: "ORD-SYN-88",
      orderDate: "03/28/2026"
    },
    {
      id: "item-05",
      title: "Monolith Chair",
      img: "/assets/items/monolith-ash-chair.jpg",
      price: 288000,
      createdAt: 1711670400000, // Fixed: March 29, 2026 (Deep Transit)
      orderId: "ORD-TRN-92",
      orderDate: "03/24/2026"
    },
    {
      id: "jewelry-01",
      title: "Tectonic Gold Cuff",
      img: "/assets/items/tectonic-gold-cuff.jpg",
      price: 228000,
      createdAt: 1711411200000, // Fixed: March 26, 2026 (Final Review)
      orderId: "ORD-REV-45",
      orderDate: "03/15/2026"
    }
  ]);
  const [activeVoucherId, setActiveVoucherId] = useState<string | null>(null);
  const [isUserMounted, setIsUserMounted] = useState(false);

  // Load from local storage
  useEffect(() => {
    setIsUserMounted(true);
    const saved = localStorage.getItem("atelier_user");
    if (saved) {
      try {
        const { cards, addresses, voucherId, orders, profile } = JSON.parse(saved);
        if (cards) setVaultedCards(cards);
        if (addresses) setVaultedAddresses(addresses);
        if (voucherId) setActiveVoucherId(voucherId);
        if (orders) {
          // Data Sanitization: Ensure every order has a createdAt and orderId to prevent 'INITIATING' loop
          const sanitizedOrders = orders.map((o: any) => ({
            ...o,
            createdAt: o.createdAt || (Date.now() - (24 * 60 * 60 * 1000)), // Backfill missing dates to 24h ago
            orderId: o.orderId || `ORD-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
          }));
          setGalerieOrders(sanitizedOrders);
        }
        if (profile) setUserProfile(prev => ({ ...prev, ...profile }));
      } catch (e) {
        console.error("Failed to parse user vault");
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isUserMounted) {
      localStorage.setItem("atelier_user", JSON.stringify({ 
        cards: vaultedCards, 
        addresses: vaultedAddresses,
        voucherId: activeVoucherId,
        orders: galerieOrders,
        profile: userProfile
      }));
    }
  }, [vaultedCards, vaultedAddresses, activeVoucherId, isUserMounted, userProfile]);

  const addCard = (card: Omit<Card, "id">) => {
    setVaultedCards((prev) => [...prev, { ...card, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const removeCard = (id: string) => {
    setVaultedCards((prev) => prev.filter((c) => c.id !== id));
  };

  const addAddress = (address: Omit<Address, "id">) => {
    setVaultedAddresses((prev) => [...prev, { ...address, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const removeAddress = (id: string) => {
    setVaultedAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...profile }));
  };

  const toggleVoucher = (id: string) => {
    setActiveVoucherId((prev) => (prev === id ? null : id));
  };

  const addOrder = (items: any[]) => {
    // Add date and ID to order for archival tracking
    const orderWithMetadata = items.map(item => ({
      ...item,
      orderId: `ORD-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      orderDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      createdAt: Date.now()
    }));
    setGalerieOrders((prev) => {
      // Duplication Shield: Ensure we're not adding items that already exist in the recent order stack
      const incomingIds = items.map(i => i.id);
      const isDuplicate = prev.some(o => incomingIds.includes(o.id) && (Date.now() - o.createdAt < 1000));
      if (isDuplicate) return prev;
      
      return [...orderWithMetadata, ...prev];
    });
  };

  return (
    <UserContext.Provider
      value={{ 
        vaultedCards, 
        vaultedAddresses, 
        userProfile,
        activeVoucherId,
        addCard, 
        removeCard, 
        addAddress, 
        removeAddress, 
        updateProfile,
        toggleVoucher,
        galerieOrders,
        addOrder,
        isUserMounted 
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
