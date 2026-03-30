import TopAppBar from "@/components/TopAppBar";
import BottomNavBar from "@/components/BottomNavBar";
import Sidebar from "@/components/Sidebar";
import SophieConcierge from "@/components/SophieConcierge";
import { UIProvider } from "@/context/UIContext";
import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <CartProvider>
        <UIProvider>
          <div className="flex flex-col h-screen overflow-hidden bg-background">
            <TopAppBar />
            <Sidebar />
            <SophieConcierge />
            <main className="flex-1 overflow-y-auto w-full pt-16 font-label">
              {children}
            </main>
            <BottomNavBar />
          </div>
        </UIProvider>
      </CartProvider>
    </UserProvider>
  );
}
