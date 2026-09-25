import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { desc, eq, inArray } from "drizzle-orm";
import * as schema from "./schema";

const coinTierSchema = z.enum(["large", "mid", "low"]);

const quoteSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  tier: coinTierSchema,
  price: z.number(),
  changePct: z.number(),
  high: z.number(),
  low: z.number(),
  volume: z.number(),
  currency: z.string(),
});

const historyPointSchema = z.object({
  date: z.string(),
  score: z.number().int(),
  fearGreed: z.number().int(),
  btcMomentum: z.number(),
  btcPrice: z.number(),
  newsScore: z.number().int().nullable(),
});

const newsItemSchema = z.object({
  headline: z.string(),
  source: z.string(),
  url: z.string().nullable(),
  publishedAt: z.string().nullable(),
  sentiment: z.enum(["positive", "neutral", "negative", "unclassified"]),
  summaryMm: z.string().nullable(),
  summaryEn: z.string(),
});

const whaleSchema = z.object({
  hash: z.string(),
  btc: z.number(),
  time: z.string(),
});

const derivativeSchema = z.object({
  symbol: z.string(),
  markPrice: z.number(),
  fundingRate: z.number(),
  nextFundingTime: z.string(),
  openInterestUnits: z.number(),
  openInterestUsd: z.number(),
  source: z.string(),
});

const etfFlowSchema = z.object({
  date: z.string(),
  asset: z.enum(["BTC", "ETH"]),
  netFlowUsd: z.number(),
  source: z.string(),
  url: z.string(),
});

const liquidationLevelSchema = z.object({
  priceUsd: z.number().positive(),
  side: z.enum(["long_below", "short_above"]),
  magnitudeUsd: z.number().positive(),
  timeframe: z.string(),
  source: z.string(),
  url: z.string(),
});

const onChainSchema = z.object({
  mvrv: z.number().nullable(),
  exchangeInflowBtc: z.number().nullable(),
  exchangeOutflowBtc: z.number().nullable(),
  exchangeNetflowBtc: z.number().nullable(),
  activeAddresses: z.number().nullable(),
  transactions: z.number().nullable(),
  asOf: z.string(),
  source: z.string(),
});

const calendarItemSchema = z.object({
  title: z.string(),
  date: z.string(),
  importance: z.enum(["high", "medium"]),
  whyItMattersMm: z.string(),
  whyItMattersEn: z.string(),
  source: z.string(),
  url: z.string(),
});

const unlockItemSchema = z.object({
  token: z.string(),
  date: z.string(),
  amount: z.string(),
  noteMm: z.string(),
  noteEn: z.string(),
  source: z.string(),
  url: z.string(),
});

const dashboardSchema = z.object({
  fetchedAt: z.string(),
  sourceTime: z.string(),
  score: z.number().int(),
  sentiment: z.string(),
  fearGreed: z.object({
    value: z.number().int(),
    classification: z.string(),
  }),
  momentumScore: z.number().int(),
  btcChangePct: z.number(),
  quotes: z.array(quoteSchema),
  history: z.array(historyPointSchema),
  news: z.array(newsItemSchema),
  newsSentiment: z.object({
    positive: z.number().int(),
    neutral: z.number().int(),
    negative: z.number().int(),
    unclassified: z.number().int(),
    total: z.number().int(),
  }),
  newsScore: z.number().int().nullable(),
  whales: z.array(whaleSchema),
  whaleCoverage: z.array(newsItemSchema),
  whaleThresholdBtc: z.number(),
  derivatives: z.array(derivativeSchema),
  etfFlows: z.array(etfFlowSchema).default([]),
  liquidationLevels: z.array(liquidationLevelSchema).default([]),
  onChain: onChainSchema.nullable(),
  economicCalendar: z.array(calendarItemSchema),
  tokenUnlocks: z.array(unlockItemSchema),
  marketIntelligenceStatus: z.object({
    derivatives: z.enum(["ok", "unavailable"]),
    etfFlows: z.enum(["ok", "empty", "unavailable"]).optional(),
    liquidations: z.enum(["ok", "empty", "unavailable"]).optional(),
    economicCalendar: z.enum(["ok", "empty", "unavailable"]),
    tokenUnlocks: z.enum(["ok", "empty", "unavailable"]),
    refreshedAt: z.string(),
  }).optional(),
  configuredNewsSources: z.array(z.string()),
  sources: z.array(z.string()),
});

type Dashboard = z.infer<typeof dashboardSchema>;

const resultSchema = z.object({
  status: z.enum(["ok", "stale", "error"]),
  data: dashboardSchema.nullable(),
  message: z.string().nullable(),
  messageEn: z.string().nullable(),
});

type DashboardResult = z.infer<typeof resultSchema>;

const alertSchema = z.object({
  id: z.number().int(),
  symbol: z.string(),
  direction: z.enum(["above", "below"]),
  targetPrice: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
  triggeredAt: z.string().nullable(),
  triggeredPrice: z.number().nullable(),
});

const marketAlertEventSchema = z.object({
  id: z.number().int(),
  kind: z.enum(["extreme_fear", "extreme_greed"]),
  score: z.number().int(),
  fearGreed: z.number().int(),
  triggeredAt: z.string(),
});

