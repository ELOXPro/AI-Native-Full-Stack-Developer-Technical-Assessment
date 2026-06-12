// Generates text embeddings. Tries legacy '/api/embeddings' first, falling back to '/api/embed'.
// Different versions of Ollama use different endpoints and parameter structures (e.g. 'prompt' vs 'input').
export async function generateEmbedding(text: string): Promise<number[]> {
  const url = process.env.OLLAMA_URL ?? "http://localhost:11434";
  const model = process.env.EMBEDDING_MODEL ?? "nomic-embed-text";

  try {
    const response = await fetch(`${url}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: text }),
    });
    if (response.ok) {
      const data = (await response.json()) as { embedding: number[] };
      if (data.embedding && Array.isArray(data.embedding)) {
        return data.embedding;
      }
    }
  } catch (e) {
    console.warn("Failed /api/embeddings, falling back to /api/embed...", e);
  }

  // Fallback to the modern /api/embed interface if the legacy endpoint fails
  const response = await fetch(`${url}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: text }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding failed with status ${response.status}`);
  }

  const data = (await response.json()) as { embedding?: number[]; embeddings?: number[][] };
  const embedding = data.embedding ?? data.embeddings?.[0];

  if (!embedding) {
    throw new Error("No embedding returned from Ollama API");
  }

  return embedding;
}

// Requests a text completion from Ollama. Supports custom system prompts and JSON schema constraint formatting.
export async function generateCompletion(
  prompt: string,
  systemPrompt?: string,
  forceJson = false
): Promise<string> {
  const url = process.env.OLLAMA_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "qwen2.5:3b";

  const body: Record<string, string | boolean | undefined> = {
    model,
    prompt,
    stream: false,
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  if (forceJson) {
    body.format = "json";
  }

  const response = await fetch(`${url}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Ollama completion failed with status ${response.status}`);
  }

  const data = (await response.json()) as { response: string };
  return data.response;
}

// Connects to local tags registry and verifies if configured models are downloaded.
// Robustly matches model sub-tags (e.g., 'qwen2.5:3b' matching 'qwen2.5:3b:latest').
export async function checkOllamaStatus(): Promise<{ llm: boolean; embedding: boolean }> {
  const url = process.env.OLLAMA_URL ?? "http://localhost:11434";
  const llmModel = process.env.OLLAMA_MODEL ?? "qwen2.5:3b";
  const embedModel = process.env.EMBEDDING_MODEL ?? "nomic-embed-text";

  try {
    const response = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return { llm: false, embedding: false };
    
    const data = (await response.json()) as { models?: { name: string }[] };
    const models = data.models?.map((m) => m.name.toLowerCase()) ?? [];

    const hasModel = (target: string) => {
      const normalized = target.toLowerCase();
      return models.some(
        (m) =>
          m === normalized ||
          m.startsWith(normalized + ":") ||
          normalized.startsWith(m + ":")
      );
    };

    return {
      llm: hasModel(llmModel),
      embedding: hasModel(embedModel),
    };
  } catch (e) {
    console.error("Failed to connect to Ollama for status check:", e);
    return { llm: false, embedding: false };
  }
}
