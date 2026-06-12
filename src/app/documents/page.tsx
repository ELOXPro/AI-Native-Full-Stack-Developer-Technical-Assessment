"use client";

// Client interface for managing, uploading, and deleting documents.
// Supported files (.txt/.md) are read locally via FileReader and indexed sequentially in the backend.
import { useEffect, useState } from "react";
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Calendar,
  Layers,
  FileCheck,
} from "lucide-react";

interface IndexedDocument {
  id: string;
  title: string;
  createdAt: string;
  _count: {
    chunks: number;
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<IndexedDocument[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Tracks active dragover hover states on the upload drop box component
  const [dragActive, setDragActive] = useState(false);

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/ingest");
      if (res.ok) {
        const data = (await res.json()) as IndexedDocument[];
        setDocuments(data);
      }
    } catch (e) {
      console.error("Failed to load documents:", e);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    void fetchDocuments();
  }, []);

  const handleIngest = async (title: string, content: string) => {
    setUploading(true);
    setUploadStatus(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = (await res.json()) as { error?: string; chunksIndexed?: number };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to ingest document");
      }
      setUploadStatus({
        type: "success",
        msg: `"${title}" has been split into ${data.chunksIndexed ?? 0} chunks and successfully indexed!`,
      });
      void fetchDocuments();
    } catch (err) {
      console.error("Ingestion failed:", err);
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred during ingestion.";
      setUploadStatus({
        type: "error",
        msg: errMsg,
      });
    } finally {
      setUploading(false);
    }
  };

  const processFile = (file: File) => {
    const isTxt = file.name.endsWith(".txt");
    const isMd = file.name.endsWith(".md");
    if (!isTxt && !isMd) {
      setUploadStatus({
        type: "error",
        msg: "Only .txt and .md files are supported for semantic indexing.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text.trim()) {
        setUploadStatus({
          type: "error",
          msg: `The file "${file.name}" appears to be empty.`,
        });
        return;
      }
      void handleIngest(file.name, text);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete and un-index "${title}"? This action is permanent.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ingest?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete document");
      }
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      setUploadStatus({
        type: "success",
        msg: `"${title}" has been completely un-indexed and deleted.`,
      });
    } catch (err) {
      console.error(err);
      alert("Error deleting document.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 md:text-4xl">Document Management</h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload and structure textual records. The system parses them, generates vector embeddings, and links chunks into the Knowledge Assistant.
        </p>
      </div>


      <div className="grid gap-8 lg:grid-cols-5 items-start">

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-200">
              <Upload className="h-5 w-5 text-emerald-400" />
              <span>Ingest Knowledge Base</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Select or drop text documents to perform chunk indexing.
            </p>


            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`mt-4 relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-emerald-400 bg-emerald-500/5"
                  : "border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/20"
              }`}
            >
              <input
                type="file"
                id="file-upload"
                accept=".txt,.md"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                {uploading ? (
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
                ) : (
                  <FileText className="h-10 w-10 text-slate-600 group-hover:text-slate-400 transition-colors" />
                )}
                <span className="mt-4 text-xs font-semibold text-slate-300">
                  {uploading ? "Ingesting..." : "Drag files here or click to upload"}
                </span>
                <span className="mt-1 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                  Supported formats: .txt, .md
                </span>
              </label>
            </div>


            {uploadStatus && (
              <div
                className={`mt-4 rounded-lg p-3.5 border flex items-start gap-2.5 text-xs ${
                  uploadStatus.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}
              >
                {uploadStatus.type === "success" ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-400 flex-shrink-0" />
                )}
                <span className="leading-relaxed font-sans">{uploadStatus.msg}</span>
              </div>
            )}
          </div>
        </div>


        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-xl font-bold text-slate-200">Indexed Knowledge Repositories</h2>

          {loadingList ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-slate-800 bg-slate-900/10">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              <span className="mt-3 text-sm text-slate-400 font-medium">Loading indexed records...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/10 py-16 text-center">
              <FolderOpen className="h-12 w-12 text-slate-700 mb-2" />
              <h3 className="text-sm font-semibold text-slate-300">No Knowledge Bases Found</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
                Ingest document guidelines to provide dynamic information for your grounded knowledge assistant.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 flex items-center justify-between shadow-sm hover:border-slate-750 transition-all group"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/20 p-2.5 text-emerald-400 flex-shrink-0">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-200 truncate group-hover:text-slate-100 transition-colors">
                        {doc.title}
                      </h4>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-sans">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          {doc._count.chunks} chunks indexed
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => void handleDelete(doc.id, doc.title)}
                    disabled={deletingId === doc.id}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-slate-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition-all disabled:opacity-50"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