const holdingSchema = z.object({
  id: z.number().int(),
  symbol: z.string(),
  assetName: z.string().nullable(),
  tier: coinTierSchema.nullable(),
  quantity: z.number(),
  averageCost: z.number().nullable(),
  manualPrice: z.number().nullable(),
  acquiredOn: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const tradingSignalEventSchema = z.object({
  id: z.number().int(),
  symbol: z.string(),
  previousVerdict: z.string(),
  newVerdict: z.string(),
  confidence: z.number().int(),
  triggeredAt: z.string(),
});

const settingsSchema = z.object({
  supportedCoins: z.array(z.object({ symbol: z.string(), name: z.string(), tier: coinTierSchema })),
  watchlist: z.array(z.string()),
  alerts: z.array(alertSchema),
  marketAlerts: z.object({ extremeFear: z.boolean(), extremeGreed: z.boolean() }),
  marketAlertEvents: z.array(marketAlertEventSchema),
  signalEvents: z.array(tradingSignalEventSchema),
  holdings: z.array(holdingSchema),
  notifications: z.object({ priceAlerts: z.boolean(), marketAlerts: z.boolean(), weeklyDigest: z.boolean(), signalAlerts: z.boolean() }),
});

type Settings = z.infer<typeof settingsSchema>;

const coinbaseStatsSchema = z.object({
  open: z.string(),
  high: z.string(),
  low: z.string(),
  last: z.string(),
  volume: z.string(),
});

const candleSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);

const fearGreedResponseSchema = z.object({
  name: z.string(),
  data: z.array(
    z.object({
      value: z.string(),
      value_classification: z.string(),
      timestamp: z.string(),
      time_until_update: z.string().optional(),
    }),
  ),
  metadata: z.object({ error: z.unknown().nullable() }),
});

const coinbaseTimeSchema = z.object({ iso: z.string(), epoch: z.number() });

const blockchainResponseSchema = z.object({
  txs: z.array(z.object({
    hash: z.string(),
    time: z.number(),
    out: z.array(z.object({ value: z.number() }).passthrough()),
  }).passthrough()),
});

const binancePremiumSchema = z.object({
  symbol: z.string(),
  markPrice: z.string(),
  lastFundingRate: z.string(),
  nextFundingTime: z.number(),
});

const binanceOpenInterestSchema = z.object({
  symbol: z.string(),
  openInterest: z.string(),
  time: z.number().optional(),
});

const okxFundingSchema = z.object({
  code: z.string(),
  data: z.array(z.object({ fundingRate: z.string(), fundingTime: z.string() })),
});

const okxOpenInterestSchema = z.object({
  code: z.string(),
  data: z.array(z.object({ oiUsd: z.string(), ts: z.string() })),
});

const okxTickerSchema = z.object({
  code: z.string(),
  data: z.array(z.object({ last: z.string(), ts: z.string() })),
});

const bybitTickerSchema = z.object({
  retCode: z.number(),
  result: z.object({
    list: z.array(z.object({
      symbol: z.string(),
      markPrice: z.string(),
      fundingRate: z.string(),
      nextFundingTime: z.string(),
      openInterest: z.string(),
      openInterestValue: z.string(),
    })),
  }),
});

const coinMetricsSchema = z.object({
  data: z.array(z.object({
    time: z.string(),
    CapMVRVCur: z.string().optional(),
    FlowInExNtv: z.string().optional(),
    FlowOutExNtv: z.string().optional(),
    AdrActCnt: z.string().optional(),
    TxCnt: z.string().optional(),
  }).passthrough()),
}).passthrough();

const economicExtractionSchema = z.object({
  events: z.array(z.object({
    resultIndex: z.number().int(),
    title: z.string(),
    date: z.string(),
    importance: z.enum(["high", "medium"]),
    whyItMattersMm: z.string(),
    whyItMattersEn: z.string(),
  })).max(6),
});

const unlockExtractionSchema = z.object({
  events: z.array(z.object({
    resultIndex: z.number().int(),
    token: z.string(),
    date: z.string(),
    amount: z.string(),
    noteMm: z.string(),
    noteEn: z.string(),
  })).max(6),
});

const newsClassificationSchema = z.object({
  items: z.array(z.object({
    rank: z.number().int(),
    sentiment: z.enum(["positive", "neutral", "negative"]),
    summaryMm: z.string(),
    summaryEn: z.string(),
  })).max(8),
});

const etfFlowExtractionSchema = z.object({
  rows: z.array(z.object({
    resultIndex: z.number().int(),
    date: z.string(),
    asset: z.enum(["BTC", "ETH"]),
    netFlowUsd: z.number(),
  })).max(12),
});

const liquidationExtractionSchema = z.object({
  levels: z.array(z.object({
    resultIndex: z.number().int(),
    priceUsd: z.number().positive(),
    side: z.enum(["long_below", "short_above"]),
    magnitudeUsd: z.number().positive(),
    timeframe: z.string(),
    publishedDate: z.string(),
  })).max(10),
});

const bilingualTextSchema = z.object({
  mm: z.string(),
  en: z.string(),
});

const dailyUpdateContentSchema = z.object({
  headline: bilingualTextSchema,
  deck: bilingualTextSchema,
  keyTakeaways: z.array(bilingualTextSchema).min(3).max(4),
  macroOutlook: z.array(z.object({
    label: bilingualTextSchema,
    title: bilingualTextSchema,
    body: bilingualTextSchema,
  })).min(2).max(3),
  bitcoinAnalysis: z.object({
    title: bilingualTextSchema,
    body: bilingualTextSchema,
  }),
  scenarios: z.array(z.object({
    name: bilingualTextSchema,
    trigger: bilingualTextSchema,
    posture: bilingualTextSchema,
  })).min(3).max(3),
  riskChecklist: z.array(bilingualTextSchema).min(3).max(5),
});

const dailyMarketUpdateSchema = dailyUpdateContentSchema.extend({
  generatedAt: z.string(),
  marketAsOf: z.string(),
  score: z.number().int(),
  sentiment: z.string(),
  btcPrice: z.number(),
  btcChangePct: z.number(),
  fearGreed: z.number().int(),
  newsScore: z.number().int().nullable(),
  referenceLevels: z.object({
    sevenDayLow: z.number(),
    thirtyDayLow: z.number(),
    thirtyDayHigh: z.number(),
  }),
  sources: z.array(z.object({
    title: z.string(),
    source: z.string(),
    url: z.string(),
    publishedAt: z.string().nullable(),
  })).max(8),
});

type DailyMarketUpdate = z.infer<typeof dailyMarketUpdateSchema>;

const dailyUpdateResultSchema = z.object({
  status: z.enum(["ok", "stale", "error"]),
  data: dailyMarketUpdateSchema.nullable(),
  message: z.string().nullable(),
  messageEn: z.string().nullable(),
});

type DailyUpdateResult = z.infer<typeof dailyUpdateResultSchema>;

const weeklyDigestContentSchema = z.object({
  headline: bilingualTextSchema,
  deck: bilingualTextSchema,
  weekInReview: z.array(bilingualTextSchema).min(3).max(5),
  marketStructure: bilingualTextSchema,
  nextWeek: z.array(bilingualTextSchema).min(2).max(5),
  riskNotes: z.array(bilingualTextSchema).min(3).max(5),
});

const weeklyMarketDigestSchema = weeklyDigestContentSchema.extend({
  generatedAt: z.string(),
  marketAsOf: z.string(),
  startScore: z.number().int(),
  endScore: z.number().int(),
  btcStartPrice: z.number(),
  btcEndPrice: z.number(),
  btcWeeklyChangePct: z.number(),
  sources: z.array(z.object({ title: z.string(), source: z.string(), url: z.string(), publishedAt: z.string().nullable() })).max(8),
});

type WeeklyMarketDigest = z.infer<typeof weeklyMarketDigestSchema>;

const weeklyDigestResultSchema = z.object({
  status: z.enum(["ok", "stale", "error"]),
  data: weeklyMarketDigestSchema.nullable(),
  message: z.string().nullable(),
  messageEn: z.string().nullable(),
});

type WeeklyDigestResult = z.infer<typeof weeklyDigestResultSchema>;

const tradingSignalValueSchema = z.enum(["buy", "neutral", "sell"]);
const tradingVerdictSchema = z.enum(["strong_buy", "buy", "neutral", "sell", "strong_sell"]);
const timeframeIndicatorsSchema = z.object({
  label: z.enum(["1H", "4H", "1D"]),
  technicalScore: z.number().int().min(0).max(100),
  verdict: tradingSignalValueSchema,
  candleAsOf: z.string(),
  indicators: z.object({
    rsi: z.object({ value: z.number(), signal: tradingSignalValueSchema }),
    macd: z.object({ macd: z.number(), signalLine: z.number(), histogram: z.number(), signal: tradingSignalValueSchema }),
    movingAverage: z.object({ fast: z.number(), slow: z.number(), signal: tradingSignalValueSchema }),
  }),
});

const tradingSignalSchema = z.object({
  symbol: z.enum(["BTC", "ETH", "SOL"]),
  name: z.string(),
  generatedAt: z.string(),
  marketAsOf: z.string(),
  price: z.number(),
  changePct: z.number(),
  verdict: tradingVerdictSchema,
  confidence: z.number().int().min(0).max(100),
  technicalScore: z.number().int().min(0).max(100),
  aiScore: z.number().int().min(0).max(100),
  timeframes: z.object({
    oneHour: timeframeIndicatorsSchema,
    fourHour: timeframeIndicatorsSchema,
    oneDay: timeframeIndicatorsSchema,
  }).optional(),
  indicators: z.object({
    rsi: z.object({ value: z.number(), signal: tradingSignalValueSchema }),
    macd: z.object({ macd: z.number(), signalLine: z.number(), histogram: z.number(), signal: tradingSignalValueSchema }),
    movingAverage: z.object({ fast: z.number(), slow: z.number(), signal: tradingSignalValueSchema }),
  }),
  news: z.object({ score: z.number().int().nullable(), total: z.number().int() }),
  onChain: z.object({ available: z.boolean(), score: z.number().int().nullable(), detailMm: z.string(), detailEn: z.string() }),
  rationale: bilingualTextSchema,
  caution: bilingualTextSchema,
  sources: z.array(z.string()),
});

type TradingSignal = z.infer<typeof tradingSignalSchema>;

const tradingSignalResultSchema = z.object({
  status: z.enum(["ok", "stale", "error"]),
  data: tradingSignalSchema.nullable(),
  message: z.string().nullable(),
  messageEn: z.string().nullable(),
});

type TradingSignalResult = z.infer<typeof tradingSignalResultSchema>;

const aiTradingSignalContentSchema = z.object({
  verdict: tradingVerdictSchema,
  score: z.number().int().min(0).max(100),
  confidence: z.number().int().min(0).max(100),
  rationale: bilingualTextSchema,
  caution: bilingualTextSchema,
});

const cryptoCompareNewsSchema = z.object({
  Data: z.array(z.object({
    id: z.string().optional(),
    published_on: z.number(),
    title: z.string(),
    url: z.string(),
    body: z.string().optional(),
    source: z.string().optional(),
    source_info: z.object({ name: z.string().optional() }).passthrough().optional(),
  }).passthrough()),
}).passthrough();

type RawNewsItem = {
  title: string;
  url: string | null;
  source: string | null;
  snippet: string | null;
  published_at: string | null;
};

const PRODUCTS = [
  { id: "BTC-USD", symbol: "BTC", name: "Bitcoin", tier: "large" },
  { id: "ETH-USD", symbol: "ETH", name: "Ethereum", tier: "large" },
  { id: "SOL-USD", symbol: "SOL", name: "Solana", tier: "large" },
  { id: "XRP-USD", symbol: "XRP", name: "XRP", tier: "large" },
  { id: "ADA-USD", symbol: "ADA", name: "Cardano", tier: "large" },
  { id: "DOGE-USD", symbol: "DOGE", name: "Dogecoin", tier: "large" },
  { id: "AVAX-USD", symbol: "AVAX", name: "Avalanche", tier: "large" },
  { id: "LINK-USD", symbol: "LINK", name: "Chainlink", tier: "large" },
  { id: "DOT-USD", symbol: "DOT", name: "Polkadot", tier: "mid" },
  { id: "LTC-USD", symbol: "LTC", name: "Litecoin", tier: "mid" },
  { id: "BCH-USD", symbol: "BCH", name: "Bitcoin Cash", tier: "mid" },
  { id: "UNI-USD", symbol: "UNI", name: "Uniswap", tier: "mid" },
  { id: "ATOM-USD", symbol: "ATOM", name: "Cosmos", tier: "mid" },
  { id: "NEAR-USD", symbol: "NEAR", name: "NEAR Protocol", tier: "mid" },
  { id: "APT-USD", symbol: "APT", name: "Aptos", tier: "mid" },
  { id: "ICP-USD", symbol: "ICP", name: "Internet Computer", tier: "mid" },
  { id: "FIL-USD", symbol: "FIL", name: "Filecoin", tier: "mid" },
  { id: "HBAR-USD", symbol: "HBAR", name: "Hedera", tier: "mid" },
  { id: "ALGO-USD", symbol: "ALGO", name: "Algorand", tier: "low" },
  { id: "XLM-USD", symbol: "XLM", name: "Stellar", tier: "low" },
  { id: "ARB-USD", symbol: "ARB", name: "Arbitrum", tier: "low" },
  { id: "OP-USD", symbol: "OP", name: "Optimism", tier: "low" },
  { id: "GRT-USD", symbol: "GRT", name: "The Graph", tier: "low" },
  { id: "MANA-USD", symbol: "MANA", name: "Decentraland", tier: "low" },
  { id: "SAND-USD", symbol: "SAND", name: "The Sandbox", tier: "low" },
  { id: "APE-USD", symbol: "APE", name: "ApeCoin", tier: "low" },
] as const;

const HEADERS = { "User-Agent": "MuseCryptoDashboard/1.2" };
const BLS_SCHEDULE_URL = "https://www.bls.gov/schedule/2026/";
const TOKEN_UNLOCK_SCHEDULE_URL = "https://crypto-corner.com/2026/09/22/upcoming-token-unlocks-sep-oct-2026/";
const WHALE_THRESHOLD_BTC = 10;
const CONFIGURED_NEWS_SOURCES = ["The Block", "CryptoSlate", "crypto.news", "r/CryptoCurrency"] as const;
const NAMED_SOURCE_FILTER = 'from The Block, CryptoSlate, crypto.news, and Reddit r/CryptoCurrency';

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function finite(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${label} value from source`);
  return parsed;
}

function momentumToScore(changePct: number) {
  return Math.round(clamp(50 + changePct * 5));
}

function sentimentFor(score: number) {
  if (score <= 24) return "Extreme Fear";
  if (score <= 44) return "Fear";
  if (score <= 55) return "Neutral";
  if (score <= 74) return "Greed";
  return "Extreme Greed";
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`Market source returned HTTP ${response.status}`);
  return response.json();
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`News source returned HTTP ${response.status}`);
  return response.text();
}

async function fetchWhales(): Promise<z.infer<typeof whaleSchema>[]> {
  try {
    const payload = blockchainResponseSchema.parse(
      await fetchJson("https://blockchain.info/unconfirmed-transactions?format=json"),
    );
    return payload.txs
      .map((transaction) => ({
        hash: transaction.hash,
        btc: transaction.out.reduce((sum, output) => sum + output.value, 0) / 100_000_000,
        time: new Date(transaction.time * 1000).toISOString(),
      }))
      .filter((transaction) => transaction.btc >= WHALE_THRESHOLD_BTC)
      .sort((a, b) => b.btc - a.btc)
      .slice(0, 6);
  } catch (_error) {
    return [];
  }
}

function cleanNewsText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchCryptoCompareNews(): Promise<RawNewsItem[]> {
  try {
    const payload = cryptoCompareNewsSchema.parse(
      await fetchJson("https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest"),
    );
    return payload.Data
      .filter((item) => item.title.trim().length > 0 && /^https?:\/\//i.test(item.url))
      .slice(0, 8)
      .map((item) => ({
        title: item.title.trim(),
        url: item.url,
        source: item.source_info?.name?.trim() || item.source?.trim() || "CryptoCompare News",
        snippet: item.body ? cleanNewsText(item.body).slice(0, 600) : null,
        published_at: Number.isFinite(item.published_on)
          ? new Date(item.published_on * 1000).toISOString()
          : null,
      }));
  } catch (_error) {
    return [];
  }
}

function readXmlTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match?.[1]) return null;
  return cleanNewsText(match[1].replace(/^<!\[CDATA\[|\]\]>$/g, ""));
}

async function fetchGoogleNews(): Promise<RawNewsItem[]> {
  try {
    const xml = await fetchText(
      "https://news.google.com/rss/search?q=cryptocurrency%20markets&hl=en-US&gl=US&ceid=US:en",
    );
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
      .flatMap((match) => {
        const block = match[1];
        if (!block) return [];
        const title = readXmlTag(block, "title");
        const url = readXmlTag(block, "link");
        if (!title || !url || !/^https?:\/\//i.test(url)) return [];
        const source = readXmlTag(block, "source") ?? "Google News";
        const description = readXmlTag(block, "description");
        const published = readXmlTag(block, "pubDate");
        const parsedTime = published ? new Date(published) : null;
        return [{
          title,
          url,
          source,
          snippet: description?.slice(0, 600) ?? null,
          published_at: parsedTime && Number.isFinite(parsedTime.getTime()) ? parsedTime.toISOString() : null,
        }];
      })
      .slice(0, 8);
  } catch (_error) {
    return [];
  }
}

function namedSourceFor(item: RawNewsItem) {
  if (item.url) {
    try {
      const parsed = new URL(item.url);
      const host = parsed.hostname.toLowerCase();
      const path = parsed.pathname.toLowerCase();
      if (host === "theblock.co" || host.endsWith(".theblock.co")) return "The Block";
      if (host === "cryptoslate.com" || host.endsWith(".cryptoslate.com")) return "CryptoSlate";
      if (host === "crypto.news" || host.endsWith(".crypto.news")) return "crypto.news";
      if ((host === "reddit.com" || host.endsWith(".reddit.com")) && path.includes("/r/cryptocurrency")) return "r/CryptoCurrency";
    } catch (_error) {
      // Keep the provider label returned by search when the URL cannot be parsed.
    }
  }
  return item.source?.trim() || "Crypto news source";
}

function dedupeNews(items: RawNewsItem[], limit: number) {
  const seen = new Set<string>();
  const unique: RawNewsItem[] = [];
  for (const item of items) {
    const key = item.url?.trim().toLowerCase() || item.title.trim().toLowerCase();
    if (!key || seen.has(key) || item.title.trim().length === 0) continue;
    seen.add(key);
    unique.push({ ...item, source: namedSourceFor(item) });
    if (unique.length >= limit) break;
  }
  return unique;
}

async function searchNews(ctx: Ctx, query: string, limit: number): Promise<RawNewsItem[]> {
  try {
    const search = await ctx.tool.web_search(query, { language_code: "en", timeout_secs: 45 });
    return dedupeNews(search.content.results, limit);
  } catch (_error) {
    return [];
  }
}

async function classifyNews(ctx: Ctx, raw: RawNewsItem[]): Promise<z.infer<typeof newsItemSchema>[]> {
  const material = raw.map((item, rank) => ({
    rank,
    title: item.title,
    snippet: item.snippet,
    source: item.source,
    publishedAt: item.published_at,
  }));

  let byRank = new Map<number, z.infer<typeof newsClassificationSchema>["items"][number]>();
  try {
    const classified = await ctx.inference.complete(
      `Classify each supplied crypto-news result as positive, neutral, or negative for broad crypto market sentiment. Write one concise factual summary sentence in Burmese and one in English for each item. Do not add facts beyond its title and snippet. Preserve every rank exactly.\n\n${JSON.stringify(material)}`,
      { schema: newsClassificationSchema },
    );
    byRank = new Map(classified.items.map((item) => [item.rank, item]));
  } catch (_error) {
    // Sourced stories remain useful even when optional classification is unavailable.
  }

  return raw.map((item, rank) => {
    const classification = byRank.get(rank);
    const fallbackSummary = item.snippet?.trim() || item.title;
    return {
      headline: item.title,
      source: namedSourceFor(item),
      url: item.url,
      publishedAt: item.published_at,
      sentiment: classification?.sentiment ?? "unclassified",
      summaryMm: classification?.summaryMm ?? null,
      summaryEn: classification?.summaryEn ?? fallbackSummary,
    };
  });
}

async function fetchNews(ctx: Ctx): Promise<{ items: z.infer<typeof newsItemSchema>[]; providers: string[] }> {
  const named = await searchNews(
    ctx,
    `latest cryptocurrency market news Bitcoin Ethereum regulation institutional adoption ${NAMED_SOURCE_FILTER}`,
    8,
  );
  let raw = named;

  if (raw.length < 4) {
    const general = await searchNews(
      ctx,
      "latest cryptocurrency market news Bitcoin Ethereum regulation institutional adoption",
      8,
    );
    raw = dedupeNews([...raw, ...general], 8);
  }
  if (raw.length === 0) raw = await fetchCryptoCompareNews();
  if (raw.length === 0) raw = await fetchGoogleNews();
  if (raw.length === 0) return { items: [], providers: [] };

  const normalized = dedupeNews(raw, 8);
  return {
    items: await classifyNews(ctx, normalized),
    providers: [...new Set(normalized.map((item) => namedSourceFor(item)))],
  };
}

async function fetchWhaleCoverage(ctx: Ctx): Promise<{ items: z.infer<typeof newsItemSchema>[]; providers: string[] }> {
  const raw = await searchNews(
    ctx,
    `latest Bitcoin crypto whale large-holder transfer exchange inflow outflow ${NAMED_SOURCE_FILTER}`,
    6,
  );
  if (raw.length === 0) return { items: [], providers: [] };
  return {
    items: await classifyNews(ctx, raw),
    providers: [...new Set(raw.map((item) => namedSourceFor(item)))],
  };
}

async function fetchDerivatives(): Promise<z.infer<typeof derivativeSchema>[]> {
  const symbols = ["BTC", "ETH", "SOL"];
  const rows = await Promise.all(symbols.map(async (symbol) => {
    const binancePair = `${symbol}USDT`;
    try {
      const [premiumRaw, openInterestRaw] = await Promise.all([
        fetchJson(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${binancePair}`),
        fetchJson(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${binancePair}`),
      ]);
      const premium = binancePremiumSchema.parse(premiumRaw);
      const openInterest = binanceOpenInterestSchema.parse(openInterestRaw);
      const markPrice = finite(premium.markPrice, `${binancePair} mark price`);
      const openInterestUnits = finite(openInterest.openInterest, `${binancePair} open interest`);
      return {
        symbol,
        markPrice,
        fundingRate: finite(premium.lastFundingRate, `${binancePair} funding rate`),
        nextFundingTime: new Date(premium.nextFundingTime).toISOString(),
        openInterestUnits,
        openInterestUsd: openInterestUnits * markPrice,
        source: "Binance Futures",
      };
    } catch (_binanceError) {
      try {
        const bybitPair = `${symbol}USDT`;
        const payload = bybitTickerSchema.parse(await fetchJson(
          `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${bybitPair}`,
        ));
        const row = payload.retCode === 0 ? payload.result.list[0] : undefined;
        if (!row) throw new Error(`${bybitPair} ticker is unavailable`);
        const markPrice = finite(row.markPrice, `${bybitPair} mark price`);
        const openInterestUnits = finite(row.openInterest, `${bybitPair} open interest`);
        const reportedOpenInterestUsd = finite(row.openInterestValue, `${bybitPair} open interest value`);
        const nextFundingTime = finite(row.nextFundingTime, `${bybitPair} funding time`);
        return {
          symbol,
          markPrice,
          fundingRate: finite(row.fundingRate, `${bybitPair} funding rate`),
          nextFundingTime: new Date(nextFundingTime).toISOString(),
          openInterestUnits,
          openInterestUsd: reportedOpenInterestUsd,
          source: "Bybit Perpetuals",
        };
      } catch (_bybitError) {
        try {
          const okxPair = `${symbol}-USDT-SWAP`;
          const [fundingPayload, interestPayload, tickerPayload] = await Promise.all([
            fetchJson(`https://www.okx.com/api/v5/public/funding-rate?instId=${okxPair}`),
            fetchJson(`https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${okxPair}`),
            fetchJson(`https://www.okx.com/api/v5/market/ticker?instId=${okxPair}`),
          ]);
          const funding = okxFundingSchema.parse(fundingPayload);
          const interest = okxOpenInterestSchema.parse(interestPayload);
          const ticker = okxTickerSchema.parse(tickerPayload);
          const fundingRow = funding.code === "0" ? funding.data[0] : undefined;
          const interestRow = interest.code === "0" ? interest.data[0] : undefined;
          const tickerRow = ticker.code === "0" ? ticker.data[0] : undefined;
          if (!fundingRow || !interestRow || !tickerRow) return null;
          const markPrice = finite(tickerRow.last, `${okxPair} last price`);
          const openInterestUsd = finite(interestRow.oiUsd, `${okxPair} open interest USD`);
          return {
            symbol,
            markPrice,
            fundingRate: finite(fundingRow.fundingRate, `${okxPair} funding rate`),
            nextFundingTime: new Date(finite(fundingRow.fundingTime, `${okxPair} funding time`)).toISOString(),
            openInterestUnits: openInterestUsd / markPrice,
            openInterestUsd,
            source: "OKX Perpetuals",
          };
        } catch (_okxError) {
          return null;
        }
      }
    }
  }));
  return rows.filter((row): row is NonNullable<typeof row> => row !== null);
}

