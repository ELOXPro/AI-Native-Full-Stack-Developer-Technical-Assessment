"use client";

// Grounded Knowledge RAG user interface. Allows querying vector-indexed sources with citations highlights.
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Brain,
  Send,
  Loader2,
  FileText,
  Bookmark,
  Info,
  Clock,
  ArrowRight,
} from "lucide-react";

const formSchema = z.object({
  question: z.string().min(2, "Question must be at least 2 characters long."),
});

type FormInput = z.infer<typeof formSchema>;

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  createdAt: string;
}

export default function KnowledgePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
  });

  async function fetchHistory() {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = (await res.json()) as ChatMessage[];
        setMessages(data);
        if (data.length > 0) {
          setSelectedMessage(data[data.length - 1] ?? null);
        }
      }
    } catch (e) {
      console.error("Failed to fetch chat history:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const onSubmit = async (data: FormInput) => {
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: data.question }),
      });
      if (!res.ok) {
        throw new Error("Chat query failed");
      }
      const newMsg = (await res.json()) as ChatMessage;
      setMessages((prev) => [...prev, newMsg]);
      setSelectedMessage(newMsg);
      reset();
    } catch (e) {
      console.error(e);
      alert("Failed to submit question. Please verify your local Ollama connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] space-y-4">

      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Grounded Knowledge Assistant</h1>
        <p className="mt-1 text-sm text-slate-400">
          Ask questions against indexed files. The AI agent will answer using only retrieved document chunks.
        </p>
      </div>


      <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">

        <div className="flex-grow flex flex-col rounded-xl border border-slate-800 bg-slate-900/10 min-h-0">

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                <span className="text-sm text-slate-500 font-medium">Restoring conversation logs...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4">
                <div className="rounded-full bg-slate-900 p-4 text-emerald-400/80 shadow-md">
                  <Brain className="h-8 w-8 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-300">Awaiting Inquiries</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    No query history found. Start by entering a question below. The AI assistant will perform a semantic vector search and resolve your request.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-4">

                    <div className="flex items-start justify-end gap-3">
                      <div className="bg-emerald-600/90 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[85%] shadow-sm leading-relaxed">
                        {msg.question}
                      </div>
                    </div>


                    <div
                      onClick={() => setSelectedMessage(msg)}
                      className={`flex items-start gap-3 cursor-pointer group rounded-xl p-3 border transition-all ${
                        selectedMessage?.id === msg.id
                          ? "bg-slate-900/80 border-slate-750 shadow-md"
                          : "bg-slate-900/20 border-transparent hover:bg-slate-900/40"
                      }`}
                    >
                      <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 flex-shrink-0">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="text-sm text-slate-200 leading-relaxed font-sans prose prose-invert">
                          {msg.answer}
                        </div>
                        {msg.sources.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Citations:</span>
                            {msg.sources.map((src, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400"
                              >
                                <FileText className="h-2.5 w-2.5" />
                                {src}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {new Date(msg.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            

            {sending && (
              <div className="flex items-start gap-3 rounded-xl p-3 bg-slate-900/20 border border-transparent">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 flex-shrink-0 animate-pulse">
                  <Brain className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1 space-y-2.5">
                  <div className="flex gap-1.5 items-center">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" />
                  </div>
                  <div className="text-xs text-slate-500">Retrieving chunks and composing reply...</div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>


          <div className="border-t border-slate-800 p-4 bg-slate-950/40">
            <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask a question (e.g. 'What are our corporate billing terms?')"
                className={`flex-1 rounded-lg border bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                  errors.question ? "border-rose-500" : "border-slate-800"
                }`}
                {...register("question")}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending}
                className="flex items-center justify-center rounded-lg bg-emerald-600 px-4 text-white hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
              </button>
            </form>
            {errors.question && (
              <p className="mt-1.5 text-xs text-rose-400 font-sans flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                {errors.question.message}
              </p>
            )}
          </div>
        </div>


        <div className="w-full md:w-80 flex-shrink-0 flex flex-col rounded-xl border border-slate-800 bg-slate-900/30 p-5 min-h-0">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-200 border-b border-slate-800 pb-3">
            <Bookmark className="h-4.5 w-4.5 text-emerald-400" />
            <span>Grounded Source Citations</span>
          </h2>
          
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
            {selectedMessage ? (
              selectedMessage.sources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
                  <Info className="h-7 w-7 text-slate-600 mb-2" />
                  <p className="text-xs">No document sources referenced.</p>
                  <p className="text-[10px] mt-1 text-slate-600 max-w-[200px]">
                    This query was resolved using general defaults or context was insufficient.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    The active answer was formulated using text blocks extracted from the following files:
                  </p>
                  <div className="space-y-2">
                    {selectedMessage.sources.map((src, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-700 transition-all flex items-start gap-2.5 group"
                      >
                        <FileText className="h-4 w-4 text-emerald-400 mt-0.5" />
                        <div className="min-w-0 flex-grow">
                          <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-slate-100 transition-colors">
                            {src}
                          </h4>
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1 block">
                            Knowledge File
                          </span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-emerald-400 transition-colors self-center flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-600">
                <Bookmark className="h-8 w-8 mb-2 text-slate-700" />
                <p className="text-xs">Select any response to view vector search grounding sources.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
