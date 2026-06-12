"use client";

// Sidebar component containing navigation routes and a background interval timer (10s) polling server health.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Brain,
  FileText,
  Activity,
  Menu,
  X,
} from "lucide-react";

interface HealthData {
  llmStatus: "online" | "offline";
  embeddingStatus: "online" | "offline";
}

export function Sidebar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthData>({
    llmStatus: "offline",
    embeddingStatus: "offline",
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = (await res.json()) as HealthData;
          setHealth(data);
        }
      } catch (e) {
        console.error("Failed to fetch health for sidebar status:", e);
      }
    }
    void fetchHealth();
    const interval = setInterval(() => {
      void fetchHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Smart Intake", href: "/triage", icon: Inbox },
    { name: "Knowledge RAG", href: "/knowledge", icon: Brain },
    { name: "Documents", href: "/documents", icon: FileText },
  ];

  const isLlmOnline = health.llmStatus === "online";
  const isEmbedOnline = health.embeddingStatus === "online";

  return (
    <>

      <div className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-100 tracking-wide text-lg">MineTech AI</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>


      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-950 px-4 py-6 transition-transform md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:static md:h-screen`}
      >

        <div className="hidden items-center gap-2.5 px-3 py-2 md:flex">
          <Activity className="h-7 w-7 text-emerald-400 animate-pulse" />
          <div>
            <span className="font-black text-slate-100 tracking-wider text-xl">MINE</span>
            <span className="font-semibold text-emerald-400 tracking-wider text-xl">TECH</span>
          </div>
        </div>


        <nav className="mt-8 flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-slate-900 text-emerald-400 border-l-2 border-emerald-500 shadow-[inset_4px_0_12px_rgba(16,185,129,0.06)]"
                    : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-100"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

  
        <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Live AI System</span>
          </div>
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">LLM Status</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLlmOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                  }`}
                />
                <span className={`font-semibold ${isLlmOnline ? "text-emerald-400" : "text-rose-400"}`}>
                  {isLlmOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Embed Model</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isEmbedOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                  }`}
                />
                <span className={`font-semibold ${isEmbedOnline ? "text-emerald-400" : "text-rose-400"}`}>
                  {isEmbedOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