async function fetchEtfFlows(ctx: Ctx): Promise<{ items: z.infer<typeof etfFlowSchema>[]; status: "ok" | "empty" | "unavailable" }> {
  try {
    const search = await ctx.tool.web_search(
      "latest US spot Bitcoin ETF and Ethereum ETF daily net flows exact trading date USD SoSoValue Farside",
      { language_code: "en", timeout_secs: 45 },
    );
    const rows = search.content.results.slice(0, 12);
    if (rows.length === 0) return { items: [], status: "empty" };
    const extracted = await ctx.inference.complete(
      `Extract daily aggregate US spot ETF net flows for Bitcoin and Ethereum from the supplied search results. Require an explicit full calendar date and an explicit aggregate USD inflow or outflow. Convert millions or billions to signed USD numbers: inflow positive, outflow negative. Prefer finalized aggregate figures attributed to SoSoValue or Farside over preliminary partial fund totals. Return at most one row per asset and date and omit ambiguous or contradictory values. resultIndex is the zero-based source result index. Today is ${new Date().toISOString().slice(0, 10)} UTC.\n\n${JSON.stringify(rows)}`,
      { schema: etfFlowExtractionSchema },
    );
    const seen = new Set<string>();
    const items = extracted.rows.flatMap((item) => {
      const source = rows[item.resultIndex];
      const parsedDate = new Date(`${item.date}T00:00:00Z`);
      const key = `${item.date}-${item.asset}`;
      if (!source?.url || !/^https?:\/\//i.test(source.url) || !Number.isFinite(parsedDate.getTime()) || seen.has(key)) return [];
      seen.add(key);
      return [{ date: item.date, asset: item.asset, netFlowUsd: item.netFlowUsd, source: source.source?.trim() || "ETF flow report", url: source.url }];
    }).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    return { items, status: items.length > 0 ? "ok" : "empty" };
  } catch (_error) {
    return { items: [], status: "unavailable" };
  }
}

async function fetchLiquidationLevels(ctx: Ctx): Promise<{ items: z.infer<typeof liquidationLevelSchema>[]; status: "ok" | "empty" | "unavailable" }> {
  try {
    const search = await ctx.tool.web_search(
      "current BTC liquidation heatmap largest long and short liquidation clusters exact price level USD CoinGlass",
      { language_code: "en", timeout_secs: 45 },
    );
    const rows = search.content.results.slice(0, 12);
    if (rows.length === 0) return { items: [], status: "empty" };
    const extracted = await ctx.inference.complete(
      `Extract only Bitcoin liquidation clusters explicitly stated in the supplied results and published within the last 14 calendar days. Each row needs the article's exact publication date (publishedDate in YYYY-MM-DD), an exact BTC price in USD, an explicit side (long liquidations below market or short liquidations above market), an explicit USD magnitude, and the stated timeframe. Never use a crawl date, update-check date, or today's date as the publication date. Do not treat support, resistance, open interest, or predicted targets as liquidation levels. Do not infer missing dates or magnitudes. resultIndex is the zero-based source result index. Today is ${new Date().toISOString().slice(0, 10)} UTC.\n\n${JSON.stringify(rows)}`,
      { schema: liquidationExtractionSchema },
    );
    const seen = new Set<string>();
    const items = extracted.levels.flatMap((item) => {
      const source = rows[item.resultIndex];
      const key = `${Math.round(item.priceUsd)}-${item.side}`;
      const publishedAt = new Date(`${item.publishedDate}T00:00:00Z`).getTime();
      const ageMs = Date.now() - publishedAt;
      if (!source?.url || !/^https?:\/\//i.test(source.url) || !Number.isFinite(publishedAt) || ageMs < 0 || ageMs > 14 * 86_400_000 || seen.has(key)) return [];
      seen.add(key);
      return [{ priceUsd: item.priceUsd, side: item.side, magnitudeUsd: item.magnitudeUsd, timeframe: item.timeframe, source: source.source?.trim() || "Liquidation heatmap report", url: source.url }];
    }).sort((a, b) => a.priceUsd - b.priceUsd);
    return { items, status: items.length > 0 ? "ok" : "empty" };
  } catch (_error) {
    return { items: [], status: "unavailable" };
  }
}

async function fetchOnChain(): Promise<z.infer<typeof onChainSchema> | null> {
  try {
    const payload = coinMetricsSchema.parse(await fetchJson(
      "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=CapMVRVCur,FlowInExNtv,FlowOutExNtv,AdrActCnt,TxCnt&frequency=1d&page_size=2",
    ));
    const row = payload.data.at(-1);
    if (!row) return null;
    const optionalNumber = (value: string | undefined) => {
      if (value === undefined) return null;
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    };
    const inflow = optionalNumber(row.FlowInExNtv);
    const outflow = optionalNumber(row.FlowOutExNtv);
    return {
      mvrv: optionalNumber(row.CapMVRVCur),
      exchangeInflowBtc: inflow,
      exchangeOutflowBtc: outflow,
      exchangeNetflowBtc: inflow !== null && outflow !== null ? inflow - outflow : null,
      activeAddresses: optionalNumber(row.AdrActCnt),
      transactions: optionalNumber(row.TxCnt),
      asOf: row.time,
      source: "Coin Metrics Community",
    };
  } catch (_error) {
    return null;
  }
}

function decodeCalendarText(value: string) {
  return cleanNewsText(value)
    .replace(/&mdash;|&#8212;/gi, "—")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&nbsp;|&#160;/gi, " ")
    .trim();
}

function dateOnlyInWindow(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return Number.isFinite(time) && time >= start.getTime() && time <= end.getTime();
}

function economicImportance(title: string): "high" | "medium" {
  return /Employment Situation|Consumer Price Index|Producer Price Index|Employment Cost Index/i.test(title) ? "high" : "medium";
}

function economicNotes(title: string) {
  if (/Consumer Price Index|Producer Price Index|Real Earnings/i.test(title)) {
    return {
      whyItMattersMm: "US inflation ဖိအားနှင့် အတိုးနှုန်းမျှော်မှန်းချက် ပြောင်းလဲနိုင်သော ထုတ်ပြန်ချက်။",
      whyItMattersEn: "A US inflation release that can shift interest-rate expectations.",
    };
  }
  if (/Employment|Job Openings|Unemployment/i.test(title)) {
    return {
      whyItMattersMm: "US အလုပ်အကိုင်အခြေအနေနှင့် Fed မူဝါဒမျှော်မှန်းချက်အတွက် အရေးပါသော ထုတ်ပြန်ချက်။",
      whyItMattersEn: "A US labor-market release relevant to Federal Reserve policy expectations.",
    };
  }
  return {
    whyItMattersMm: "US စီးပွားရေးအခြေအနေနှင့် risk-asset sentiment ကို သက်ရောက်နိုင်သော ထုတ်ပြန်ချက်။",
    whyItMattersEn: "A US economic release that can affect risk-asset sentiment.",
  };
}

async function fetchBlsCalendar(start: Date, end: Date): Promise<z.infer<typeof calendarItemSchema>[]> {
  const html = await fetchText(BLS_SCHEDULE_URL);
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const events: z.infer<typeof calendarItemSchema>[] = [];
  const allowed = /Employment Situation|Consumer Price Index|Producer Price Index|Job Openings and Labor Turnover Survey|Employment Cost Index/i;
  for (const row of rows) {
    const rowHtml = row[1];
    if (!rowHtml) continue;
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => decodeCalendarText(match[1] ?? ""));
    const dateText = cells[0];
    const title = cells[2];
    if (!dateText || !title || !allowed.test(title)) continue;
    const date = new Date(`${dateText} 12:00:00 UTC`);
    if (!dateOnlyInWindow(date, start, end)) continue;
    const normalizedTitle = title.replace(/\s+/g, " ").trim();
    events.push({
      title: normalizedTitle,
      date: date.toISOString().slice(0, 10),
      importance: economicImportance(normalizedTitle),
      ...economicNotes(normalizedTitle),
      source: "U.S. Bureau of Labor Statistics",
      url: BLS_SCHEDULE_URL,
    });
  }
  return events
    .filter((item, index, all) => all.findIndex((other) => other.date === item.date && other.title === item.title) === index)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
}

async function fetchPublishedTokenUnlocks(start: Date, end: Date): Promise<z.infer<typeof unlockItemSchema>[]> {
  const html = await fetchText(TOKEN_UNLOCK_SCHEDULE_URL);
  const headingPattern = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h[23][^>]*>|$)/gi;
  const events: z.infer<typeof unlockItemSchema>[] = [];
  for (const match of html.matchAll(headingPattern)) {
    const heading = decodeCalendarText(match[1] ?? "");
    const body = match[2] ?? "";
    const headingMatch = heading.match(/^(.+?)\s*[—–-]\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})$/i);
    if (!headingMatch) continue;
    const [, tokenName, month, day] = headingMatch;
    if (!tokenName || !month || !day) continue;
    const date = new Date(`${month} ${day}, 2026 12:00:00 UTC`);
    if (!dateOnlyInWindow(date, start, end)) continue;
    const listItems = [...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((item) => decodeCalendarText(item[1] ?? ""));
    const amount = listItems.find((item) => /\d/.test(item) && !/percent|Approx|Category|Notes/i.test(item));
    if (!amount) continue;
    events.push({
      token: tokenName.trim(),
      date: date.toISOString().slice(0, 10),
      amount,
      noteMm: "ထုတ်ဝေထားသော vesting အစီအစဉ်အရ token supply တိုးလာမည့် event ဖြစ်ပြီး ကာလတို liquidity ကို သတိပြုပါ။",
      noteEn: "A scheduled vesting release that may affect short-term circulating supply and liquidity.",
      source: "Crypto-Corner unlock calendar",
      url: TOKEN_UNLOCK_SCHEDULE_URL,
    });
  }
  return events
    .filter((item, index, all) => all.findIndex((other) => other.date === item.date && other.token === item.token) === index)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
}

