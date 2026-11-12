import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "PayWise · Smart Banking Assistant",
  description: "Check balances, understand spends, move money between your accounts and set budgets, in plain English.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-screen font-sans">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
