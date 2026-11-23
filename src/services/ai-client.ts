import 'server-only';

export type AIModelMode = 'testing' | 'judging';

export interface GeminiContentPart {
  text: string;
}

export interface GeminiContentMessage {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
}

export interface GeminiPayload {
  contents: GeminiContentMessage[];
  generationConfig?: {
    responseMimeType?: string;
    temperature?: number;
    maxOutputTokens?: number;
  };
}

/**
 * Low-end models prioritized during testing phase to conserve quotas and minimize latency.
 * High-end cascading models reserved for judging/evaluation phase.
 */
export const MODEL_CASCADES: Record<AIModelMode, string[]> = {
  testing: [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
  ],
  judging: [
    'gemini-3.1-pro-preview',
    'gemini-pro-latest',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest',
  ],
};

/**
 * Returns the active model mode ('testing' by default; switchable to 'judging').
 */
export function getActiveModelMode(): AIModelMode {
  const mode = process.env.GEMINI_MODEL_MODE?.trim().toLowerCase();
  if (mode === 'judging' || mode === 'judge' || mode === 'production') {
    return 'judging';
  }
  return 'testing';
}

/**
 * Returns the ordered list of models to attempt based on mode and overrides.
 */
export function getModelCascadeList(): string[] {
  const override = process.env.GEMINI_MODEL?.trim();
  const mode = getActiveModelMode();
  const defaultList = MODEL_CASCADES[mode] ?? MODEL_CASCADES.testing;

  if (override) {
    return [override, ...defaultList.filter((m) => m !== override)];
  }

  return defaultList;
}

/**
 * Executes a Gemini request with automatic cascading across models in case of
 * capacity limits (503), deprecation (404), or rate limits (429).
 */
export async function callGeminiWithCascade(
  payload: GeminiPayload,
): Promise<{ text: string; modelUsed: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const models = getModelCascadeList();

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn(`[AI Client] Model '${model}' returned status ${res.status}. Cascading to next model.`);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return { text, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`[AI Client] Error calling model '${model}':`, err?.message ?? err);
      continue;
    }
  }

  return null;
}
