const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

export type GeminiResponse = {
  text: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
};

export async function geminiGenerate(input: { systemPrompt: string; userPrompt: string; responseMimeType?: string }): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: input.userPrompt }] }],
      systemInstruction: { parts: [{ text: input.systemPrompt }] },
      generationConfig: {
        responseMimeType: input.responseMimeType || "text/plain",
        temperature: 0.35,
        maxOutputTokens: 2048,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${details.slice(0, 500)}`);
  }

  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n") || "";

  return {
    text,
    model: "gemini-2.5-flash-lite",
    usage: {
      inputTokens: payload.usageMetadata?.promptTokenCount || 0,
      outputTokens: payload.usageMetadata?.candidatesTokenCount || 0,
    },
  };
}
