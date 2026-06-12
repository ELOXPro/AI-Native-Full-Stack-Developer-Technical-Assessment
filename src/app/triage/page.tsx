"use client";

// Intake triage client interface. Posts support message strings to classifer endpoint and displays class classifications.
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Inbox,
  CheckCircle2,
  Copy,
  Check,
  Search,
  Filter,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const formSchema = z.object({
  message: z.string().min(10, "Support request description must be at least 10 characters long."),
});

type FormInput = z.infer<typeof formSchema>;

interface Ticket {
  id: string;
  rawText: string;
  category: string;
  priority: string;
  summary: string;
  suggestedReply: string;
  createdAt: string;
}

export default function TriagePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [latestTicket, setLatestTicket] = useState<Ticket | null>(null);
  
  // Parameters for local search, category, and priority filter parameters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  
  // Tracks the copy button success feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
  });

  async function fetchTickets() {
    try {
      const res = await fetch("/api/triage");
      if (res.ok) {
        const data = (await res.json()) as Ticket[];
        setTickets(data);
      }
    } catch (e) {
      console.error("Failed to load tickets list:", e);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    void fetchTickets();
  }, []);

  const onSubmit = async (data: FormInput) => {
    setAnalyzing(true);
    setLatestTicket(null);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: data.message }),
      });
      if (!res.ok) {
        throw new Error("Failed to triage request");
      }
      const ticket = (await res.json()) as Ticket;
      setLatestTicket(ticket);
      setTickets((prev) => [ticket, ...prev]);
      reset();
    } catch (err) {
      console.error("Triage submission error:", err);
      alert("Error analyzing support ticket. Make sure database and Ollama are running.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryStyle = (cat: string) => {
    switch (cat) {
      case "Technical Support":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "Billing":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "Account":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  const getPriorityStyle = (pri: string) => {
    switch (pri) {
      case "Critical":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse font-semibold";
      case "High":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold";
      case "Medium":
        return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  // Intersects search queries, category filters, and priority filters locally in client state
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.rawText.toLowerCase().includes(search.toLowerCase()) ||
      t.summary.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
    const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 md:text-4xl">Smart Intake Triage</h1>
        <p className="mt-1 text-sm text-slate-400">
          Process raw support emails or customer queries through AI classification to extract summaries, prioritize, and generate draft responses.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5 items-start">

        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-200">
              <Inbox className="h-5 w-5 text-indigo-400" />
              <span>Incoming Message Analyzer</span>
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Support Ticket Text
                </label>
                <textarea
                  id="message"
                  rows={8}
                  placeholder="Paste raw support request text here (e.g. 'Hello, I'm unable to log in to my account since yesterday and it says invalid credentials. I tried resetting my password but no email was received. Please help.')"
                  className={`mt-2 w-full rounded-lg border bg-slate-950 p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                    errors.message ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500" : "border-slate-800"
                  }`}
                  {...register("message")}
                />
                {errors.message && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.message.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={analyzing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Analyzing Intake via LLM...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-emerald-200" />
                    <span>Analyze Support Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>


        <div className="lg:col-span-2">
          {latestTicket ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 shadow-md shadow-emerald-950/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 rounded-bl-xl bg-emerald-500/10 px-3 py-1 border-l border-b border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Triaged</span>
              </div>

              <h2 className="text-lg font-bold text-slate-200">Triage Extraction</h2>
              
              <div className="mt-5 space-y-4">

                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryStyle(latestTicket.category)}`}>
                    {latestTicket.category}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityStyle(latestTicket.priority)}`}>
                    {latestTicket.priority} Priority
                  </span>
                </div>


                <div className="rounded-lg border border-slate-850 bg-slate-900/50 p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summary</h4>
                  <p className="mt-1.5 text-sm text-slate-200 leading-relaxed font-sans">{latestTicket.summary}</p>
                </div>


                <div className="rounded-lg border border-slate-850 bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suggested Reply</h4>
                    <button
                      onClick={() => handleCopy(latestTicket.id, latestTicket.suggestedReply)}
                      className="flex items-center gap-1.5 rounded bg-slate-850 px-2 py-1 text-xs text-slate-400 hover:text-slate-100 transition-colors"
                    >
                      {copiedId === latestTicket.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Reply</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-2.5 rounded bg-slate-950/80 p-3 text-xs font-mono text-slate-300 leading-relaxed border border-slate-850 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {latestTicket.suggestedReply}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/10 p-12 text-center h-[410px]">
              <div className="rounded-full bg-slate-900 p-4 text-slate-500">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-300">Awaiting Intake Analysis</h3>
              <p className="mt-1 max-w-[240px] text-xs text-slate-500 leading-relaxed">
                Submit a customer ticket on the left to extract classifications and drafts.
              </p>
            </div>
          )}
        </div>
      </div>


      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-slate-200">Historical Tickets Queue</h2>
          <span className="text-xs text-slate-500">{filteredTickets.length} of {tickets.length} tickets found</span>
        </div>


        <div className="grid gap-3 sm:grid-cols-4 rounded-xl border border-slate-850 bg-slate-950 p-4 shadow-sm">

          <div className="sm:col-span-2 relative">
            <Search className="absolute top-2.5 left-3 h-4.5 w-4.5 text-slate-600" />
            <input
              type="text"
              placeholder="Search content or summaries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-850 bg-slate-900/60 py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>


          <div className="relative flex items-center">
            <Filter className="absolute left-3 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-850 bg-slate-900/60 py-2 pl-9 pr-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Billing">Billing</option>
              <option value="Account">Account</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>


          <div className="relative flex items-center">
            <Filter className="absolute left-3 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-850 bg-slate-900/60 py-2 pl-9 pr-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>


        {loadingList ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <span className="mt-3 text-sm text-slate-400 font-medium">Loading ticket archives...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-850 bg-slate-900/10 py-16 text-center">
            <Inbox className="h-10 w-10 text-slate-650" />
            <h3 className="mt-4 text-sm font-semibold text-slate-300">No Tickets Logged</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
              No support tickets match the current search or filters. Submit a new support request above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/15">
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Summary</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Date Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="px-6 py-4 font-sans font-normal text-slate-200">
                      <div className="max-w-md font-medium text-slate-100 truncate">{ticket.summary}</div>
                      <div className="max-w-md mt-1 text-xs text-slate-500 truncate leading-relaxed">{ticket.rawText}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${getCategoryStyle(ticket.category)}`}>
                        {ticket.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${getPriorityStyle(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-sans">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <button
                        onClick={() => handleCopy(ticket.id, ticket.suggestedReply)}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-slate-400 hover:text-slate-100 border border-slate-800/60 transition-all"
                      >
                        {copiedId === ticket.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy suggested reply</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
