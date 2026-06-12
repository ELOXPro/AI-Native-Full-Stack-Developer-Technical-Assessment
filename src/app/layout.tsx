import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Sidebar } from "@/app/_components/sidebar";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "MineTech AI Assessment",
  description: "Enterprise Smart Triage and Grounded Knowledge RAG Assistant",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        <TRPCReactProvider>
          <div className="flex w-full flex-col md:flex-row">
            <Sidebar />
            <main className="flex-grow min-h-screen overflow-y-auto px-4 py-6 md:px-10 md:py-8 bg-slate-900/30">
              {children}
            </main>
          </div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
