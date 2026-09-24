# Standalone AI adapter (multi-provider with fallback)

Server-only TypeScript adapter for the standalone deployment. It mirrors the
`ctx.inference.complete(prompt, { schema })` calls used by the Muse-hosted
artifact (news classification, calendar/token-unlock extraction, daily Market
Update, weekly digest) and adds **automatic fallback across providers**.

Supported providers, tried in the order you configure:

| Name | Env keys | Default model |
|---|---|---|
| `gemini` | `GEMINI_API_KEY`, `GEMINI_MODEL` | `gemini-2.5-flash` |
| `openai` | `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL` | `gpt-4o-mini` |
| `anthropic` | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | `claude-sonnet-4-5` |
| `deepseek` | `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `DEEPSEEK_BASE_URL` | `deepseek-chat` |

Priority is set with a comma-separated list:

```bash
AI_PROVIDERS=gemini,openai,anthropic,deepseek
AI_TIMEOUT_MS=60000
```

Only providers with an API key set are attempted. If Gemini fails (quota,
network, bad key, empty response), the adapter automatically tries OpenAI, then
Anthropic, then DeepSeek, and throws an aggregated error only when all fail.

## Usage

```ts
import { createAIClient } from "./standalone/ai/index.js";
import { zodToJsonSchema } from "zod-to-json-schema"; // one small dev dependency

const ai = createAIClient(process.env);

// Mirrors: ctx.inference.complete(prompt, { schema: dailyUpdateContentSchema })
const raw = await ai.complete(prompt, zodToJsonSchema(dailyUpdateContentSchema));
const content = dailyUpdateContentSchema.parse(raw); // keep the existing zod validation
```

The four call sites to port in `server/src/actions.ts` are the
`ctx.inference.complete(...)` calls for:

1. news classification (`newsClassificationSchema`)
2. economic/token-unlock extraction (`researchExtractionSchema`)
3. daily Market Update (`dailyUpdateContentSchema`)
4. weekly digest (`weeklyDigestContentSchema`)

Each already wraps its call in `try/catch` with a degraded fallback, so a
total AI outage degrades gracefully instead of breaking the dashboard.

## Notes

- No SDK dependencies: every provider uses plain `fetch`, so this runs on
  Node 18+, Bun, Vercel/Cloudflare serverless, or Fly.io/Render.
- `OPENAI_BASE_URL` / `DEEPSEEK_BASE_URL` let you point at any OpenAI-compatible
  endpoint (proxies, gateways, local models).
- Never import these modules from client code and never commit real keys.
  Keys live in the deployment platform's secret storage, never in the repo.
