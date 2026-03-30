import type { Metadata } from "next";
import { Inter, Noto_Serif } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import { UIProvider } from "@/context/UIContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ATELIER",
  description: "Luxury minimalist boutique",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${notoSerif.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="bg-surface text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed antialiased">
        <CartProvider>
          <UserProvider>
            <UIProvider>
              {children}
            </UIProvider>
          </UserProvider>
        </CartProvider>
      </body>
    </html>
  );
}
