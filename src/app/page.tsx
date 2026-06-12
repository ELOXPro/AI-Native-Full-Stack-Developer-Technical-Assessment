"use client";

// System dashboard landing page. Periodically polls '/api/health' to present database stats and AI server statuses.
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  FileText,
  Brain,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Server,
  Clock,
} from "lucide-react";

interface HealthData {
  llmStatus: "online" | "offline";
  embeddingStatus: "online" | "offline";
  documentsIndexed: number;
  ticketCount: number;
  chatCount: number;
  lastQueryTime: string | null;
}

export default function Dashboard() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchMetrics() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Failed to load metrics");
      const healthData = (await res.json()) as HealthData;
      setData(healthData);
      setError(null);
    } catch {
      setError("Failed to connect to the backend system. Please verify database and server status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void fetchMetrics();
  }, []);

  const formatLastQueryTime = (isoString: string | null) => {
    if (!isoString) return "Never";
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="h-8 w-64 rounded bg-slate-800" />
            <div className="mt-2 h-4 w-96 rounded bg-slate-800" />
          </div>
        </div>


        <div className="grid gap-5 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl border border-slate-800 bg-slate-900/40 p-6" />
          ))}
        </div>


        <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/40 p-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-rose-500/10 p-4 text-rose-500 shadow-md">
          <Server className="h-10 w-10 animate-bounce" />
        </div>
        <h2 className="mt-6 text-xl font-bold text-slate-100">System Connection Failure</h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">{error}</p>
        <button
          onClick={() => void fetchMetrics()}
          className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors animate-pulse"
        >
          <RefreshCw className="h-4 w-4" /> Retry Connection
        </button>
      </div>
    );
  }

  const isSystemHealthy = data?.llmStatus === "online" && data?.embeddingStatus === "online";

  return (
    <div className="space-y-8">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 md:text-4xl">System Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time analytics and status monitoring for MineTech AI intake triage and knowledge retrieval.
          </p>
        </div>
        <button
          onClick={() => void fetchMetrics()}
          disabled={refreshing}
          className="self-start flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900 hover:text-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Status"}
        </button>
      </div>


      <div className="grid gap-5 sm:grid-cols-3">

        <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30 p-6 shadow-sm hover:border-slate-700/80 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-400">
              <Inbox className="h-6 w-6" />
            </div>
            <Link
              href="/triage"
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              {data?.ticketCount ?? 0}
            </span>
            <h3 className="mt-1 text-sm font-medium text-slate-400">Total Triaged Tickets</h3>
            <p className="mt-1.5 text-xs text-slate-500 font-light">Intake support tickets analyzed</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500/20 group-hover:bg-indigo-500/50 transition-colors" />
        </div>


        <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30 p-6 shadow-sm hover:border-slate-700/80 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-400">
              <FileText className="h-6 w-6" />
            </div>
            <Link
              href="/documents"
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              {data?.documentsIndexed ?? 0}
            </span>
            <h3 className="mt-1 text-sm font-medium text-slate-400">Documents Indexed</h3>
            <p className="mt-1.5 text-xs text-slate-500 font-light">Knowledge base articles ingested</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500/20 group-hover:bg-emerald-500/50 transition-colors" />
        </div>


        <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30 p-6 shadow-sm hover:border-slate-700/80 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="rounded-lg bg-sky-500/10 p-3 text-sky-400">
              <Brain className="h-6 w-6" />
            </div>
            <Link
              href="/knowledge"
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              {data?.chatCount ?? 0}
            </span>
            <h3 className="mt-1 text-sm font-medium text-slate-400">Chat Queries Answered</h3>
            <p className="mt-1.5 text-xs text-slate-500 font-light font-sans">Grounded prompts resolved</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-500/20 group-hover:bg-sky-500/50 transition-colors" />
        </div>
      </div>


      <div className="grid gap-6 md:grid-cols-3">

        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/20 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Server className="h-6 w-6 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-200">AI Cluster Health Diagnostics</h2>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Real-time status metrics of underlying self-hosted LLM and embedding hardware agents.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">

            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                Language Model (LLM)
              </span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">qwen2.5:3b</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    data?.llmStatus === "online"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      data?.llmStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                  {data?.llmStatus === "online" ? "Active" : "Offline"}
                </span>
              </div>
            </div>


            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                Embedding Model
              </span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">nomic-embed-text</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    data?.embeddingStatus === "online"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      data?.embeddingStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                  {data?.embeddingStatus === "online" ? "Active" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-800/80 pt-5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-4 w-4 text-slate-500" />
              <span>Last AI Query Processed:</span>
              <span className="font-semibold text-slate-300">
                {formatLastQueryTime(data?.lastQueryTime ?? null)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Activity className="h-4 w-4 text-slate-500" />
              <span>Overall Status:</span>
              <span
                className={`font-semibold ${isSystemHealthy ? "text-emerald-400" : "text-rose-400"}`}
              >
                {isSystemHealthy ? "Fully Operational" : "Degraded / Check Services"}
              </span>
            </div>
          </div>
        </div>


        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-200">System Integration</h2>
            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed font-light">
              MineTech AI utilizes dynamic in-context learning. Documents uploaded in Document Management are partitioned into chunks, embedded using <strong className="text-slate-200 font-medium">nomic-embed-text</strong>, and searched using in-memory cosine similarities to compile grounded prompts.
            </p>
            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed font-light">
              Smart Intake Triage analyses raw customer support tickets to categorize them automatically, routing them and drafting replies in real-time.
            </p>
          </div>
          <div className="mt-5 border-t border-slate-800/80 pt-4 flex gap-3">
            <Link
              href="/triage"
              className="flex-grow text-center rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold hover:bg-indigo-500 transition-colors shadow-sm"
            >
              Intake Triage
            </Link>
            <Link
              href="/knowledge"
              className="flex-grow text-center rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-sm"
            >
              Knowledge Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