async function fetchResearchCalendar(ctx: Ctx): Promise<{
  economicEvents: z.infer<typeof calendarItemSchema>[];
  tokenUnlocks: z.infer<typeof unlockItemSchema>[];
  economicStatus: "ok" | "empty" | "unavailable";
  unlockStatus: "ok" | "empty" | "unavailable";
}> {
  const today = new Date();
  const todayDate = today.toISOString().slice(0, 10);
  const end = new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000);
  const endDate = end.toISOString().slice(0, 10);
  const withinWindow = (value: string) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime())
      && parsed >= new Date(`${todayDate}T00:00:00Z`)
      && parsed <= end;
  };

  const loadEconomicEvents = async (): Promise<{ items: z.infer<typeof calendarItemSchema>[]; status: "ok" | "empty" | "unavailable" }> => {
    let directSourceFailed = false;
    try {
      const officialEvents = await fetchBlsCalendar(new Date(`${todayDate}T00:00:00Z`), end);
      if (officialEvents.length > 0) return { items: officialEvents, status: "ok" };
    } catch (_error) {
      directSourceFailed = true;
    }
    try {
      const search = await ctx.tool.web_search(
        `United States economic calendar ${todayDate} through ${endDate} FOMC CPI PCE GDP employment release dates`,
        { language_code: "en", timeout_secs: 45 },
      );
      const rows = search.content.results.slice(0, 10);
      if (rows.length === 0) return { items: [], status: directSourceFailed ? "unavailable" : "empty" };
      const extracted = await ctx.inference.complete(
        `Today is ${todayDate} UTC. Extract only upcoming US macroeconomic events explicitly supported by these search results and dated on or before ${endDate}. Prefer FOMC decisions or minutes, CPI, PCE, GDP, and employment releases that can affect crypto markets. Use a full YYYY-MM-DD only when the source explicitly supports the date. resultIndex is the zero-based index in the supplied list. Write concise Burmese and English significance notes without adding unsupported numbers or forecasts. Omit ambiguous and past items.\n\nSEARCH RESULTS\n${JSON.stringify(rows)}`,
        { schema: economicExtractionSchema },
      );
      const items = extracted.events.flatMap((item) => {
        const source = rows[item.resultIndex];
        if (!source?.url || !/^https?:\/\//i.test(source.url) || !withinWindow(item.date)) return [];
        return [{ ...item, source: source.source?.trim() || "Economic calendar", url: source.url }];
      });
      return { items, status: items.length > 0 ? "ok" : "empty" };
    } catch (_error) {
      return { items: [], status: "unavailable" };
    }
  };

  const loadTokenUnlocks = async (): Promise<{ items: z.infer<typeof unlockItemSchema>[]; status: "ok" | "empty" | "unavailable" }> => {
    let directSourceFailed = false;
    try {
      const publishedUnlocks = await fetchPublishedTokenUnlocks(new Date(`${todayDate}T00:00:00Z`), end);
      if (publishedUnlocks.length > 0) return { items: publishedUnlocks, status: "ok" };
    } catch (_error) {
      directSourceFailed = true;
    }
    try {
      const search = await ctx.tool.web_search(
        `crypto token unlock calendar ${todayDate} through ${endDate} exact date amount OP TIA SUI upcoming`,
        { language_code: "en", timeout_secs: 45 },
      );
      const rows = search.content.results.slice(0, 10);
      if (rows.length === 0) return { items: [], status: directSourceFailed ? "unavailable" : "empty" };
      const extracted = await ctx.inference.complete(
        `Today is ${todayDate} UTC. Extract only upcoming token unlocks explicitly supported by these search results and dated on or before ${endDate}. Require a named token, a full YYYY-MM-DD date, and an explicit amount or percentage; copy that amount or percentage exactly as written. resultIndex is the zero-based index in the supplied list. Write concise Burmese and English notes without inventing valuation or market impact. Omit ambiguous and past items.\n\nSEARCH RESULTS\n${JSON.stringify(rows)}`,
        { schema: unlockExtractionSchema },
      );
      const items = extracted.events.flatMap((item) => {
        const source = rows[item.resultIndex];
        if (!source?.url || !/^https?:\/\//i.test(source.url) || !withinWindow(item.date) || item.amount.trim().length === 0) return [];
        return [{ ...item, source: source.source?.trim() || "Token unlock calendar", url: source.url }];
      });
      return { items, status: items.length > 0 ? "ok" : "empty" };
    } catch (_error) {
      return { items: [], status: "unavailable" };
    }
  };

  const [economicResult, unlockResult] = await Promise.all([loadEconomicEvents(), loadTokenUnlocks()]);
  return {
    economicEvents: economicResult.items,
    tokenUnlocks: unlockResult.items,
    economicStatus: economicResult.status,
    unlockStatus: unlockResult.status,
  };
}

async function fetchLiveDashboard(ctx: Ctx): Promise<Dashboard> {
  const [statsPayloads, candlesPayload, fearGreedPayload, timePayload, whales, newsResult, whaleCoverageResult, derivatives, etfFlowResult, liquidationResult, onChain, researchCalendar] = await Promise.all([
    Promise.all(
      PRODUCTS.map(async (product) => {
        try {
          const payload = await fetchJson(`https://api.exchange.coinbase.com/products/${product.id}/stats`);
          return coinbaseStatsSchema.parse(payload);
        } catch (_error) {
          return null;
        }
      }),
    ),
    fetchJson("https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400"),
    fetchJson("https://api.alternative.me/fng/?limit=30&format=json"),
    fetchJson("https://api.exchange.coinbase.com/time"),
    fetchWhales(),
    fetchNews(ctx),
    fetchWhaleCoverage(ctx),
    fetchDerivatives(),
    fetchEtfFlows(ctx),
    fetchLiquidationLevels(ctx),
    fetchOnChain(),
    fetchResearchCalendar(ctx),
  ]);

  const candles = z.array(candleSchema).parse(candlesPayload);
  const fearGreed = fearGreedResponseSchema.parse(fearGreedPayload);
  const sourceTime = coinbaseTimeSchema.parse(timePayload);
  const latestFearGreed = fearGreed.data[0];
  const btcStats = statsPayloads[0];
  if (!latestFearGreed || !btcStats) throw new Error("Live market sources returned no current reading");

  const quotes = PRODUCTS.flatMap((product, index) => {
    const stats = statsPayloads[index];
    if (!stats) return [];
    const open = finite(stats.open, `${product.symbol} open`);
    const price = finite(stats.last, `${product.symbol} price`);
    return [{
      symbol: product.symbol,
      name: product.name,
      tier: product.tier,
      price,
      changePct: open === 0 ? 0 : ((price - open) / open) * 100,
      high: finite(stats.high, `${product.symbol} high`),
      low: finite(stats.low, `${product.symbol} low`),
      volume: finite(stats.volume, `${product.symbol} volume`),
      currency: "USD",
    }];
  });

  const btc = quotes.find((quote) => quote.symbol === "BTC");
  if (!btc) throw new Error("Bitcoin quote is unavailable");
  const news = newsResult.items;
  const fearGreedValue = Math.round(clamp(finite(latestFearGreed.value, "Fear & Greed")));
  const momentumScore = momentumToScore(btc.changePct);
  const newsSentiment = news.reduce(
    (totals, item) => ({ ...totals, [item.sentiment]: totals[item.sentiment] + 1 }),
    { positive: 0, neutral: 0, negative: 0, unclassified: 0 },
  );
  const classifiedNewsCount = newsSentiment.positive + newsSentiment.neutral + newsSentiment.negative;
  const newsScore = classifiedNewsCount > 0
    ? Math.round((newsSentiment.positive * 100 + newsSentiment.neutral * 50) / classifiedNewsCount)
    : null;
  const score = newsScore === null
    ? Math.round(fearGreedValue * 0.7 + momentumScore * 0.3)
    : Math.round(fearGreedValue * 0.55 + momentumScore * 0.25 + newsScore * 0.2);
  const currentDate = sourceTime.iso.slice(0, 10);

  const candleByTimestamp = new Map<number, (typeof candles)[number]>();
  for (const candle of candles) candleByTimestamp.set(candle[0], candle);
  const orderedCandles = [...candles].sort((a, b) => a[0] - b[0]);
  const previousCloseByTimestamp = new Map<number, number>();
  for (let index = 1; index < orderedCandles.length; index += 1) {
    const current = orderedCandles[index];
    const previous = orderedCandles[index - 1];
    if (current && previous) previousCloseByTimestamp.set(current[0], previous[4]);
  }

  const history = fearGreed.data
    .map((item) => {
      const timestamp = finite(item.timestamp, "history timestamp");
      const candle = candleByTimestamp.get(timestamp);
      if (!candle) return null;
      const previousClose = previousCloseByTimestamp.get(timestamp);
      const openOrPrevious = previousClose ?? candle[3];
      const dailyMomentum = openOrPrevious === 0 ? 0 : ((candle[4] - openOrPrevious) / openOrPrevious) * 100;
      const dailyMomentumScore = momentumToScore(dailyMomentum);
      const fgValue = Math.round(clamp(finite(item.value, "historical Fear & Greed")));
      const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
      const pointNewsScore = date === currentDate ? newsScore : null;
      return {
        date,
        score: pointNewsScore === null
          ? Math.round(fgValue * 0.7 + dailyMomentumScore * 0.3)
          : Math.round(fgValue * 0.55 + dailyMomentumScore * 0.25 + pointNewsScore * 0.2),
        fearGreed: fgValue,
        btcMomentum: dailyMomentum,
        btcPrice: candle[4],
        newsScore: pointNewsScore,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return dashboardSchema.parse({
    fetchedAt: new Date().toISOString(),
    sourceTime: sourceTime.iso,
    score,
    sentiment: sentimentFor(score),
    fearGreed: {
      value: fearGreedValue,
      classification: latestFearGreed.value_classification,
    },
    momentumScore,
    btcChangePct: btc.changePct,
    quotes,
    history,
    news,
    newsSentiment: { ...newsSentiment, total: news.length },
    newsScore,
    whales,
    whaleCoverage: whaleCoverageResult.items,
    whaleThresholdBtc: WHALE_THRESHOLD_BTC,
    derivatives,
    etfFlows: etfFlowResult.items,
    liquidationLevels: liquidationResult.items,
    onChain,
    economicCalendar: researchCalendar.economicEvents,
    tokenUnlocks: researchCalendar.tokenUnlocks,
    marketIntelligenceStatus: {
      derivatives: derivatives.length > 0 ? "ok" : "unavailable",
      etfFlows: etfFlowResult.status,
      liquidations: liquidationResult.status,
      economicCalendar: researchCalendar.economicStatus,
      tokenUnlocks: researchCalendar.unlockStatus,
      refreshedAt: new Date().toISOString(),
    },
    configuredNewsSources: [...CONFIGURED_NEWS_SOURCES],
    sources: ["Coinbase Exchange", "Alternative.me Fear & Greed Index", "Blockchain.com", ...new Set([...derivatives.map((item) => item.source), ...etfFlowResult.items.map((item) => item.source), ...liquidationResult.items.map((item) => item.source), ...(onChain ? ["Coin Metrics Community"] : []), ...newsResult.providers, ...whaleCoverageResult.providers, ...researchCalendar.economicEvents.map((item) => item.source), ...researchCalendar.tokenUnlocks.map((item) => item.source)])],
  });
}

function average(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function emaSeries(values: number[], period: number) {
  if (values.length === 0) return [];
  const multiplier = 2 / (period + 1);
  const first = values[0] ?? 0;
  const result = [first];
  for (let index = 1; index < values.length; index += 1) {
    const value = values[index] ?? result[index - 1] ?? first;
    const previous = result[index - 1] ?? first;
    result.push((value - previous) * multiplier + previous);
  }
  return result;
}

function calculateRsi(closes: number[], period = 14) {
  const window = closes.slice(-(period + 1));
  if (window.length < period + 1) throw new Error("Not enough candles for RSI");
  let gains = 0;
  let losses = 0;
  for (let index = 1; index < window.length; index += 1) {
    const current = window[index];
    const previous = window[index - 1];
    if (current === undefined || previous === undefined) continue;
    const change = current - previous;
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }
  const averageGain = gains / period;
  const averageLoss = losses / period;
  if (averageLoss === 0) return 100;
  return 100 - 100 / (1 + averageGain / averageLoss);
}

function calculateTimeframeIndicators(candles: z.infer<typeof candleSchema>[], label: "1H" | "4H" | "1D") {
  const ordered = [...candles].sort((a, b) => a[0] - b[0]);
  const closes = ordered.map((candle) => candle[4]);
  if (closes.length < 50) throw new Error(`Not enough ${label} candles for indicators`);
  const rsi = calculateRsi(closes);
  const ema12 = emaSeries(closes, 12);
  const ema26 = emaSeries(closes, 26);
  const macdSeries = closes.map((_value, index) => (ema12[index] ?? 0) - (ema26[index] ?? 0));
  const signalSeries = emaSeries(macdSeries, 9);
  const macd = macdSeries.at(-1) ?? 0;
  const signalLine = signalSeries.at(-1) ?? 0;
  const histogram = macd - signalLine;
  const fast = average(closes.slice(-20));
  const slow = average(closes.slice(-50));
  const rsiSignal: z.infer<typeof tradingSignalValueSchema> = rsi < 30 ? "buy" : rsi > 70 ? "sell" : "neutral";
  const macdSignal: z.infer<typeof tradingSignalValueSchema> = histogram > 0 ? "buy" : histogram < 0 ? "sell" : "neutral";
  const maSignal: z.infer<typeof tradingSignalValueSchema> = fast > slow ? "buy" : fast < slow ? "sell" : "neutral";
  const technicalScore = Math.round(average([rsiSignal, macdSignal, maSignal].map((signal) => signal === "buy" ? 100 : signal === "sell" ? 0 : 50)));
  const verdict: z.infer<typeof tradingSignalValueSchema> = technicalScore >= 67 ? "buy" : technicalScore <= 33 ? "sell" : "neutral";
  const latest = ordered.at(-1);
  return {
    label,
    technicalScore,
    verdict,
    candleAsOf: new Date((latest?.[0] ?? 0) * 1000).toISOString(),
    indicators: {
      rsi: { value: Number(rsi.toFixed(2)), signal: rsiSignal },
      macd: { macd: Number(macd.toFixed(4)), signalLine: Number(signalLine.toFixed(4)), histogram: Number(histogram.toFixed(4)), signal: macdSignal },
      movingAverage: { fast: Number(fast.toFixed(4)), slow: Number(slow.toFixed(4)), signal: maSignal },
    },
  };
}

function aggregateFourHourCandles(candles: z.infer<typeof candleSchema>[]) {
  const buckets = new Map<number, z.infer<typeof candleSchema>[]>();
  for (const candle of candles) {
    const bucket = Math.floor(candle[0] / 14_400) * 14_400;
    const rows = buckets.get(bucket) ?? [];
    rows.push(candle);
    buckets.set(bucket, rows);
  }
  return [...buckets.entries()].map(([timestamp, rows]) => {
    const ordered = [...rows].sort((a, b) => a[0] - b[0]);
    const first = ordered[0];
    const last = ordered.at(-1);
    if (!first || !last) return null;
    const low = Math.min(...ordered.map((row) => row[1]));
    const high = Math.max(...ordered.map((row) => row[2]));
    const volume = ordered.reduce((sum, row) => sum + row[5], 0);
    return [timestamp, low, high, first[3], last[4], volume] as z.infer<typeof candleSchema>;
  }).filter((row): row is z.infer<typeof candleSchema> => row !== null);
}

function onChainSignal(dashboard: Dashboard, symbol: string) {
  if (symbol !== "BTC" || !dashboard.onChain) {
    return {
      available: false,
      score: null,
      detailMm: symbol === "BTC" ? "ယခု snapshot အတွက် on-chain data မရရှိပါ။" : `${symbol} အတွက် ဒီ dashboard ၏ verified on-chain feed မရှိသေးပါ။`,
      detailEn: symbol === "BTC" ? "On-chain data is unavailable for this snapshot." : `This dashboard does not yet have a verified ${symbol} on-chain feed.`,
    };
  }
  const readings: number[] = [];
  if (dashboard.onChain.mvrv !== null) {
    readings.push(dashboard.onChain.mvrv < 1 ? 70 : dashboard.onChain.mvrv > 3.5 ? 30 : 50);
  }
  if (dashboard.onChain.exchangeNetflowBtc !== null) {
    readings.push(dashboard.onChain.exchangeNetflowBtc < 0 ? 65 : dashboard.onChain.exchangeNetflowBtc > 0 ? 35 : 50);
  }
  const score = readings.length > 0 ? Math.round(average(readings)) : null;
  const netflow = dashboard.onChain.exchangeNetflowBtc;
  const netflowText = netflow === null ? "exchange net flow unavailable" : `${netflow > 0 ? "+" : ""}${netflow.toFixed(2)} BTC exchange net flow`;
  return {
    available: score !== null,
    score,
    detailMm: `MVRV ${dashboard.onChain.mvrv?.toFixed(2) ?? "—"} နှင့် ${netflowText} ကို ထည့်တွက်ထားသည်။`,
    detailEn: `Uses MVRV ${dashboard.onChain.mvrv?.toFixed(2) ?? "—"} and ${netflowText}.`,
  };
}

async function latestTradingSignal(ctx: Ctx, symbol: string): Promise<TradingSignal | null> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.tradingSignalSnapshots).where(eq(schema.tradingSignalSnapshots.symbol, symbol)).orderBy(desc(schema.tradingSignalSnapshots.generatedAt)).limit(1);
  const row = rows[0];
  if (!row) return null;
  const parsed = tradingSignalSchema.safeParse(JSON.parse(row.payload));
  return parsed.success ? parsed.data : null;
}

async function createTradingSignal(ctx: Ctx, symbol: "BTC" | "ETH" | "SOL"): Promise<TradingSignalResult> {
  const db = ctx.db<typeof schema>();
  try {
    const dashboard = await latestSnapshot(ctx) ?? await fetchLiveDashboard(ctx);
    const product = PRODUCTS.find((item) => item.symbol === symbol);
    const quote = dashboard.quotes.find((item) => item.symbol === symbol);
    if (!product || !quote) throw new Error("Selected quote is unavailable");
    const [dailyPayload, hourlyPayload] = await Promise.all([
      fetchJson(`https://api.exchange.coinbase.com/products/${product.id}/candles?granularity=86400`),
      fetchJson(`https://api.exchange.coinbase.com/products/${product.id}/candles?granularity=3600`),
    ]);
    const dailyCandles = z.array(candleSchema).parse(dailyPayload);
    const hourlyCandles = z.array(candleSchema).parse(hourlyPayload);
    const oneHour = calculateTimeframeIndicators(hourlyCandles, "1H");
    const fourHour = calculateTimeframeIndicators(aggregateFourHourCandles(hourlyCandles), "4H");
    const oneDay = calculateTimeframeIndicators(dailyCandles, "1D");
    const technicalScore = Math.round(average([oneHour.technicalScore, fourHour.technicalScore, oneDay.technicalScore]));
    const chain = onChainSignal(dashboard, symbol);
    const evidence = {
      asset: { symbol, name: product.name, price: quote.price, changePct24h: quote.changePct, marketAsOf: dashboard.sourceTime },
      timeframes: { oneHour, fourHour, oneDay, blendedScore: technicalScore },
      newsSentiment: { score: dashboard.newsScore, stories: dashboard.newsSentiment.total, counts: dashboard.newsSentiment },
      onChain: chain,
    };
    const ai = await ctx.inference.complete(
      `Assess a short-to-medium-term crypto trading signal using only the supplied evidence. Balance the 1-hour, 4-hour, and 1-day technical indicators, 24-hour price change, broad crypto news sentiment, and verified on-chain data when available. Treat timeframe disagreement as uncertainty and lower confidence. If on-chain data is unavailable, explicitly lower confidence rather than inventing it. Choose one verdict, a 0–100 directional score where 50 is neutral, and a conservative confidence score. Explain the main supporting and conflicting factors in concise natural Burmese and English. Include a separate caution that signals can fail and is not personalized financial advice. Do not predict a target price or guaranteed outcome.

${JSON.stringify(evidence)}`,
      { schema: aiTradingSignalContentSchema },
    );
    const report = tradingSignalSchema.parse({
      symbol,
      name: product.name,
      generatedAt: new Date().toISOString(),
      marketAsOf: dashboard.sourceTime,
      price: quote.price,
      changePct: quote.changePct,
      verdict: ai.verdict,
      confidence: ai.confidence,
      technicalScore,
      aiScore: ai.score,
      timeframes: { oneHour, fourHour, oneDay },
      indicators: oneDay.indicators,
      news: { score: dashboard.newsScore, total: dashboard.newsSentiment.total },
      onChain: chain,
      rationale: ai.rationale,
      caution: ai.caution,
      sources: ["Coinbase Exchange", ...(dashboard.newsSentiment.total > 0 ? ["Crypto news sources"] : []), ...(chain.available && dashboard.onChain ? [dashboard.onChain.source] : [])],
    });
    const previous = await latestTradingSignal(ctx, symbol);
    await db.insert(schema.tradingSignalSnapshots).values({ symbol, generatedAt: new Date(report.generatedAt), marketAsOf: new Date(report.marketAsOf), payload: JSON.stringify(report) });
    if (previous && previous.verdict !== report.verdict) {
      const prefRows = await db.select().from(schema.notificationPreferences).where(eq(schema.notificationPreferences.id, 1)).limit(1);
      if (prefRows[0]?.signalAlerts) {
        await db.insert(schema.tradingSignalEvents).values({
          symbol,
          previousVerdict: previous.verdict,
          newVerdict: report.verdict,
          confidence: report.confidence,
          triggeredAt: new Date(report.generatedAt),
          dismissed: false,
        });
      }
    }
    const rows = await db.select({ id: schema.tradingSignalSnapshots.id }).from(schema.tradingSignalSnapshots).where(eq(schema.tradingSignalSnapshots.symbol, symbol)).orderBy(desc(schema.tradingSignalSnapshots.generatedAt)).limit(60);
    const staleIds = rows.slice(24).map((row) => row.id);
    if (staleIds.length > 0) await db.delete(schema.tradingSignalSnapshots).where(inArray(schema.tradingSignalSnapshots.id, staleIds));
    ctx.invalidateQueries();
    return { status: "ok", data: report, message: null, messageEn: null };
  } catch (_error) {
    const cached = await latestTradingSignal(ctx, symbol);
    if (cached) return { status: "stale", data: cached, message: "Signal အသစ် မရသေးသဖြင့် နောက်ဆုံးသိမ်းထားသော signal ကို ပြထားသည်။", messageEn: "A fresh signal is unavailable, so the latest saved signal is shown." };
    return { status: "error", data: null, message: "Trading signal ကို ယခုအချိန် မဖန်တီးနိုင်သေးပါ။", messageEn: "The trading signal cannot be generated right now." };
  }
}

function buildReferenceLevels(dashboard: Dashboard) {
  const btc = dashboard.quotes.find((quote) => quote.symbol === "BTC");
  if (!btc) throw new Error("Bitcoin quote is unavailable");
  const closes = dashboard.history.map((point) => point.btcPrice).filter(Number.isFinite);
  const recent = closes.slice(-7);
  return {
    sevenDayLow: recent.length > 0 ? Math.min(...recent) : btc.price,
    thirtyDayLow: closes.length > 0 ? Math.min(...closes) : btc.price,
    thirtyDayHigh: closes.length > 0 ? Math.max(...closes) : btc.price,
  };
}

async function latestDailyUpdate(ctx: Ctx): Promise<DailyMarketUpdate | null> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.dailyMarketUpdates).orderBy(desc(schema.dailyMarketUpdates.generatedAt)).limit(1);
  const row = rows[0];
  if (!row) return null;
  const parsed = dailyMarketUpdateSchema.safeParse(JSON.parse(row.payload));
  return parsed.success ? parsed.data : null;
}

async function createDailyMarketUpdate(ctx: Ctx): Promise<DailyUpdateResult> {
  const db = ctx.db<typeof schema>();
  try {
    const dashboard = await fetchLiveDashboard(ctx);
    const btc = dashboard.quotes.find((quote) => quote.symbol === "BTC");
    if (!btc) throw new Error("Bitcoin quote is unavailable");

    let searchRows: RawNewsItem[] = [];
    try {
      const search = await ctx.tool.web_search(
        "latest Bitcoin crypto market macro outlook inflation central banks regulation ETF flows next seven days",
        { language_code: "en", timeout_secs: 45 },
      );
      searchRows = search.content.results
        .filter((item) => item.title.trim().length > 0)
        .slice(0, 8);
    } catch (_error) {
      // The daily brief can still use the independently sourced dashboard news.
    }

    const sourceRows = (searchRows.length > 0 ? searchRows : dashboard.news.map((item) => ({
      title: item.headline,
      url: item.url,
      source: item.source,
      snippet: item.summaryEn,
      published_at: item.publishedAt,
    })))
      .filter((item) => item.url !== null && /^https?:\/\//i.test(item.url))
      .slice(0, 8);

    const evidence = {
      market: {
        asOf: dashboard.sourceTime,
        marketPulse: dashboard.score,
        sentiment: dashboard.sentiment,
        fearGreed: dashboard.fearGreed,
        btcPrice: btc.price,
        btc24hChangePct: btc.changePct,
        newsScore: dashboard.newsScore,
        referenceLevels: buildReferenceLevels(dashboard),
      },
      headlines: sourceRows.map((item, index) => ({
        index,
        title: item.title,
        source: item.source,
        publishedAt: item.published_at,
        snippet: item.snippet,
      })),
    };

    const content = await ctx.inference.complete(
      `Write a concise daily cryptocurrency market briefing in both natural Burmese and English using only the supplied market readings and sourced headlines. Lead with what changed and what matters today. Key takeaways must be factual. Macro items may describe the current backdrop or a dated upcoming catalyst only when the supplied evidence explicitly supports it; otherwise say that no specific dated event was confirmed. Bitcoin analysis should connect price action, sentiment, and the observed 7-day/30-day range without presenting a guaranteed forecast. Give exactly three scenarios (constructive, neutral, adverse) with observable triggers and risk-aware postures. The risk checklist must be actionable and avoid personalized financial advice. Do not cite or reuse the historical August report, and do not invent prices, dates, events, ETF flows, or statistics.\n\n${JSON.stringify(evidence)}`,
      { schema: dailyUpdateContentSchema },
    );

    const generatedAt = new Date().toISOString();
    const report = dailyMarketUpdateSchema.parse({
      ...content,
      generatedAt,
      marketAsOf: dashboard.sourceTime,
      score: dashboard.score,
      sentiment: dashboard.sentiment,
      btcPrice: btc.price,
      btcChangePct: btc.changePct,
      fearGreed: dashboard.fearGreed.value,
      newsScore: dashboard.newsScore,
      referenceLevels: buildReferenceLevels(dashboard),
      sources: sourceRows.map((item) => ({
        title: item.title,
        source: item.source ?? "Market source",
        url: item.url ?? "",
        publishedAt: item.published_at,
      })),
    });

    await db.insert(schema.dailyMarketUpdates).values({
      generatedAt: new Date(report.generatedAt),
      marketAsOf: new Date(report.marketAsOf),
      payload: JSON.stringify(report),
    });
    const rows = await db.select({ id: schema.dailyMarketUpdates.id }).from(schema.dailyMarketUpdates).orderBy(desc(schema.dailyMarketUpdates.generatedAt)).limit(30);
    const staleIds = rows.slice(14).map((row) => row.id);
    if (staleIds.length > 0) await db.delete(schema.dailyMarketUpdates).where(inArray(schema.dailyMarketUpdates.id, staleIds));
    ctx.invalidateQueries();
    return { status: "ok", data: report, message: null, messageEn: null };
  } catch (_error) {
    const cached = await latestDailyUpdate(ctx);
    if (cached) {
      return {
        status: "stale",
        data: cached,
        message: "ယနေ့ Market Update အသစ်ကို မဖန်တီးနိုင်သေးပါ။ နောက်ဆုံးသိမ်းထားသော update ကို ပြထားသည်။",
        messageEn: "Today's Market Update could not be generated yet. Showing the latest saved update.",
      };
    }
    return {
      status: "error",
      data: null,
      message: "Daily Market Update ကို မရယူနိုင်သေးပါ။ ခဏနေ ပြန်စမ်းပါ။",
      messageEn: "The daily Market Update is unavailable. Please try again in a moment.",
    };
  }
}

async function latestWeeklyDigest(ctx: Ctx): Promise<WeeklyMarketDigest | null> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.weeklyMarketDigests).orderBy(desc(schema.weeklyMarketDigests.generatedAt)).limit(1);
  const row = rows[0];
  if (!row) return null;
  const parsed = weeklyMarketDigestSchema.safeParse(JSON.parse(row.payload));
  return parsed.success ? parsed.data : null;
}

