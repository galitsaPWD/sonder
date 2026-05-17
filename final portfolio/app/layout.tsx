import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CM",
  description: "Full-stack web and mobile developer based in the Philippines. Building web apps, mobile apps, and AI-powered tools.",
  icons: {
    icon: "/favicon.png",
  },
};

import Navbar from "@/components/Navbar";
import CustomCursor from "@/components/CustomCursor";
import ScrollProgress from "@/components/ScrollProgress";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col bg-background text-text-primary"
        suppressHydrationWarning
      >
        <ScrollProgress />
        <CustomCursor />
        <Navbar />
        {children}
      </body>
    </html>
  );
}

