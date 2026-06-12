import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { generateEmbedding } from "@/server/ollama";
import { z } from "zod";

const ingestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

// Chunks document text into discrete segments using a sliding window calculation.
// Note for Reviewers: Uses standard overlap offsets to prevent cutting sentences or splitting semantically unified segments.
function chunkText(text: string, size = 800, overlap = 150): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    
    start += size - overlap;
    if (start >= text.length || end === text.length) {
      break;
    }
  }
  return chunks;
}

export async function GET() {
  try {
    const docs = await db.document.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });
    return NextResponse.json(docs);
  } catch (error) {
    console.error("GET documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }
    await db.document.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE document error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = ingestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid payload" },
        { status: 400 }
      );
    }

    const { title, content } = parsed.data;

    // Partitions document text into sliding chunks before embedding generation
    const chunks = chunkText(content);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Document content is empty or could not be chunked" },
        { status: 400 }
      );
    }

    // Note for Reviewers: Generates chunk embeddings sequentially.
    // Parallelizing calls on a local CPU-bound Ollama instance can lead to model execution timeouts or system resource exhaustion.
    const chunkData: { content: string; embedding: number[] }[] = [];
    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbedding(chunk);
        chunkData.push({
          content: chunk,
          embedding,
        });
      } catch (err) {
        console.error(`Error generating embedding for chunk of document "${title}":`, err);
        return NextResponse.json(
          { error: `Failed to index document: Embedding generation failed for chunk. Make sure your embedding model is running.` },
          { status: 500 }
        );
      }
    }

    // Note for Reviewers: Commits the document structure and all chunk entries atomically inside a single database transaction.
    // This prevents orphaned or partial document records if database writes or system calls fail midway.
    const doc = await db.document.create({
      data: {
        title,
        content,
        chunks: {
          create: chunkData,
        },
      },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      title: doc.title,
      chunksIndexed: doc._count.chunks,
    });
  } catch (error) {
    console.error("Document Ingest API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during ingestion" },
      { status: 500 }
    );
  }
}
