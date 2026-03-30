"use client";

import React, { createContext, useContext, useState } from "react";

interface UIContextType {
  isSidebarOpen: boolean;
  isConciergeOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  openConcierge: () => void;
  closeConcierge: () => void;
  toggleConcierge: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const openConcierge = () => {
    setIsConciergeOpen(true);
    setIsSidebarOpen(false); // Auto-close sidebar for clarity
  };
  const closeConcierge = () => setIsConciergeOpen(false);
  const toggleConcierge = () => setIsConciergeOpen((prev) => !prev);

  return (
    <UIContext.Provider
      value={{
        isSidebarOpen,
        isConciergeOpen,
        openSidebar,
        closeSidebar,
        toggleSidebar,
        openConcierge,
        closeConcierge,
        toggleConcierge,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