async function createWeeklyMarketDigest(ctx: Ctx): Promise<WeeklyDigestResult> {
  const db = ctx.db<typeof schema>();
  try {
    const dashboard = await fetchLiveDashboard(ctx);
    const history = dashboard.history.slice(-7);
    const first = history[0];
    const last = history.at(-1);
    if (!first || !last) throw new Error("Weekly history is unavailable");
    const sourceRows = dashboard.news.filter((item) => item.url !== null).slice(0, 8);
    const weeklyChange = first.btcPrice === 0 ? 0 : ((last.btcPrice - first.btcPrice) / first.btcPrice) * 100;
    const evidence = {
      marketAsOf: dashboard.sourceTime,
      history,
      weeklyChange,
      fearGreed: dashboard.fearGreed,
      derivatives: dashboard.derivatives,
      onChain: dashboard.onChain,
      economicCalendar: dashboard.economicCalendar,
      tokenUnlocks: dashboard.tokenUnlocks,
      headlines: sourceRows.map((item, index) => ({ index, title: item.headline, source: item.source, publishedAt: item.publishedAt, summary: item.summaryEn })),
    };
    const content = await ctx.inference.complete(
      `Write a concise weekly crypto market digest in natural Burmese and English using only the supplied evidence. Explain the observed seven-day change, market structure, notable sourced developments, and what to monitor next week. Never invent dates, events, flows, prices, or forecasts. Keep scenarios conditional and risk notes practical, not personalized financial advice.\n\n${JSON.stringify(evidence)}`,
      { schema: weeklyDigestContentSchema },
    );
    const report = weeklyMarketDigestSchema.parse({
      ...content,
      generatedAt: new Date().toISOString(),
      marketAsOf: dashboard.sourceTime,
      startScore: first.score,
      endScore: last.score,
      btcStartPrice: first.btcPrice,
      btcEndPrice: last.btcPrice,
      btcWeeklyChangePct: weeklyChange,
      sources: sourceRows.map((item) => ({ title: item.headline, source: item.source, url: item.url ?? "", publishedAt: item.publishedAt })),
    });
    await db.insert(schema.weeklyMarketDigests).values({ generatedAt: new Date(report.generatedAt), marketAsOf: new Date(report.marketAsOf), payload: JSON.stringify(report) });
    const rows = await db.select({ id: schema.weeklyMarketDigests.id }).from(schema.weeklyMarketDigests).orderBy(desc(schema.weeklyMarketDigests.generatedAt)).limit(20);
    const staleIds = rows.slice(8).map((row) => row.id);
    if (staleIds.length > 0) await db.delete(schema.weeklyMarketDigests).where(inArray(schema.weeklyMarketDigests.id, staleIds));
    ctx.invalidateQueries();
    return { status: "ok", data: report, message: null, messageEn: null };
  } catch (_error) {
    const cached = await latestWeeklyDigest(ctx);
    if (cached) return { status: "stale", data: cached, message: "Weekly Digest အသစ် မရသေးသဖြင့် နောက်ဆုံးသိမ်းထားသော report ကို ပြထားသည်။", messageEn: "The new Weekly Digest is unavailable, so the latest saved report is shown." };
    return { status: "error", data: null, message: "Weekly Digest ကို မရယူနိုင်သေးပါ။", messageEn: "The Weekly Digest is unavailable." };
  }
}

