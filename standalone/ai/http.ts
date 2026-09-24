/**
 * Small shared helpers for the provider implementations.
 * No external dependencies: uses only the global `fetch`.
 */

export const SYSTEM_PROMPT =
  "You are a precise data-extraction and briefing assistant for a crypto market dashboard. " +
  "Return ONLY a single valid JSON object matching the provided JSON Schema. " +
  "No markdown fences, no commentary, no extra text.";

export function withSchemaInstruction(prompt: string, jsonSchema: Record<string, unknown>): string {
  return (
    `${prompt}\n\n` +
    `Return ONLY a single valid JSON object matching this JSON Schema ` +
    `(no markdown fences, no extra text):\n${JSON.stringify(jsonSchema)}`
  );
}

/** Parse model output that should be a JSON object; tolerates markdown fences. */
export function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error(`Model did not return valid JSON. Output preview: ${cleaned.slice(0, 200)}`);
  }
}

export interface HttpError extends Error {
  status?: number;
}

/** POST JSON with a timeout; throws a descriptive error on non-2xx responses. */
export async function postJson(
  provider: string,
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number,
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new Error(`${provider}: request failed (${error instanceof Error ? error.message : String(error)})`);
  }
  if (!res.ok) {
    const snippet = (await res.text().catch(() => "")).slice(0, 300);
    const err = new Error(`${provider}: HTTP ${res.status} ${res.statusText}${snippet ? ` — ${snippet}` : ""}`) as HttpError;
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<unknown>;
}

/** Join Gemini/Anthropic-style content parts into plain text. */
export function joinParts(parts: Array<{ text?: string } | string> | undefined): string {
  if (!parts) return "";
  return parts
    .map((p) => (typeof p === "string" ? p : p.text ?? ""))
    .join("")
    .trim();
}
