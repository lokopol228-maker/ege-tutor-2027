import OpenAI from "openai";
import type { ModeId, SubjectKey } from "@/lib/subjects";
import { buildSystemPrompt } from "@/lib/tutor";
import { offlineTutorReply } from "@/lib/offline-tutor";

type ChatTurn = { role: "user" | "assistant"; content: string };

export type LlmProvider = "gemini" | "groq" | "openai" | "openrouter" | "offline";

type UserLlmPrefs = {
  apiKey?: string | null;
  provider?: string | null;
};

function resolveProvider(prefs?: UserLlmPrefs): {
  provider: LlmProvider;
  apiKey?: string;
} {
  const userKey = prefs?.apiKey?.trim();
  const userProvider = (prefs?.provider || "groq").toLowerCase();

  if (userKey) {
    if (userProvider === "openrouter") {
      return { provider: "openrouter", apiKey: userKey };
    }
    if (userProvider === "openai") {
      return { provider: "openai", apiKey: userKey };
    }
    return { provider: "groq", apiKey: userKey };
  }

  if (process.env.GROQ_API_KEY) {
    return { provider: "groq", apiKey: process.env.GROQ_API_KEY };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return { provider: "openrouter", apiKey: process.env.OPENROUTER_API_KEY };
  }
  if (process.env.GEMINI_API_KEY) {
    return { provider: "gemini", apiKey: process.env.GEMINI_API_KEY };
  }
  if (process.env.OPENAI_API_KEY) {
    return { provider: "openai", apiKey: process.env.OPENAI_API_KEY };
  }

  return { provider: "offline" };
}

export async function generateTutorReply(params: {
  subject: SubjectKey;
  mode: ModeId;
  history: ChatTurn[];
  userLlm?: UserLlmPrefs;
}): Promise<{ text: string; provider: LlmProvider }> {
  const { provider, apiKey } = resolveProvider(params.userLlm);
  const system = buildSystemPrompt(params.subject, params.mode);

  if (provider === "gemini" && apiKey) {
    const text = await callGemini(system, params.history, apiKey);
    return { text, provider };
  }

  if (provider === "groq" && apiKey) {
    const text = await callOpenAICompatible({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      system,
      history: params.history,
    });
    return { text, provider };
  }

  if (provider === "openrouter" && apiKey) {
    const text = await callOpenAICompatible({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
      system,
      history: params.history,
    });
    return { text, provider };
  }

  if (provider === "openai" && apiKey) {
    const text = await callOpenAICompatible({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      system,
      history: params.history,
    });
    return { text, provider };
  }

  return {
    text: offlineTutorReply({
      subject: params.subject,
      mode: params.mode,
      history: params.history,
    }),
    provider: "offline",
  };
}

async function callGemini(
  system: string,
  history: ChatTurn[],
  apiKey: string,
): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = history.map((item) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }],
  }));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents:
        contents.length > 0
          ? contents
          : [{ role: "user", parts: [{ text: "Начни занятие с диагностики." }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  return text || "Повтори ответ чуть подробнее — проверю ещё раз.";
}

async function callOpenAICompatible(params: {
  apiKey: string;
  baseURL?: string;
  model: string;
  system: string;
  history: ChatTurn[];
}): Promise<string> {
  const client = new OpenAI({
    apiKey: params.apiKey,
    baseURL: params.baseURL,
  });

  const completion = await client.chat.completions.create({
    model: params.model,
    temperature: 0.4,
    messages: [
      { role: "system", content: params.system },
      ...params.history.map((item) => ({
        role: item.role,
        content: item.content,
      })),
    ],
  });

  return (
    completion.choices[0]?.message?.content?.trim() ||
    "Давай ещё раз: напиши, на каком шаге застрял."
  );
}