async function latestSnapshot(ctx: Ctx): Promise<Dashboard | null> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.marketSnapshots).orderBy(desc(schema.marketSnapshots.fetchedAt)).limit(1);
  const row = rows[0];
  if (!row) return null;
  const parsed = dashboardSchema.safeParse(JSON.parse(row.payload));
  return parsed.success ? parsed.data : null;
}

async function evaluateAlerts(ctx: Ctx, dashboard: Dashboard) {
  const db = ctx.db<typeof schema>();
  const alerts = await db.select().from(schema.priceAlerts).where(eq(schema.priceAlerts.active, true));
  const quoteBySymbol = new Map(dashboard.quotes.map((quote) => [quote.symbol, quote]));
  const now = new Date();
  for (const alert of alerts) {
    const quote = quoteBySymbol.get(alert.symbol);
    if (!quote) continue;
    const triggered = alert.direction === "above" ? quote.price >= alert.targetPrice : quote.price <= alert.targetPrice;
    if (triggered) {
      await db.update(schema.priceAlerts).set({
        active: false,
        triggeredAt: now,
        triggeredPrice: quote.price,
      }).where(eq(schema.priceAlerts.id, alert.id));
    }
  }

  const preferenceRows = await db.select().from(schema.marketAlertPreferences).where(eq(schema.marketAlertPreferences.id, 1)).limit(1);
  const preference = preferenceRows[0];
  if (!preference) return;
  const state: "extreme_fear" | "extreme_greed" | "neutral" = dashboard.fearGreed.value <= 24
    ? "extreme_fear"
    : dashboard.fearGreed.value >= 75
      ? "extreme_greed"
      : "neutral";
  const shouldTrigger = state !== preference.lastState && (
    (state === "extreme_fear" && preference.extremeFear) ||
    (state === "extreme_greed" && preference.extremeGreed)
  );
  if (shouldTrigger) {
    await db.insert(schema.marketAlertEvents).values({
      kind: state,
      score: dashboard.score,
      fearGreed: dashboard.fearGreed.value,
      triggeredAt: now,
      dismissed: false,
    });
  }
  await db.update(schema.marketAlertPreferences).set({ lastState: state, updatedAt: now }).where(eq(schema.marketAlertPreferences.id, 1));
}

