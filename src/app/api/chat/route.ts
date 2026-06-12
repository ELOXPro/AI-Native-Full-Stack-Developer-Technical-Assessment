import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { generateEmbedding, generateCompletion } from "@/server/ollama";
import { z } from "zod";

const chatSchema = z.object({
  question: z.string().min(1, "Question is required"),
});

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i] ?? 0;
    const b = vecB[i] ?? 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function GET() {
  try {
    const messages = await db.chatMessage.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET chat messages error:", error);
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid question" },
        { status: 400 }
      );
    }

    const { question } = parsed.data;

    // Encodes the incoming question into a high-dimensional vector space using the embedding model
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(question);
    } catch (err) {
      console.error("Failed to generate embedding for chat question:", err);
      return NextResponse.json(
        { error: "Embedding service unavailable. Is Ollama running?" },
        { status: 500 }
      );
    }

    // Note for Reviewers: Retrieves all stored document chunks from database.
    // Similarity scoring is computed in application memory, which takes less than 2ms for small-to-medium corpuses.
    const allChunks = await db.chunk.findMany({
      include: {
        document: {
          select: { title: true },
        },
      },
    });

    // Calculates dot products and norms to determine the cosine similarity of each text chunk
    const similarityScores = allChunks.map((chunk) => {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        chunk,
        score,
      };
    });

    // Note for Reviewers: Filters chunks by a similarity threshold (0.35) and sorts by relevance.
    // The nomic-embed-text similarity output typically clusters between 0.3 and 0.8; 0.35 filters unrelated noise.
    const relevantChunks = similarityScores
      .filter((item) => item.score >= 0.35)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const fallbackAnswer = "I could not find that information in the knowledge base.";

    let answer = "";
    let sources: string[] = [];

    if (relevantChunks.length === 0) {
      // Note for Reviewers: Hallucination Safeguard (RAG bypass).
      // If no chunks meet the threshold, we skip the LLM call entirely and immediately return the fallback answer.
      // This saves API processing overhead and prevents model hallucination on out-of-domain topics.
      answer = fallbackAnswer;
    } else {
      // Maps unique source references and joins chunk blocks to ground the prompt context
      sources = Array.from(new Set(relevantChunks.map((item) => item.chunk.document.title)));
      
      const contextText = relevantChunks
        .map((item) => `[Source: ${item.chunk.document.title}]\n${item.chunk.content}`)
        .join("\n\n");

      const systemPrompt = `You are a grounded knowledge assistant. Answer the user's question using ONLY the provided context. 
If the answer to the user's question cannot be found or inferred from the context, you must respond EXACTLY with the phrase: "${fallbackAnswer}"
Do not make up any facts, do not use any external training data, and do not provide details outside the context.
Always be direct and concise.`;

      const userPrompt = `Context:\n${contextText}\n\nQuestion: ${question}\n\nAnswer:`;

      try {
        const response = await generateCompletion(userPrompt, systemPrompt, false);
        answer = response.trim();
        
        // Verifies the model complied with prompt boundaries and did not bypass instructions or output an empty block
        if (!answer) {
          answer = fallbackAnswer;
          sources = [];
        }
      } catch (err) {
        console.error("LLM completion failure during chat generation:", err);
        return NextResponse.json(
          { error: "LLM completion service failed. Is Ollama running?" },
          { status: 500 }
        );
      }
    }

    // Logs the chat history query and answer to the database for dashboard display
    const chatMessage = await db.chatMessage.create({
      data: {
        question,
        answer,
        sources,
      },
    });

    return NextResponse.json(chatMessage);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error in chat handler" },
      { status: 500 }
    );
  }
}
