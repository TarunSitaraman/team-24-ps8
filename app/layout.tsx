import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayWise — Minimalist Smart Banking Assistant",
  description:
    "Autonomous agentic banking assistant powered by Google Gemini Function Calling & Supabase.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#fafafa] text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
