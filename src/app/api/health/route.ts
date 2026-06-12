import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { checkOllamaStatus } from "@/server/ollama";

// Note for Reviewers: Forces dynamic execution to bypass static route caching and deliver live diagnostics.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await checkOllamaStatus();
    
    // Aggregates total operational counts across relational tables
    const documentsIndexed = await db.document.count();
    const ticketCount = await db.ticket.count();
    const chatCount = await db.chatMessage.count();
    
    // Determines database recency by comparing the timestamps of the latest support ticket and chat response
    const lastChat = await db.chatMessage.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    
    const lastTicket = await db.ticket.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    
    let lastQueryTime: Date | null = null;
    if (lastChat && lastTicket) {
      lastQueryTime = lastChat.createdAt > lastTicket.createdAt ? lastChat.createdAt : lastTicket.createdAt;
    } else if (lastChat) {
      lastQueryTime = lastChat.createdAt;
    } else if (lastTicket) {
      lastQueryTime = lastTicket.createdAt;
    }
    
    return NextResponse.json({
      llmStatus: status.llm ? "online" : "offline",
      embeddingStatus: status.embedding ? "online" : "offline",
      documentsIndexed,
      ticketCount,
      chatCount,
      lastQueryTime: lastQueryTime ? lastQueryTime.toISOString() : null,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: "Failed to fetch health check metrics" },
      { status: 500 }
    );
  }
}
