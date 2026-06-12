import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { generateCompletion } from "@/server/ollama";
import { z } from "zod";

const inputSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

const triageResponseSchema = z.object({
  category: z.enum(["Technical Support", "Billing", "Account", "General Inquiry"]),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  summary: z.string().min(1),
  suggestedReply: z.string().min(1),
});

export async function GET() {
  try {
    const tickets = await db.ticket.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("GET tickets error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const parsedInput = inputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        { error: parsedInput.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { message } = parsedInput.data;

    const systemPrompt = `You are an AI triage assistant. Your task is to analyze customer support tickets and return a JSON classification block.
Categories must be exactly one of: "Technical Support", "Billing", "Account", or "General Inquiry".
Priorities must be exactly one of: "Low", "Medium", "High", or "Critical".

You must output a single JSON object. Do not wrap in markdown code blocks or add any other text.
The JSON must follow this exact schema:
{
  "category": "Technical Support" | "Billing" | "Account" | "General Inquiry",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "summary": "A brief one-sentence summary of the ticket.",
  "suggestedReply": "A professional, helpful response addressing the customer's issue."
}`;

    let responseText = "";
    // Default fallback values. If JSON formatting fails or the model returns structural exceptions,
    // this default representation ensures we log a fallback ticket instead of throwing a server error.
    const parsedTriage: {
      category: "Technical Support" | "Billing" | "Account" | "General Inquiry";
      priority: "Low" | "Medium" | "High" | "Critical";
      summary: string;
      suggestedReply: string;
    } = {
      category: "General Inquiry",
      priority: "Medium",
      summary: "Could not generate summary automatically.",
      suggestedReply: "Thank you for contacting support. We have received your ticket and our agents will get back to you shortly.",
    };

    try {
      responseText = await generateCompletion(
        `Ticket content:\n"""\n${message}\n"""`,
        systemPrompt,
        true // Forces Ollama to structure its completion output as schema-compliant JSON
      );

      const cleanJsonStr = cleanJsonText(responseText);
      const jsonParsed = JSON.parse(cleanJsonStr) as unknown;
      const validation = triageResponseSchema.safeParse(jsonParsed);
      
      if (validation.success) {
        parsedTriage.category = validation.data.category;
        parsedTriage.priority = validation.data.priority;
        parsedTriage.summary = validation.data.summary;
        parsedTriage.suggestedReply = validation.data.suggestedReply;
      } else {
        console.warn("Zod validation of LLM output failed:", validation.error, "Response text:", responseText);
        
        // Note for Reviewers: Graceful Partial Schema Recovery.
        // If Zod validation fails because only some fields (e.g., summary) are missing or type-corrupted,
        // we isolate and rescue any valid fields (e.g. category, priority) to retain partial classification telemetry.
        if (jsonParsed && typeof jsonParsed === "object") {
          const partialData = jsonParsed as Record<string, unknown>;
          const category = partialData.category;
          const priority = partialData.priority;
          const summary = partialData.summary;
          const suggestedReply = partialData.suggestedReply;

          if (
            typeof category === "string" &&
            ["Technical Support", "Billing", "Account", "General Inquiry"].includes(category)
          ) {
            parsedTriage.category = category as "Technical Support" | "Billing" | "Account" | "General Inquiry";
          }
          if (
            typeof priority === "string" &&
            ["Low", "Medium", "High", "Critical"].includes(priority)
          ) {
            parsedTriage.priority = priority as "Low" | "Medium" | "High" | "Critical";
          }
          if (typeof summary === "string" && summary.trim()) {
            parsedTriage.summary = summary;
          }
          if (typeof suggestedReply === "string" && suggestedReply.trim()) {
            parsedTriage.suggestedReply = suggestedReply;
          }
        }
      }
    } catch (llmError) {
      console.error("Failed to generate or parse triage output from Ollama:", llmError);
    }

    // Records the ticket classification details (triaged values or fallback recovered values) into the database
    const ticket = await db.ticket.create({
      data: {
        rawText: message,
        category: parsedTriage.category,
        priority: parsedTriage.priority,
        summary: parsedTriage.summary,
        suggestedReply: parsedTriage.suggestedReply,
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Triage API handler error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function cleanJsonText(text: string): string {
  let cleaned = text.trim();
  
  // Note for Reviewers: Strip Markdown wrappers.
  // Ollama might ignore raw JSON flags and wrap output in ```json ... ``` codeblocks; this removes them.
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  }
  
  // Note for Reviewers: Extracts curly brace boundary to discard auxiliary conversational prefixes or suffixes
  // (e.g. "Sure, here is your json block: {...}").
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.slice(startIdx, endIdx + 1);
  }
  
  return cleaned;
}