async function refresh(ctx: Ctx): Promise<DashboardResult> {
  const db = ctx.db<typeof schema>();
  try {
    const dashboard = await fetchLiveDashboard(ctx);
    await db.insert(schema.marketSnapshots).values({
      fetchedAt: new Date(dashboard.fetchedAt),
      score: dashboard.score,
      sentiment: dashboard.sentiment,
      payload: JSON.stringify(dashboard),
    });
    await evaluateAlerts(ctx, dashboard);

    const rows = await db
      .select({ id: schema.marketSnapshots.id })
      .from(schema.marketSnapshots)
      .orderBy(desc(schema.marketSnapshots.fetchedAt))
      .limit(500);
    const staleIds = rows.slice(168).map((row) => row.id);
    if (staleIds.length > 0) {
      await db.delete(schema.marketSnapshots).where(inArray(schema.marketSnapshots.id, staleIds));
    }
    ctx.invalidateQueries();
    return { status: "ok", data: dashboard, message: null, messageEn: null };
  } catch (_error) {
    const cached = await latestSnapshot(ctx);
    if (cached) {
      return {
        status: "stale",
        data: cached,
        message: "ယခုအချိန် data source ကို ဆက်သွယ်မရသေးပါ။ နောက်ဆုံးသိမ်းထားသော data ကို ပြထားသည်။",
        messageEn: "The live sources are temporarily unavailable. Showing the latest saved data.",
      };
    }
    return {
      status: "error",
      data: null,
      message: "Market data ကို မရယူနိုင်သေးပါ။ ခဏနေ ပြန်စမ်းပါ။",
      messageEn: "Market data is unavailable. Please try again in a moment.",
    };
  }
}

async function refreshMarketIntelligence(ctx: Ctx): Promise<DashboardResult> {
  const cached = await latestSnapshot(ctx);
  if (!cached) return refresh(ctx);

  const [derivativeRows, etfFlowResult, liquidationResult, calendar] = await Promise.all([
    fetchDerivatives(),
    fetchEtfFlows(ctx),
    fetchLiquidationLevels(ctx),
    fetchResearchCalendar(ctx),
  ]);
  const derivatives = derivativeRows.length > 0 ? derivativeRows : cached.derivatives;
  const etfFlows = etfFlowResult.status === "unavailable" ? cached.etfFlows : etfFlowResult.items;
  const liquidationLevels = liquidationResult.status === "unavailable" ? cached.liquidationLevels : liquidationResult.items;
  const economicCalendar = calendar.economicStatus === "unavailable" ? cached.economicCalendar : calendar.economicEvents;
  const tokenUnlocks = calendar.unlockStatus === "unavailable" ? cached.tokenUnlocks : calendar.tokenUnlocks;
  const refreshedAt = new Date().toISOString();
  const dashboard = dashboardSchema.parse({
    ...cached,
    fetchedAt: refreshedAt,
    derivatives,
    etfFlows,
    liquidationLevels,
    economicCalendar,
    tokenUnlocks,
    marketIntelligenceStatus: {
      derivatives: derivativeRows.length > 0 ? "ok" : "unavailable",
      etfFlows: etfFlowResult.status,
      liquidations: liquidationResult.status,
      economicCalendar: calendar.economicStatus,
      tokenUnlocks: calendar.unlockStatus,
      refreshedAt,
    },
    sources: [...new Set([
      ...cached.sources,
      ...derivatives.map((item) => item.source),
      ...etfFlows.map((item) => item.source),
      ...liquidationLevels.map((item) => item.source),
      ...economicCalendar.map((item) => item.source),
      ...tokenUnlocks.map((item) => item.source),
    ])],
  });

  const db = ctx.db<typeof schema>();
  await db.insert(schema.marketSnapshots).values({
    fetchedAt: new Date(dashboard.fetchedAt),
    score: dashboard.score,
    sentiment: dashboard.sentiment,
    payload: JSON.stringify(dashboard),
  });
  ctx.invalidateQueries();

  const allUnavailable = derivativeRows.length === 0
    && etfFlowResult.status === "unavailable"
    && liquidationResult.status === "unavailable"
    && calendar.economicStatus === "unavailable"
    && calendar.unlockStatus === "unavailable";
  return allUnavailable
    ? {
      status: "stale",
      data: dashboard,
      message: "Markets data source များကို ယခုချိတ်ဆက်မရသေးပါ။ သိမ်းထားသော data ရှိပါက ဆက်လက်ပြထားသည်။",
      messageEn: "Markets sources are temporarily unavailable. Saved data is shown where available.",
    }
    : { status: "ok", data: dashboard, message: null, messageEn: null };
}

