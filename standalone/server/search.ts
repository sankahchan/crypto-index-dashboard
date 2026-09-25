/**
 * Standalone `tool.web_search` implementation.
 *
 * Pluggable via environment:
 *   SEARCH_PROVIDER=tavily|brave
 *   SEARCH_API_KEY=<key>
 *
 * Returns `[]` when no provider/key is configured (or when the provider
 * fails). Callers in `server/src/actions.ts` already degrade honestly on
 * empty results — news sections fall back to unclassified/empty states
 * instead of crashing.
 */

import type { WebSearchItem, WebSearchResponse } from "./space-sdk-shim.js";

export interface SearchOptions {
  language_code?: string;
  timeout_secs?: number;
}

function hostnameOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string | null;
}

async function tavilySearch(query: string, apiKey: string, timeoutMs: number): Promise<WebSearchItem[]> {
  const res = await fetchWithTimeout(
    "https://api.tavily.com/search",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 8,
        include_answer: false,
      }),
    },
    timeoutMs,
  );
  if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`);
  const body = (await res.json()) as { results?: TavilyResult[] };
  return (body.results ?? []).map((r) => ({
    title: r.title ?? "",
    snippet: r.content ? r.content.slice(0, 600) : null,
    source: hostnameOf(r.url),
    url: r.url ?? null,
    published_at: r.published_date ?? null,
  }));
}

interface BraveResult {
  title?: string;
  url?: string;
  description?: string;
  page_age?: string | null;
}

async function braveSearch(query: string, apiKey: string, timeoutMs: number): Promise<WebSearchItem[]> {
  const res = await fetchWithTimeout(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8`,
    { headers: { "X-Subscription-Token": apiKey, Accept: "application/json" } },
    timeoutMs,
  );
  if (!res.ok) throw new Error(`Brave HTTP ${res.status}`);
  const body = (await res.json()) as { web?: { results?: BraveResult[] } };
  return (body.web?.results ?? []).map((r) => ({
    title: r.title ?? "",
    snippet: r.description ?? null,
    source: hostnameOf(r.url),
    url: r.url ?? null,
    published_at: r.page_age ?? null,
  }));
}

export async function webSearch(query: string, opts: SearchOptions = {}): Promise<WebSearchResponse> {
  const provider = (process.env.SEARCH_PROVIDER ?? "").trim().toLowerCase();
  const apiKey = (process.env.SEARCH_API_KEY ?? "").trim();
  if (!provider || !apiKey) return { content: { results: [] } };
  const timeoutMs = Math.max(5_000, (opts.timeout_secs ?? 45) * 1_000);
  try {
    if (provider === "tavily") return { content: { results: await tavilySearch(query, apiKey, timeoutMs) } };
    if (provider === "brave") return { content: { results: await braveSearch(query, apiKey, timeoutMs) } };
    console.warn(`[search] unknown SEARCH_PROVIDER=${JSON.stringify(provider)}; returning no results`);
    return { content: { results: [] } };
  } catch (err) {
    console.warn(`[search] ${provider} failed: ${err instanceof Error ? err.message : String(err)}`);
    return { content: { results: [] } };
  }
}