async function getSettings(ctx: Ctx): Promise<Settings> {
  const db = ctx.db<typeof schema>();
  const [watchlistRows, alertRows, preferenceRows, eventRows, signalEventRows, holdingRows, notificationRows] = await Promise.all([
    db.select().from(schema.watchlistItems).orderBy(desc(schema.watchlistItems.createdAt)),
    db.select().from(schema.priceAlerts).orderBy(desc(schema.priceAlerts.createdAt)),
    db.select().from(schema.marketAlertPreferences).where(eq(schema.marketAlertPreferences.id, 1)).limit(1),
    db.select().from(schema.marketAlertEvents).where(eq(schema.marketAlertEvents.dismissed, false)).orderBy(desc(schema.marketAlertEvents.triggeredAt)).limit(10),
    db.select().from(schema.tradingSignalEvents).where(eq(schema.tradingSignalEvents.dismissed, false)).orderBy(desc(schema.tradingSignalEvents.triggeredAt)).limit(20),
    db.select().from(schema.portfolioHoldings).orderBy(desc(schema.portfolioHoldings.updatedAt)),
    db.select().from(schema.notificationPreferences).where(eq(schema.notificationPreferences.id, 1)).limit(1),
  ]);
  const preference = preferenceRows[0];
  const notification = notificationRows[0];
  return {
    supportedCoins: PRODUCTS.map(({ symbol, name, tier }) => ({ symbol, name, tier })),
    watchlist: watchlistRows.map((row) => row.symbol),
    alerts: alertRows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      direction: row.direction,
      targetPrice: row.targetPrice,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      triggeredAt: row.triggeredAt?.toISOString() ?? null,
      triggeredPrice: row.triggeredPrice,
    })),
    marketAlerts: {
      extremeFear: preference?.extremeFear ?? false,
      extremeGreed: preference?.extremeGreed ?? false,
    },
    marketAlertEvents: eventRows.map((row) => ({
      id: row.id,
      kind: row.kind,
      score: row.score,
      fearGreed: row.fearGreed,
      triggeredAt: row.triggeredAt.toISOString(),
    })),
    signalEvents: signalEventRows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      previousVerdict: row.previousVerdict,
      newVerdict: row.newVerdict,
      confidence: row.confidence,
      triggeredAt: row.triggeredAt.toISOString(),
    })),
    holdings: holdingRows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      assetName: row.assetName,
      tier: row.tier,
      quantity: row.quantity,
      averageCost: row.averageCost,
      manualPrice: row.manualPrice,
      acquiredOn: row.acquiredOn,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    notifications: {
      priceAlerts: notification?.priceAlerts ?? false,
      marketAlerts: notification?.marketAlerts ?? false,
      weeklyDigest: notification?.weeklyDigest ?? false,
      signalAlerts: notification?.signalAlerts ?? false,
    },
  };
}

export const Actions = {
  getDashboard: defineAction({
    request: z.object({}),
    response: resultSchema,
    async handler(ctx): Promise<DashboardResult> {
      // Opening the dashboard must not wait on the slowest upstream feed or
      // optional inference pass. Scheduled and manual refreshes keep this
      // snapshot current; only a brand-new dashboard without cached data needs
      // to perform the full live refresh in the request path.
      const cached = await latestSnapshot(ctx);
      if (cached) return { status: "ok", data: cached, message: null, messageEn: null };
      return refresh(ctx);
    },
  }),

  refreshMarketData: defineAction({
    request: z.object({}),
    response: resultSchema,
    async handler(ctx): Promise<DashboardResult> {
      return refresh(ctx);
    },
  }),

  refreshMarketIntelligence: defineAction({
    request: z.object({}),
    response: resultSchema,
    async handler(ctx): Promise<DashboardResult> {
      return refreshMarketIntelligence(ctx);
    },
  }),

  getDailyMarketUpdate: defineAction({
    request: z.object({}),
    response: dailyUpdateResultSchema,
    async handler(ctx): Promise<DailyUpdateResult> {
      const cached = await latestDailyUpdate(ctx);
      if (cached) {
        const ageMs = Date.now() - new Date(cached.generatedAt).getTime();
        if (ageMs < 20 * 60 * 60 * 1000) {
          return { status: "ok", data: cached, message: null, messageEn: null };
        }
      }
      return createDailyMarketUpdate(ctx);
    },
  }),

  refreshDailyMarketUpdate: defineAction({
    request: z.object({}),
    response: dailyUpdateResultSchema,
    async handler(ctx): Promise<DailyUpdateResult> {
      return createDailyMarketUpdate(ctx);
    },
  }),

  getSettings: defineAction({
    request: z.object({}),
    response: settingsSchema,
    async handler(ctx): Promise<Settings> {
      return getSettings(ctx);
    },
  }),

  setWatchlistItem: defineAction({
    request: z.object({ symbol: z.string(), selected: z.boolean() }),
    response: settingsSchema,
    async handler(ctx, args): Promise<Settings> {
      const product = PRODUCTS.find((item) => item.symbol === args.symbol);
      if (!product) return getSettings(ctx);
      const db = ctx.db<typeof schema>();
      if (args.selected) {
        const rows = await db.select().from(schema.watchlistItems).where(eq(schema.watchlistItems.symbol, product.symbol)).limit(1);
        if (!rows[0]) {
          await db.insert(schema.watchlistItems).values({ symbol: product.symbol, createdAt: new Date() });
        }
      } else {
        await db.delete(schema.watchlistItems).where(eq(schema.watchlistItems.symbol, product.symbol));
      }
      ctx.invalidateQueries();
      return getSettings(ctx);
    },
  }),

  addPriceAlert: defineAction({
    request: z.object({
      symbol: z.string(),
      direction: z.enum(["above", "below"]),
      targetPrice: z.number().positive().max(100_000_000),
    }),
    response: settingsSchema,
    async handler(ctx, args): Promise<Settings> {
      const product = PRODUCTS.find((item) => item.symbol === args.symbol);
      if (!product) return getSettings(ctx);
      const db = ctx.db<typeof schema>();
      await db.insert(schema.priceAlerts).values({
        symbol: product.symbol,
        direction: args.direction,
        targetPrice: args.targetPrice,
        active: true,
        createdAt: new Date(),
      });
      ctx.invalidateQueries();
      return getSettings(ctx);
    },
  }),

  deletePriceAlert: defineAction({
    request: z.object({ id: z.number().int().positive() }),
    response: settingsSchema,
    async handler(ctx, args): Promise<Settings> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.priceAlerts).where(eq(schema.priceAlerts.id, args.id));
      ctx.invalidateQueries();
      return getSettings(ctx);
    },
  }),

  setMarketAlerts: defineAction({
    request: z.object({ extremeFear: z.boolean(), extremeGreed: z.boolean() }),
    response: settingsSchema,
    async handler(ctx, args): Promise<Settings> {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.marketAlertPreferences).where(eq(schema.marketAlertPreferences.id, 1)).limit(1);
      const values = { extremeFear: args.extremeFear, extremeGreed: args.extremeGreed, lastState: null, updatedAt: new Date() };
      if (rows[0]) {
        await db.update(schema.marketAlertPreferences).set(values).where(eq(schema.marketAlertPreferences.id, 1));
      } else {
        await db.insert(schema.marketAlertPreferences).values({ id: 1, ...values });
      }
      ctx.invalidateQueries();
      return getSettings(ctx);
    },
  }),

  dismissMarketAlertEvent: defineAction({
    request: z.object({ id: z.number().int().positive() }),
    response: settingsSchema,
    async handler(ctx, args): Promise<Settings> {
      const db = ctx.db<typeof schema>();
      await db.update(schema.marketAlertEvents).set({ dismissed: true }).where(eq(schema.marketAlertEvents.id, args.id));
      ctx.invalidateQueries();
      return getSettings(ctx);
    },
  }),

  upsertPortfolioHolding: defineAction({
    request: z.object({
      symbol: z.string().trim().min(2).max(12).regex(/^[A-Za-z0-9]+$/),
      assetName: z.string().trim().min(2).max(48).nullable().optional(),
      tier: coinTierSchema.nullable().optional(),
      quantity: z.number().positive().max(1_000_000_000),
      averageCost: z.number().positive().max(100_000_000).nullable(),
      manualPrice: z.number().positive().max(100_000_000).nullable().optional(),
      acquiredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    }),
    response: settingsSchema,
    async handler(ctx, args): Promise<Settings> {
      const normalizedSymbol = args.symbol.trim().toUpperCase();
      const product = PRODUCTS.find((item) => item.symbol === normalizedSymbol);
      const assetName = product?.name ?? args.assetName?.trim() ?? null;
      const tier = product?.tier ?? args.tier ?? null;
      if (!product && (!assetName || !tier || args.manualPrice === null || args.manualPrice === undefined)) return getSettings(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.portfolioHoldings).where(eq(schema.portfolioHoldings.symbol, normalizedSymbol)).limit(1);
      const now = new Date();
      const values = {
        assetName,
        tier,
        quantity: args.quantity,
        averageCost: args.averageCost,
        manualPrice: product ? null : args.manualPrice ?? null,
        acquiredOn: args.acquiredOn ?? null,
        updatedAt: now,
      };
      if (rows[0]) {
        await db.update(schema.portfolioHoldings).set(values).where(eq(schema.portfolioHoldings.symbol, normalizedSymbol));
      } else {
        await db.insert(schema.portfolioHoldings).values({ symbol: normalizedSymbol, ...values, createdAt: now });
      }
      ctx.invalidateQueries();
      return getSettings(ctx);
    },
  }),

  deletePortfolioHolding: defineAction({
    request: z.object({ id: z.number().int().positive() }),
    response: settingsSchema,
    async handler(ctx, args): Promise<Settings> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.portfolioHoldings).where(eq(schema.portfolioHoldings.id, args.id));
      ctx.invalidateQueries();
      return getSettings(ctx);
    },
  }),

  dismissTradingSignalEvent: defineAction({
    request: z.object({ id: z.number().int().positive() }),
    response: settingsSchema,
    async handler(ctx, args): Promise<Settings> {
      const db = ctx.db<typeof schema>();
      await db.update(schema.tradingSignalEvents).set({ dismissed: true }).where(eq(schema.tradingSignalEvents.id, args.id));
      ctx.invalidateQueries();
      return getSettings(ctx);
    },
  }),

  setNotificationPreferences: defineAction({
    request: z.object({ priceAlerts: z.boolean(), marketAlerts: z.boolean(), weeklyDigest: z.boolean(), signalAlerts: z.boolean() }),
    response: settingsSchema,
    async handler(ctx, args): Promise<Settings> {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.notificationPreferences).where(eq(schema.notificationPreferences.id, 1)).limit(1);
      const values = { ...args, updatedAt: new Date() };
      if (rows[0]) await db.update(schema.notificationPreferences).set(values).where(eq(schema.notificationPreferences.id, 1));
      else await db.insert(schema.notificationPreferences).values({ id: 1, ...values });
      ctx.invalidateQueries();
      return getSettings(ctx);
    },
  }),

  getWeeklyMarketDigest: defineAction({
    request: z.object({}),
    response: weeklyDigestResultSchema,
    async handler(ctx): Promise<WeeklyDigestResult> {
      const cached = await latestWeeklyDigest(ctx);
      if (cached && Date.now() - new Date(cached.generatedAt).getTime() < 6 * 24 * 60 * 60 * 1000) {
        return { status: "ok", data: cached, message: null, messageEn: null };
      }
      return createWeeklyMarketDigest(ctx);
    },
  }),

  refreshWeeklyMarketDigest: defineAction({
    request: z.object({}),
    response: weeklyDigestResultSchema,
    async handler(ctx): Promise<WeeklyDigestResult> {
      return createWeeklyMarketDigest(ctx);
    },
  }),

  getTradingSignal: defineAction({
    request: z.object({ symbol: z.enum(["BTC", "ETH", "SOL"]) }),
    response: tradingSignalResultSchema,
    async handler(ctx, args): Promise<TradingSignalResult> {
      const cached = await latestTradingSignal(ctx, args.symbol);
      if (cached && Date.now() - new Date(cached.generatedAt).getTime() < 15 * 60 * 1000) {
        return { status: "ok", data: cached, message: null, messageEn: null };
      }
      return createTradingSignal(ctx, args.symbol);
    },
  }),

  refreshTradingSignal: defineAction({
    request: z.object({ symbol: z.enum(["BTC", "ETH", "SOL"]) }),
    response: tradingSignalResultSchema,
    async handler(ctx, args): Promise<TradingSignalResult> {
      return createTradingSignal(ctx, args.symbol);
    },
  }),
} satisfies ActionsModule;
