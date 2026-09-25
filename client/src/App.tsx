import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
Area,
Bar,
BarChart,
CartesianGrid,
Cell,
ComposedChart,
LabelList,
Legend,
Line,
LineChart,
ReferenceArea,
ReferenceDot,
ReferenceLine,
ResponsiveContainer,
Tooltip,
XAxis,
YAxis,
} from "recharts";
import { api, type ApiResponse } from "./api";

type Dashboard = NonNullable<ApiResponse<typeof api, "getDashboard">["data"]>;
type Settings = ApiResponse<typeof api, "getSettings">;
type Tab = "overview" | "update" | "signals" | "watchlist" | "markets" | "news" | "dca" | "weekly";
type Language = "my" | "en";
type ThemeMode = "auto" | "light" | "dark";
type TrendRange = "30d" | "90d" | "180d" | "1y" | "all";

const copy = {
  my: {
    language: "ဘာသာစကား",
    updated: "Update",
    refresh: "Refresh",
    refreshing: "ရယူနေသည်",
    refreshMarkets: "Markets data ပြန်ယူမည်",
    refreshingMarkets: "Markets data ရယူနေသည်…",
    sourceUnavailable: "ရင်းမြစ်ကို ယခုချိတ်ဆက်မရသေးပါ။ Refresh ကို ထပ်နှိပ်နိုင်သည်။",
    noUpcomingEvents: "လာမည့် ၃၅ ရက်အတွင်း အတည်ပြုနိုင်သော event မတွေ့ပါ။",
    savedWhileUnavailable: "ရင်းမြစ်ကို ယခုချိတ်ဆက်မရသဖြင့် နောက်ဆုံးသိမ်းထားသော data ကို ပြထားသည်။",
    checked: "နောက်ဆုံးစစ်ဆေးချိန်",
    overview: "ခြုံငုံ",
    updateTab: "Market Update",
    dailyBrief: "နေ့စဉ် Market Update",
    generated: "ဖန်တီးထားချိန်",
    dailyRefresh: "ယနေ့ Update ပြန်ယူမည်",
    generatingBrief: "Market Update ဖန်တီးနေသည်…",
    briefUnavailable: "Daily Market Update မရနိုင်သေးပါ",
    briefRetry: "ပြန်ယူမည်",
    keyTakeaways: "အဓိကအနှစ်ချုပ်",
    macroOutlook: "မက်ခရိုအမြင်",
    bitcoinAnalysis: "Bitcoin သုံးသပ်ချက်",
    referenceLevels: "လတ်တလောဈေးနှုန်း အကွာအဝေး",
    sevenDayLow: "၇ ရက် အနိမ့်",
    thirtyDayLow: "၃၀ ရက် အနိမ့်",
    thirtyDayHigh: "၃၀ ရက် အမြင့်",
    scenarioPlaybook: "Scenario playbook",
    riskChecklist: "Risk checklist",
    reportSources: "နေ့စဉ် update ရင်းမြစ်များ",
    automatedDaily: "နေ့စဉ် အလိုအလျောက်အသစ်ရေးပြီး၊ လိုချင်သည့်အချိန်တွင်လည်း ပြန်ယူနိုင်သည်။",
    watchlistTab: "Watchlist & Alerts",
    newsTab: "သတင်း & Whale",
    marketPulse: "MARKET PULSE",
    indexTitle: "Crypto စျေးကွက်ညွှန်းကိန်း",
    methodology: "တွက်ချက်ပုံ",
    rising: "ဦးတည်ချက် မြင့်တက်",
    falling: "ဦးတည်ချက် လျော့ကျ",
    unchanged: "ဦးတည်ချက် မပြောင်းလဲ",
    fear: "ကြောက်ရွံ့",
    neutral: "တည်ငြိမ်",
    greed: "လိုချင်စိတ် မြင့်",
    thirtyDays: "၃၀ ရက်အထိ",
    overlayTitle: "Index နှင့် BTC စျေးနှုန်း",
    chartAria: "Market Pulse အညွှန်းနှင့် Bitcoin စျေးနှုန်း overlay လိုင်းဇယား",
    btcPrice: "BTC စျေး",
    noTrend: "လမ်းကြောင်းပြရန် data မလုံလောက်သေးပါ။",
    signals: "အချက်ပြများ",
    newsSentiment: "News sentiment",
    newsIncluded: (count: number) => `${count} သတင်း · Index တွင် 20%`,
    newsNotIncluded: "သတင်းခွဲခြမ်းချက် မရသေး၍ index တွင် မထည့်ထား",
    topCoins: "ထိပ်တန်း Coin များ",
    dailyReadings: "DAILY READINGS",
    recentHistory: "နောက်ဆုံးမှတ်တမ်း",
    days: (count: number) => `${count} ရက်`,
    watchedCoins: "စောင့်ကြည့် Coin များ",
    selectedCount: (count: number) => `${count} ခု`,
    watchDescription: "ကြည့်လိုသည့် coin ကိုရွေးပါ။ Live quote စာရင်းထဲတွင် သိမ်းထားမည်။",
    watchPicker: "Watchlist coin ရွေးချယ်ရန်",
    emptyWatch: "Watchlist အလွတ်ဖြစ်နေသည်",
    chooseCoin: "အပေါ်မှ coin တစ်ခုကို ရွေးပါ။",
    marketAlerts: "စျေးကွက် သတိပေးချက်",
    extremeTitle: "Fear & Greed အစွန်းရောက်အခြေအနေ",
    extremeHelp: "Refresh ဖြစ်တိုင်း အခြေအနေအသစ်ဝင်လာပါက in-app notification သိမ်းမည်။",
    arrived: "ရောက်ရှိ",
    dismiss: "ပိတ်မည်",
    priceAlert: "Coin စျေးနှုန်း Alert",
    targetHelp: "Target စျေးရောက်လျှင် status ပြောင်းမည်",
    condition: "အခြေအနေ",
    above: "အထက်ရောက်လျှင်",
    below: "အောက်ကျလျှင်",
    targetUsd: "Target USD",
    addAlert: "Alert ထည့်မည်",
    saving: "သိမ်းနေသည်…",
    alertNote: "Refresh သို့မဟုတ် auto-refresh ဖြစ်တိုင်း စစ်ဆေးပြီး ပြည့်မီသည့် alert ကို ဒီနေရာတွင် ပြမည်။",
    monitoring: "စောင့်ကြည့်နေသည်",
    triggered: "ပြည့်မီပြီး",
    delete: "ဖျက်မည်",
    noAlerts: "Alert မရှိသေးပါ",
    addTarget: "Target စျေးထည့်ပြီး စတင်စောင့်ကြည့်နိုင်သည်။",
    cryptoNews: "Crypto သတင်း ခံစားချက်",
    configuredSources: "ထည့်သွင်းထားသော ရင်းမြစ်များ",
    whaleCoverage: "Whale သတင်းများ",
    whaleCoverageHelp: "သတ်မှတ်ထားသော ရင်းမြစ်များမှ large-holder transfer နှင့် exchange flow သတင်းများ။",
    noWhaleCoverage: "Whale သတင်းအသစ် မရရှိသေးပါ။ On-chain transaction feed ကို အောက်တွင် ဆက်ကြည့်နိုင်သည်။",
    stories: (count: number) => `${count} သတင်း`,
    positive: "အပြုသဘော",
    negative: "အပျက်သဘော",
    unclassified: "မခွဲခြားရသေး",
    noNews: "Crypto သတင်း data မရနိုင်သေးပါ",
    noNewsHelp: "Refresh ကိုနှိပ်ပြီး လတ်တလောသတင်းများကို ထပ်မံရယူနိုင်သည်။",
    whaleActivity: "Whale လှုပ်ရှားမှု",
    whaleDescription: (threshold: number) => `Unconfirmed transaction များအနက် output စုစုပေါင်း ${threshold} BTC နှင့်အထက်ကို ပြထားသည်။ Change output ပါဝင်နိုင်သဖြင့် ဝယ်/ရောင်းအဖြစ် မသတ်မှတ်ထားပါ။`,
    noWhales: "သတ်မှတ်အရွယ်အစားထက် ကျော်သော transaction မတွေ့ပါ",
    whaleSnapshot: (threshold: number) => `ဒီ snapshot အတွက် ${threshold} BTC threshold ကို အသုံးပြုထားသည်။`,
    dcaTitle: "ပုံမှန်ဝယ်ယူမှု တွက်ချက်စက်",
    dcaDescription: "ရရှိထားသည့် BTC နေ့စဉ် close စျေးနှုန်းများအတိုင်း နောက်ကြောင်းပြန်တွက်သည်။",
    amount: "တစ်ကြိမ်ဝယ်မည့် USD",
    frequency: "ကြာချိန်",
    daily: "နေ့စဉ်",
    weekly: "အပတ်စဉ်",
    purchases: "အကြိမ်ရေ",
    dcaLimit: (count: number) => `လက်ရှိ data အတွင်း အများဆုံး ${count} ကြိမ်အထိ တွက်နိုင်သည်။ စျေးဝယ်ခနှင့် အခွန် မပါဝင်ပါ။`,
    from: "မှ",
    times: (count: number) => `${count} ကြိမ်`,
    currentValue: "ခန့်မှန်း လက်ရှိတန်ဖိုး",
    invested: "စုစုပေါင်းထည့်ငွေ",
    btcReceived: "ရရှိမည့် BTC",
    pnl: "အမြတ် / အရှုံး",
    currentBtc: "လက်ရှိ BTC စျေး",
    invalidAmount: "တွက်ချက်ရန် မှန်ကန်သော ပမာဏထည့်ပါ",
    marketStatus: "စျေးကွက်အခြေအနေ",
    sources: "ရင်းမြစ်",
    disclaimer: "Market Pulse နှင့် calculator ရလဒ်များသည် အချက်အလက်ဆိုင်ရာ ဖော်ပြချက်သာဖြစ်ပြီး ရင်းနှီးမြှုပ်နှံမှုအကြံပြုချက် မဟုတ်ပါ။",
    methodIntro: "Market Pulse သည် လက်ရှိ crypto စျေးကွက်ရဲ့ ခံစားချက်နဲ့ Bitcoin လှုပ်ရှားမှုကို ၀ မှ ၁၀၀ အထိ စုစည်းပြထားပါတယ်။",
    methodDetail: "သတင်းများကို ခွဲခြားနိုင်သည့်အခါ positive=100၊ neutral=50၊ negative=0 အဖြစ် ပျမ်းမျှပြီး 20% ထည့်တွက်သည်။ သတင်း source သို့မဟုတ် ခွဲခြမ်းချက် မရသည့်အခါ အတုမဖြည့်ဘဲ Fear & Greed 70% နှင့် BTC momentum 30% သာ သုံးသည်။ BTC ပြောင်းလဲမှု −10% ကို 0၊ 0% ကို 50၊ +10% ကို 100 အဖြစ် ပြောင်းပြီး 0–100 အတွင်း ကန့်သတ်ထားပါတယ်။ ဒါဟာ Cryptonary CPT ရဲ့ proprietary score မဟုတ်ပါ။",
    loading: "Market data ရယူနေသည်…",
    unavailable: "Market data မရနိုင်သေးပါ",
    connectionIssue: "ဆက်သွယ်မှု အခက်အခဲရှိနေပါတယ်။",
    retry: "ပြန်စမ်းမည်",
  },
  en: {
    language: "Language",
    updated: "Updated",
    refresh: "Refresh",
    refreshing: "Refreshing",
    refreshMarkets: "Refresh Markets data",
    refreshingMarkets: "Refreshing Markets data…",
    sourceUnavailable: "The source is temporarily unavailable. You can try refreshing again.",
    noUpcomingEvents: "No verified events were found in the next 35 days.",
    savedWhileUnavailable: "The source is temporarily unavailable, so the latest saved data is shown.",
    checked: "Last checked",
    overview: "Overview",
    updateTab: "Market Update",
    dailyBrief: "Daily Market Update",
    generated: "Generated",
    dailyRefresh: "Refresh today's update",
    generatingBrief: "Generating the Market Update…",
    briefUnavailable: "The daily Market Update is unavailable",
    briefRetry: "Try again",
    keyTakeaways: "Key takeaways",
    macroOutlook: "Macro outlook",
    bitcoinAnalysis: "Bitcoin analysis",
    referenceLevels: "Recent price range",
    sevenDayLow: "7-day low",
    thirtyDayLow: "30-day low",
    thirtyDayHigh: "30-day high",
    scenarioPlaybook: "Scenario playbook",
    riskChecklist: "Risk checklist",
    reportSources: "Daily update sources",
    automatedDaily: "Regenerated automatically each day, with an on-demand refresh whenever you need it.",
    watchlistTab: "Watchlist & Alerts",
    newsTab: "News & Whales",
    marketPulse: "MARKET PULSE",
    indexTitle: "Crypto Market Index",
    methodology: "Methodology",
    rising: "Trend rising",
    falling: "Trend falling",
    unchanged: "Trend unchanged",
    fear: "Fear",
    neutral: "Neutral",
    greed: "Greed",
    thirtyDays: "UP TO 30 DAYS",
    overlayTitle: "Index and BTC price",
    chartAria: "Overlay line chart of the Market Pulse index and Bitcoin price",
    btcPrice: "BTC price",
    noTrend: "Not enough data to show a trend yet.",
    signals: "Signals",
    newsSentiment: "News sentiment",
    newsIncluded: (count: number) => `${count} stories · 20% of index`,
    newsNotIncluded: "Not included until news can be classified",
    topCoins: "Top coins",
    dailyReadings: "DAILY READINGS",
    recentHistory: "Recent history",
    days: (count: number) => `${count} days`,
    watchedCoins: "Watched coins",
    selectedCount: (count: number) => `${count} selected`,
    watchDescription: "Choose coins to save in your live quote list.",
    watchPicker: "Choose watchlist coins",
    emptyWatch: "Your watchlist is empty",
    chooseCoin: "Choose a coin above to begin.",
    marketAlerts: "Market alerts",
    extremeTitle: "Extreme Fear & Greed states",
    extremeHelp: "Each refresh records an in-app alert when the market enters a newly enabled state.",
    arrived: "reached",
    dismiss: "Dismiss",
    priceAlert: "Coin price alert",
    targetHelp: "Status changes when the target price is reached",
    condition: "Condition",
    above: "At or above",
    below: "At or below",
    targetUsd: "Target USD",
    addAlert: "Add alert",
    saving: "Saving…",
    alertNote: "Targets are checked on every manual or automatic refresh, and triggered alerts appear here.",
    monitoring: "Monitoring",
    triggered: "Triggered",
    delete: "Delete",
    noAlerts: "No alerts yet",
    addTarget: "Enter a target price to begin monitoring.",
    cryptoNews: "Crypto news sentiment",
    configuredSources: "Included sources",
    whaleCoverage: "Whale coverage",
    whaleCoverageHelp: "Large-holder transfer and exchange-flow reporting from the configured sources.",
    noWhaleCoverage: "No recent whale coverage was returned. The on-chain transaction feed remains available below.",
    stories: (count: number) => `${count} stories`,
    positive: "Positive",
    negative: "Negative",
    unclassified: "Unclassified",
    noNews: "Crypto news is unavailable",
    noNewsHelp: "Tap Refresh to try loading the latest stories again.",
    whaleActivity: "Whale activity",
    whaleDescription: (threshold: number) => `Shows unconfirmed transactions with at least ${threshold} BTC in total outputs. Totals may include change, so they are not labeled as buys or sells.`,
    noWhales: "No transactions above the threshold were found",
    whaleSnapshot: (threshold: number) => `This snapshot uses a ${threshold} BTC threshold.`,
    dcaTitle: "Dollar-cost averaging calculator",
    dcaDescription: "Backtests recurring purchases against the available daily BTC closing prices.",
    amount: "USD per purchase",
    frequency: "Frequency",
    daily: "Daily",
    weekly: "Weekly",
    purchases: "Purchases",
    dcaLimit: (count: number) => `The current history supports up to ${count} purchases. Fees and taxes are excluded.`,
    from: "from",
    times: (count: number) => `${count} purchases`,
    currentValue: "Estimated current value",
    invested: "Total invested",
    btcReceived: "BTC accumulated",
    pnl: "Profit / loss",
    currentBtc: "Current BTC price",
    invalidAmount: "Enter a valid amount to calculate",
    marketStatus: "Market status",
    sources: "Sources",
    disclaimer: "Market Pulse and calculator results are informational only and are not investment advice.",
    methodIntro: "Market Pulse combines current crypto market sentiment and Bitcoin momentum into a score from 0 to 100.",
    methodDetail: "When news can be classified, positive=100, neutral=50, and negative=0 are averaged and weighted at 20%. If the news source or classification step is unavailable, the index does not invent a neutral input; it uses 70% Fear & Greed and 30% BTC momentum. BTC movement maps −10% to 0, 0% to 50, and +10% to 100, clamped to the 0–100 range. This is not Cryptonary's proprietary CPT score.",
    loading: "Loading market data…",
    unavailable: "Market data is unavailable",
    connectionIssue: "There is a connection problem.",
    retry: "Try again",
  },
} as const;

const sentimentLabels: Record<Language, Record<string, string>> = {
  my: { "Extreme Fear": "အလွန်အမင်း ကြောက်ရွံ့", Fear: "ကြောက်ရွံ့", Neutral: "တည်ငြိမ်", Greed: "လိုချင်စိတ် မြင့်", "Extreme Greed": "အလွန်အမင်း လိုချင်စိတ် မြင့်" },
  en: { "Extreme Fear": "Extreme Fear", Fear: "Fear", Neutral: "Neutral", Greed: "Greed", "Extreme Greed": "Extreme Greed" },
};

const compactUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 });
const fullUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const compactNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });

function sentimentLabel(value: string, lang: Language) {
  return sentimentLabels[lang][value] ?? value;
}

function scoreTone(score: number) {
  if (score < 25) return "#ff5c4d";
  if (score < 45) return "#f4834f";
  if (score < 56) return "#f4b740";
  if (score < 75) return "#9bc95b";
  return "#48d597";
}

function formatTime(value: string, lang: Language) {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "my" ? "my-MM" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(parsed);
}

function formatDay(value: string, lang: Language) {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "my" ? "my-MM" : "en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(parsed);
}

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  return <span className={positive ? "change-positive" : "change-negative"}>{positive ? "+" : ""}{value.toFixed(2)}%</span>;
}

function LanguageControl({ lang, setLang }: { lang: Language; setLang: (lang: Language) => void }) {
  return (
    <div className="language-control" role="group" aria-label={copy[lang].language}>
      <button aria-pressed={lang === "my"} onClick={() => setLang("my")}>မြန်မာ</button>
      <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
    </div>
  );
}

function ThemeControl({ mode, setMode, lang }: { mode: ThemeMode; setMode: (mode: ThemeMode) => void; lang: Language }) {
  const labels = lang === "my"
    ? { auto: "Auto", light: "အလင်း", dark: "အမှောင်", group: "အရောင်ပုံစံ" }
    : { auto: "Auto", light: "Light", dark: "Dark", group: "Color theme" };
  return <div className="theme-control" role="group" aria-label={labels.group}>
    {(["auto", "light", "dark"] as const).map((value) => <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{labels[value]}</button>)}
  </div>;
}

function ScoreGauge({ score, lang }: { score: number; lang: Language }) {
  const t = copy[lang];
  return (
    <div className="gauge" aria-label={`${t.indexTitle}: ${score}/100`}>
      <div className="gauge-track" aria-hidden="true"><span className="gauge-marker" style={{ left: `${score}%` }} /></div>
      <div className="gauge-labels" aria-hidden="true"><span>{t.fear}</span><span>{t.neutral}</span><span>{t.greed}</span></div>
    </div>
  );
}

function tierLabel(tier: "large" | "mid" | "low", lang: Language) {
  if (tier === "large") return lang === "my" ? "Large Cap" : "Large cap";
  if (tier === "mid") return lang === "my" ? "Mid Cap" : "Mid cap";
  return lang === "my" ? "Low Cap" : "Low cap";
}

function QuoteRow({ quote, compact = false }: { quote: Dashboard["quotes"][number]; compact?: boolean }) {
  return (
    <article className={`quote-row${compact ? " quote-row-compact" : ""}`}>
      <div className={`coin-mark coin-mark-${quote.tier}`} aria-hidden="true">{quote.symbol.slice(0, 1)}</div>
      <div className="coin-name"><strong>{quote.symbol}</strong><span>{quote.name}</span></div>
      <div className="coin-price"><strong>{quote.price >= 1000 ? compactUsd.format(quote.price) : fullUsd.format(quote.price)}</strong><Change value={quote.changePct} /></div>
    </article>
  );
}

function sentimentForScore(score: number) {
  if (score <= 24) return "Extreme Fear";
  if (score <= 44) return "Fear";
  if (score <= 55) return "Neutral";
  if (score <= 74) return "Greed";
  return "Extreme Greed";
}

const cycleStages = [
  { en: "Disbelief", my: "မယုံကြည်သေး", quoteEn: "This rally will fail.", quoteMy: "ဒီတက်လာမှုက ပြန်ကျသွားမှာပါ။", noteEn: "Prices start to recover, but recent losses still shape expectations. Many participants treat the move as another temporary rally and remain on the sidelines.", noteMy: "ဈေးနှုန်းတွေ ပြန်တက်လာပေမဲ့ မကြာသေးခင်က အရှုံးတွေကြောင့် ယုံကြည်မှု မပြန်လာသေးပါ။ လူအများက ယာယီတက်ခြင်းတစ်ခုလို့သာ မြင်ပြီး ဘေးကနေ စောင့်ကြည့်နေတတ်ပါတယ်။", color: "#25c89f", level: 20 },
  { en: "Hope", my: "မျှော်လင့်ချက်", quoteEn: "A recovery is possible.", quoteMy: "ပြန်ကောင်းလာနိုင်ပါတယ်။", noteEn: "Early signals improve and selling pressure eases. Interest returns carefully, although conviction is still limited.", noteMy: "အစောပိုင်းအချက်ပြတွေ ကောင်းလာပြီး ရောင်းအားဖိအား လျော့လာပါတယ်။ စိတ်ဝင်စားမှု ပြန်လာပေမဲ့ ယုံကြည်ချက်ကတော့ မခိုင်မာသေးပါ။", color: "#36b9d7", level: 29 },
  { en: "Optimism", my: "အကောင်းမြင်", quoteEn: "This move looks real.", quoteMy: "ဒီတက်လာမှုက တကယ်ဖြစ်ပုံရတယ်။", noteEn: "Higher prices and improving news bring confidence back. More people participate because the recovery now looks established rather than temporary.", noteMy: "ဈေးမြင့်လာတာနဲ့ သတင်းအခြေအနေကောင်းလာတာက ယုံကြည်မှုကို ပြန်ရစေပါတယ်။ ယာယီမဟုတ်ဘဲ recovery ပိုခိုင်လာသလို မြင်ရတာကြောင့် ပါဝင်သူတွေ ပိုများလာပါတယ်။", color: "#3fa9e6", level: 39 },
  { en: "Belief", my: "ယုံကြည်မှု", quoteEn: "The trend is holding.", quoteMy: "Trend က ဆက်တည်နေတယ်။", noteEn: "The advance becomes easier to trust as pullbacks recover and participation broadens. Attention shifts from doubt toward opportunity.", noteMy: "ပြန်ကျချိန်တွေမှာလည်း မြန်မြန်ပြန်တက်ပြီး ပါဝင်သူများလာတာကြောင့် trend ကို ပိုယုံကြည်လာပါတယ်။ သံသယထက် အခွင့်အရေးဘက်ကို ပိုအာရုံစိုက်လာပါတယ်။", color: "#48c882", level: 57 },
  { en: "Thrill", my: "စိတ်လှုပ်ရှား", quoteEn: "I should add more.", quoteMy: "ပိုထည့်သင့်ပြီ။", noteEn: "Strong momentum attracts wider attention and risk-taking accelerates. Fast gains can make discipline feel unnecessary.", noteMy: "Momentum ပြင်းလာတာကြောင့် အာရုံစိုက်မှုနဲ့ risk ယူလိုစိတ် မြန်မြန်တိုးလာပါတယ်။ အမြတ်မြန်တာက စည်းကမ်းထိန်းဖို့ မလိုသလို ခံစားရစေနိုင်ပါတယ်။", color: "#72cf48", level: 76 },
  { en: "Euphoria", my: "အလွန်အမင်း စိတ်ကြွ", quoteEn: "There is no ceiling.", quoteMy: "ဒီဈေးက အကန့်အသတ်မရှိ တက်မယ်။", noteEn: "Confidence reaches an extreme and downside risk is easy to dismiss. Expectations may run well ahead of what the market can sustain.", noteMy: "ယုံကြည်မှု အစွန်းရောက်လာပြီး အကျဘက် risk ကို လွယ်လွယ်ပယ်ချတတ်ပါတယ်။ မျှော်လင့်ချက်တွေက ဈေးကွက်ခံနိုင်ရည်ထက် အများကြီးရှေ့ရောက်နေနိုင်ပါတယ်။", color: "#a9d734", level: 100 },
  { en: "Complacency", my: "ပေါ့ဆမှု", quoteEn: "The next rally will restore the highs.", quoteMy: "နောက်တစ်ကြိမ်တက်ရင် အမြင့်ဟောင်းကို ပြန်ရမယ်။", noteEn: "The first meaningful weakness is treated as a pause. Participants expect the prior peak to return without reassessing risk.", noteMy: "ပထမဆုံး သိသာတဲ့အားနည်းမှုကို ခဏနားခြင်းလို့သာ မြင်ပါတယ်။ Risk ကို ပြန်မတွက်ဘဲ အမြင့်ဟောင်း ပြန်ရမယ်လို့ မျှော်လင့်နေတတ်ပါတယ်။", color: "#e3ca2f", level: 78 },
  { en: "Anxiety", my: "စိုးရိမ်မှု", quoteEn: "Why is the dip still going?", quoteMy: "ဒီကျဆင်းမှုက ဘာလို့ မရပ်သေးတာလဲ။", noteEn: "Momentum fades and the decline lasts longer than expected. Confidence starts to compete with growing doubt.", noteMy: "Momentum လျော့လာပြီး ကျဆင်းမှုက မျှော်လင့်ထားတာထက် ကြာလာပါတယ်။ ယုံကြည်မှုနဲ့ သံသယကြား ဖိအားများလာပါတယ်။", color: "#f3a52d", level: 59 },
  { en: "Denial", my: "ငြင်းဆန်မှု", quoteEn: "The strongest assets will recover.", quoteMy: "အကောင်းဆုံး asset တွေ ပြန်တက်မှာပါ။", noteEn: "Losses deepen, but the change in trend is still resisted. Familiar narratives are used to explain away new evidence.", noteMy: "အရှုံးပိုများလာပေမဲ့ trend ပြောင်းသွားတာကို လက်မခံချင်သေးပါ။ အချက်အလက်အသစ်တွေကို အရင်ယုံကြည်ချက်တွေနဲ့ပဲ ဖြေရှင်းတတ်ပါတယ်။", color: "#ef7a31", level: 40 },
  { en: "Panic", my: "ထိတ်လန့်မှု", quoteEn: "I need to get out.", quoteMy: "အခုထွက်မှ ဖြစ်မယ်။", noteEn: "Selling pressure accelerates as risk suddenly feels urgent. Decisions become reactive and liquidity can thin quickly.", noteMy: "Risk က ချက်ချင်းအရေးကြီးသလို ခံစားလာရပြီး ရောင်းအားဖိအား မြန်လာပါတယ်။ ဆုံးဖြတ်ချက်တွေ အလျင်စလိုဖြစ်ပြီး liquidity လည်း ပါးနိုင်ပါတယ်။", color: "#ed5c45", level: 22 },
  { en: "Capitulation", my: "လက်လျှော့မှု", quoteEn: "I cannot take another loss.", quoteMy: "နောက်ထပ်အရှုံး မခံနိုင်တော့ဘူး။", noteEn: "Exhausted participants exit with little regard for price. Forced selling and emotional decisions can dominate the tape.", noteMy: "ပင်ပန်းသွားတဲ့ ပါဝင်သူတွေက ဈေးကို မကြည့်တော့ဘဲ ထွက်လာတတ်ပါတယ်။ အတင်းအကျပ်ရောင်းခြင်းနဲ့ စိတ်ခံစားချက်အခြေပြု ဆုံးဖြတ်ချက်တွေ လွှမ်းမိုးနိုင်ပါတယ်။", color: "#dc4456", level: 10 },
  { en: "Anger", my: "ဒေါသ", quoteEn: "Who let this happen?", quoteMy: "ဒါကို ဘယ်သူက ဖြစ်စေတာလဲ။", noteEn: "After the washout, frustration searches for a cause. Attention remains fixed on what went wrong rather than what is changing.", noteMy: "အပြင်းအထန်ကျပြီးနောက် စိတ်ပျက်မှုက အကြောင်းရင်းရှာလာပါတယ်။ ဘာတွေပြောင်းနေသလဲထက် ဘာမှားခဲ့လဲကိုပဲ အာရုံစိုက်နေတတ်ပါတယ်။", color: "#c65478", level: 7 },
  { en: "Depression", my: "စိတ်ပျက်မှု", quoteEn: "Nothing is worth the risk.", quoteMy: "ဘာမှ risk ယူဖို့ မတန်တော့ဘူး။", noteEn: "Expectations remain deeply subdued and participation dries up. This low-attention phase can precede the next recovery, but timing remains uncertain.", noteMy: "မျှော်လင့်ချက် အလွန်နိမ့်ပြီး ပါဝင်သူလည်း နည်းသွားပါတယ်။ ဒီလိုအာရုံစိုက်မှုနည်းတဲ့အဆင့်က နောက် recovery မတိုင်ခင် ဖြစ်နိုင်ပေမဲ့ အချိန်ကိုတော့ အတည်မပြုနိုင်ပါ။", color: "#8d7099", level: 14 },
] as const;

type CycleRegime = "recovering" | "declining" | "mixed";

function deriveCycleReading(data: Dashboard) {
  const latestHistory = data.history.at(-1);
  const previousHistory = data.history.at(-2);
  const currentScore = data.score;
  const oneDayDelta = latestHistory && previousHistory
    ? latestHistory.score - previousHistory.score
    : 0;
  const lookbackIntervals = Math.min(7, Math.max(0, data.history.length - 1));
  const referenceIndex = data.history.length - 1 - lookbackIntervals;
  const reference = referenceIndex >= 0 ? data.history[referenceIndex] : undefined;
  const latestScore = latestHistory?.score ?? currentScore;
  const sevenDayDelta = reference ? latestScore - reference.score : oneDayDelta;

  // A one-point daily move is normal noise, not proof that the market crossed from
  // the rising half of the psychology curve to the falling half. Require a
  // meaningful multi-day move before switching branches.
  const regime: CycleRegime = sevenDayDelta >= 4
    ? "recovering"
    : sevenDayDelta <= -4
      ? "declining"
      : "mixed";
  const risingStage = Math.min(5, Math.max(0, Math.floor(currentScore / 17)));
  const decliningStage = Math.min(12, 6 + Math.max(0, Math.floor((100 - currentScore) / 15)));
  const stageIndex = regime === "declining"
    ? decliningStage
    : regime === "recovering"
      ? risingStage
      : currentScore >= 56
        ? risingStage
        : currentScore <= 44
          ? decliningStage
          : sevenDayDelta >= 0
            ? risingStage
            : decliningStage;
  const confidence: "low" | "medium" = regime === "mixed" || Math.abs(sevenDayDelta) < 8 ? "low" : "medium";

  return { stageIndex, regime, confidence, oneDayDelta, sevenDayDelta, lookbackIntervals };
}

function signedPoints(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

type CyclePointDotProps = {
  cx?: number;
  cy?: number;
  payload?: { color?: string };
};

function CyclePointDot({ cx, cy, payload }: CyclePointDotProps) {
  if (typeof cx !== "number" || typeof cy !== "number") return <g />;
  return <circle cx={cx} cy={cy} r={4.2} fill="var(--surface-strong)" stroke={payload?.color ?? "var(--accent)"} strokeWidth={2.4} />;
}

function CycleActiveDot({ cx, cy, payload }: CyclePointDotProps) {
  if (typeof cx !== "number" || typeof cy !== "number") return <g />;
  return <circle cx={cx} cy={cy} r={7} fill="var(--surface-strong)" stroke={payload?.color ?? "var(--text)"} strokeWidth={3} />;
}

function MarketCycle({ data, lang }: { data: Dashboard; lang: Language }) {
  const reading = deriveCycleReading(data);
  const { stageIndex } = reading;
  const [selectedIndex, setSelectedIndex] = useState(stageIndex);
  useEffect(() => setSelectedIndex(stageIndex), [stageIndex]);
  const current = cycleStages[stageIndex] ?? cycleStages[0];
  const selected = cycleStages[selectedIndex] ?? current;
  const chartStages = cycleStages.map((stage, index) => ({ ...stage, position: index, label: lang === "my" ? stage.my : stage.en }));
  const closingStage = cycleStages[0];
  const cycleChartData = [...chartStages, { ...closingStage, position: 13, level: 31, label: lang === "my" ? "ပြန်လည် မယုံကြည်သေး" : "Disbelief returns" }];
  const directionLabel = reading.regime === "recovering"
    ? (lang === "my" ? "ပြန်လည်မြင့်တက်" : "Recovering")
    : reading.regime === "declining"
      ? (lang === "my" ? "ကျဆင်းဘက်" : "Declining")
      : (lang === "my" ? "မသေချာ / ဘေးတိုက်" : "Mixed / sideways");
  const confidenceLabel = reading.confidence === "medium"
    ? (lang === "my" ? "အလယ်အလတ်" : "Medium")
    : (lang === "my" ? "နိမ့်" : "Low");
  return <section className="cycle-section" aria-labelledby="cycle-heading">
    <div className="cycle-header"><div><h2 id="cycle-heading">{lang === "my" ? "Cycle position" : "Cycle position"}</h2><p className="cycle-subtitle">{lang === "my" ? "Market Pulse နဲ့ ၇ ရက်ဦးတည်ချက်မှ ခန့်မှန်းထားသော investor psychology အဆင့်။" : "An investor-psychology estimate based on Market Pulse and its 7-day direction."}</p></div></div>
    <div className="cycle-stage-tabs" role="group" aria-label={lang === "my" ? "Cycle အဆင့်တစ်ခုရွေးရန်" : "Choose a cycle stage"}>
      <button type="button" className={`cycle-position-chip${selectedIndex === stageIndex ? " selected" : ""}`} onClick={() => setSelectedIndex(stageIndex)} aria-pressed={selectedIndex === stageIndex}>
        <i style={{ background: current.color }} /><strong>{lang === "my" ? "လက်ရှိအဆင့်" : "Current position"}</strong><span>{lang === "my" ? current.my : current.en}</span>
      </button>
      {cycleStages.map((stage, index) => index === stageIndex ? null : <button type="button" key={stage.en} className={index === selectedIndex ? "selected" : ""} onClick={() => setSelectedIndex(index)} aria-pressed={index === selectedIndex} style={index === selectedIndex ? { background: `color-mix(in srgb, ${stage.color} 12%, var(--surface-strong))` } : undefined}><i style={{ background: stage.color }} />{lang === "my" ? stage.my : stage.en}</button>)}
    </div>
    <div className="cycle-detail" aria-live="polite">
      <div className="cycle-detail-title"><strong>{lang === "my" ? selected.my : selected.en}</strong><span>“{lang === "my" ? selected.quoteMy : selected.quoteEn}”</span></div>
      {selectedIndex === stageIndex ? <>
        <div className="cycle-current-meta"><span>{lang === "my" ? "ဦးတည်ချက်" : "Direction"} <strong>{directionLabel}</strong></span><span>{lang === "my" ? "အဆင့်" : "Stage"} <strong>{stageIndex + 1}/13</strong></span><span>{lang === "my" ? "ယုံကြည်နိုင်မှု" : "Confidence"} <strong>{confidenceLabel}</strong></span></div>
        <div className="cycle-evidence" aria-label={lang === "my" ? "Cycle ခန့်မှန်းချက် အထောက်အထား" : "Cycle estimate evidence"}>
          <span><small>Market Pulse</small><strong>{data.score}/100</strong></span>
          <span><small>{lang === "my" ? "၁ ရက်ပြောင်းလဲမှု" : "1-day change"}</small><strong>{signedPoints(reading.oneDayDelta)}</strong></span>
          <span><small>{lang === "my" ? `${reading.lookbackIntervals} ရက်ပြောင်းလဲမှု` : `${reading.lookbackIntervals}-day change`}</small><strong>{signedPoints(reading.sevenDayDelta)}</strong></span>
        </div>
        <p className="cycle-rule-note">{lang === "my"
          ? "တစ်ရက်တာအတက်အကျကြောင့် cycle ဘက်ခြမ်းကို မပြောင်းပါ။ ၇ ရက်အတွင်း အနည်းဆုံး ၄ point တူညီတဲ့ဦးတည်ချက်ရှိမှ Recovering သို့မဟုတ် Declining ဟု သတ်မှတ်သည်။"
          : "A one-day move does not switch the cycle branch. Recovering or Declining requires a move of at least 4 points over 7 days."}</p>
      </> : null}
      <p>{lang === "my" ? selected.noteMy : selected.noteEn}</p>
    </div>
    <p className="cycle-chart-hint">{lang === "my" ? "Graph ပေါ်က point တစ်ခုကို လက်နဲ့ထောက်ပြီး အဆင့်အသေးစိတ်ကြည့်နိုင်ပါတယ်။" : "Touch or point at any marker to inspect that stage."}</p>
    <div className="cycle-chart" role="img" aria-label={`${lang === "my" ? current.my : current.en}, ${stageIndex + 1} of 13, ${directionLabel}`}>
      <span className="cycle-axis-y">{lang === "my" ? "ဈေးနှုန်း" : "PRICE"}</span>
      <ResponsiveContainer width="100%" height="100%"><ComposedChart
        data={cycleChartData}
        margin={{ top: 42, right: 20, bottom: 24, left: 24 }}
        onClick={(state) => {
          const activeIndex = Number(state?.activeTooltipIndex);
          if (!Number.isInteger(activeIndex)) return;
          setSelectedIndex(activeIndex === 13 ? 0 : Math.min(12, Math.max(0, activeIndex)));
        }}
      >
        <defs>
          <linearGradient id="cycle-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {cycleChartData.map((stage, index) => <stop key={`${stage.en}-${index}`} offset={`${(index / (cycleChartData.length - 1)) * 100}%`} stopColor={stage.color} />)}
          </linearGradient>
          <linearGradient id="cycle-area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#57c98a" stopOpacity=".27" /><stop offset="58%" stopColor="#57c98a" stopOpacity=".09" /><stop offset="100%" stopColor="#57c98a" stopOpacity=".01" /></linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 7" />
        <XAxis type="number" dataKey="position" domain={[0, 13]} hide />
        <YAxis domain={[0, 110]} hide />
        <Tooltip
          cursor={{ stroke: "var(--text)", strokeOpacity: .18, strokeDasharray: "3 4" }}
          allowEscapeViewBox={{ x: false, y: true }}
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload;
            if (!active || !point) return null;
            const pointIndex = point.position === 13 ? 0 : point.position;
            const pointStage = cycleStages[pointIndex] ?? cycleStages[0];
            if (!pointStage) return null;
            return <div className="cycle-tooltip" style={{ borderColor: pointStage.color }}>
              <div><i style={{ background: pointStage.color }} /><strong>{lang === "my" ? pointStage.my : pointStage.en}</strong>{pointIndex === stageIndex ? <em>{lang === "my" ? "လက်ရှိ" : "Current"}</em> : null}</div>
              <span>{lang === "my" ? `အဆင့် ${pointIndex + 1} / 13` : `Stage ${pointIndex + 1} of 13`}</span>
              <p>“{lang === "my" ? pointStage.quoteMy : pointStage.quoteEn}”</p>
            </div>;
          }}
        />
        <ReferenceArea x1={Math.max(0, stageIndex - .38)} x2={Math.min(13, stageIndex + .38)} fill={current.color} fillOpacity={.13} strokeOpacity={0} />
        <ReferenceLine x={stageIndex} stroke={current.color} strokeDasharray="3 4" strokeOpacity={.78} />
        <Area type="monotone" dataKey="level" stroke="url(#cycle-line-gradient)" strokeWidth={5} fill="url(#cycle-area-gradient)" dot={<CyclePointDot />} activeDot={<CycleActiveDot />} isAnimationActive={false}>
          <LabelList dataKey="label" position="top" className="cycle-chart-label" fill="var(--dim)" fontSize={9} />
        </Area>
        <ReferenceDot x={5} y={100} r={0} label={{ value: lang === "my" ? "အမြင့်ဆုံး အကောင်းမြင်မှု" : "PEAK OPTIMISM", position: "top", className: "cycle-landmark-label" }} />
        <ReferenceDot x={11} y={7} r={0} label={{ value: lang === "my" ? "အမြင့်ဆုံး ကြောက်ရွံ့မှု" : "PEAK FEAR", position: "bottom", className: "cycle-landmark-label" }} />
        {selectedIndex !== stageIndex ? <ReferenceDot x={selectedIndex} y={selected.level} r={6} fill="var(--surface-strong)" stroke={selected.color} strokeWidth={2.5} /> : null}
        <ReferenceDot x={stageIndex} y={current.level} r={10} fill="var(--surface-strong)" stroke={current.color} strokeWidth={4.5} />
      </ComposedChart></ResponsiveContainer>
      <span className="cycle-axis-x">{lang === "my" ? "အချိန်" : "TIME"} →</span>
    </div>
    <p className="cycle-note">{lang === "my" ? "ဤအဆင့်သည် Market Pulse နှင့် ၇ ရက် trend မှတွက်ထားသော ခန့်မှန်းချက်သာဖြစ်ပြီး market-cycle အတည်ပြုချက် မဟုတ်ပါ။ On-chain cycle metrics မပါဝင်သေးသဖြင့် ယုံကြည်နိုင်မှုကို ကန့်သတ်ထားသည်။" : "This stage is an estimate from Market Pulse and its 7-day trend—not a confirmed market-cycle call. Confidence is capped because cycle-specific on-chain metrics are not included."}</p>
  </section>;
}

const trendRanges: Array<{ value: TrendRange; label: string; days: number | null }> = [
  { value: "30d", label: "30D", days: 30 },
  { value: "90d", label: "90D", days: 90 },
  { value: "180d", label: "180D", days: 180 },
  { value: "1y", label: "1Y", days: 365 },
  { value: "all", label: "All", days: null },
];

function readingTitle(score: number, lang: Language) {
  if (score < 25) return lang === "my" ? "အလွန်သတိထားရသော reading" : "Defensive reading";
  if (score < 45) return lang === "my" ? "သတိထားရသော reading" : "Cautious reading";
  if (score <= 55) return lang === "my" ? "မျှတသော reading" : "Balanced reading";
  if (score <= 74) return lang === "my" ? "အပြုသဘောဆောင်သော reading" : "Constructive reading";
  return lang === "my" ? "အားကောင်းသော reading" : "Strong reading";
}

function readingExplanation(current: Dashboard["history"][number], previous: Dashboard["history"][number], lang: Language) {
  const change = current.score - previous.score;
  const direction = change > 0 ? (lang === "my" ? "မြင့်တက်" : "rose") : change < 0 ? (lang === "my" ? "လျော့ကျ" : "fell") : (lang === "my" ? "မပြောင်းလဲ" : "held steady");
  const points = Math.abs(change);
  if (lang === "my") {
    return `Fear & Greed ${previous.fearGreed} မှ ${current.fearGreed} သို့၊ BTC momentum ${previous.btcMomentum >= 0 ? "+" : ""}${previous.btcMomentum.toFixed(2)}% မှ ${current.btcMomentum >= 0 ? "+" : ""}${current.btcMomentum.toFixed(2)}% သို့ ပြောင်းလဲပြီး index ${points} point ${direction}ခဲ့သည်။`;
  }
  return `Fear & Greed moved from ${previous.fearGreed} to ${current.fearGreed} and BTC momentum shifted from ${previous.btcMomentum >= 0 ? "+" : ""}${previous.btcMomentum.toFixed(2)}% to ${current.btcMomentum >= 0 ? "+" : ""}${current.btcMomentum.toFixed(2)}%, so the index ${direction} ${points} point${points === 1 ? "" : "s"}.`;
}

function HistoricalTrend({ data, lang }: { data: Dashboard; lang: Language }) {
  const [range, setRange] = useState<TrendRange>("90d");
  const [expanded, setExpanded] = useState(false);
  const selectedRange = trendRanges.find((item) => item.value === range) ?? trendRanges[1];
  const filtered = useMemo(() => {
    const ordered = [...data.history].sort((a, b) => a.date.localeCompare(b.date));
    const latest = ordered.at(-1);
    if (!latest || selectedRange?.days === null || selectedRange?.days === undefined) return ordered;
    const end = new Date(`${latest.date}T00:00:00Z`).getTime();
    const cutoff = end - (selectedRange.days - 1) * 86_400_000;
    return ordered.filter((point) => new Date(`${point.date}T00:00:00Z`).getTime() >= cutoff);
  }, [data.history, selectedRange]);
  const notable = useMemo(() => {
    const changes: Array<{ current: Dashboard["history"][number]; previous: Dashboard["history"][number]; change: number }> = [];
    for (let index = 1; index < filtered.length; index += 1) {
      const current = filtered[index];
      const previous = filtered[index - 1];
      if (current && previous) changes.push({ current, previous, change: current.score - previous.score });
    }
    return changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [filtered]);
  const shown = expanded ? notable : notable.slice(0, 6);
  const latest = filtered.at(-1);
  const previous = filtered.at(-2);
  const subtitle = lang === "my" ? "ရွေးထားသောကာလအတွင်း Market Pulse reading ပြောင်းလဲပုံကို ကြည့်ပါ။" : "Track how the combined Market Pulse reading changed over the selected window.";
  return <section className="historical-trend" aria-labelledby="historical-trend-heading">
    <div className="historical-heading">
      <div><h2 id="historical-trend-heading">{lang === "my" ? "သမိုင်းလမ်းကြောင်း" : "Historical trend"}</h2><p>{subtitle}</p></div>
      <div className="range-control" role="group" aria-label={lang === "my" ? "သမိုင်းကာလ ရွေးချယ်ရန်" : "Select historical range"}>
        {trendRanges.map((item) => <button type="button" key={item.value} aria-pressed={range === item.value} onClick={() => { setRange(item.value); setExpanded(false); }}>{item.label}</button>)}
      </div>
    </div>
    {filtered.length > 1 ? <div className="historical-chart" role="img" aria-label={`${lang === "my" ? "Market Pulse လမ်းကြောင်း" : "Market Pulse trend"}, ${filtered.length} ${lang === "my" ? "ရက်" : "days"}`}>
      <ResponsiveContainer width="100%" height="100%"><ComposedChart data={filtered} margin={{ top: 14, right: 10, bottom: 2, left: -18 }}>
        <defs><linearGradient id="history-area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2ea56c" stopOpacity=".16" /><stop offset="100%" stopColor="#2ea56c" stopOpacity="0" /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="2 6" />
        <XAxis dataKey="date" tickFormatter={(value: string) => formatDay(value, lang)} tick={{ fill: "var(--dim)", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={44} />
        <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tick={{ fill: "var(--dim)", fontSize: 9 }} axisLine={false} tickLine={false} />
        <Tooltip labelFormatter={(value) => formatDay(String(value), lang)} formatter={(value) => [`${value}/100`, lang === "my" ? "Reading" : "Reading"]} contentStyle={{ background: "var(--surface-strong)", border: "1px solid var(--border)", borderRadius: 9, fontSize: 11 }} />
        <Area type="monotone" dataKey="score" stroke="#2ea56c" strokeWidth={2.5} fill="url(#history-area-gradient)" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
        {latest ? <ReferenceDot x={latest.date} y={latest.score} r={5} fill="#2ea56c" stroke="var(--surface-strong)" strokeWidth={3} /> : null}
      </ComposedChart></ResponsiveContainer>
    </div> : <p className="empty-inline">{lang === "my" ? "Trend ပြရန် reading အနည်းဆုံး နှစ်ခုလိုပါသည်။" : "At least two readings are needed to show a trend."}</p>}

    <div className="notable-header"><h2>{lang === "my" ? "ထင်ရှားသော readings" : "Notable readings"}</h2><p>{lang === "my" ? "ရွေးထားသောကာလအတွင်း score အပြောင်းအလဲ အကြီးဆုံးများ။" : "The largest score changes in the selected window."}</p></div>
    {shown.length ? <div className="notable-readings">
      <div className="notable-columns" aria-hidden="true"><span>{lang === "my" ? "ရက်စွဲ" : "Date"}</span><span>{lang === "my" ? "Score" : "Score"}</span><span>{lang === "my" ? "Reading" : "Reading"}</span><span>{lang === "my" ? "အပြောင်းအလဲ" : "Change"}</span></div>
      {shown.map(({ current, previous: prior, change }) => <article className="notable-row" key={`${current.date}-${prior.date}`}>
        <time dateTime={current.date}>{formatDay(current.date, lang)}</time>
        <strong className="notable-score" style={{ color: scoreTone(current.score), background: `color-mix(in srgb, ${scoreTone(current.score)} 13%, var(--surface-strong))` }}>{current.score}</strong>
        <div className="notable-reading"><strong>{readingTitle(current.score, lang)}</strong><p>{readingExplanation(current, prior, lang)}</p></div>
        <strong className={change >= 0 ? "notable-change positive" : "notable-change negative"}>{change >= 0 ? "+" : ""}{change}</strong>
      </article>)}
    </div> : <p className="empty-inline">{lang === "my" ? "ဒီကာလအတွက် အပြောင်းအလဲနှိုင်းယှဉ်ရန် data မလုံလောက်သေးပါ။" : "There is not enough data to compare changes in this window."}</p>}
    {notable.length > 6 ? <button type="button" className="show-more-button" onClick={() => setExpanded((value) => !value)}>{expanded ? (lang === "my" ? "လျှော့ပြမည်" : "Show less") : (lang === "my" ? "ပိုပြမည်" : "Show more")}</button> : null}
    {latest && previous ? <p className="trend-summary">{lang === "my" ? `လတ်တလော reading ${latest.score}/100 · ယခင်နေ့ထက် ${latest.score - previous.score >= 0 ? "+" : ""}${latest.score - previous.score}` : `Latest reading ${latest.score}/100 · ${latest.score - previous.score >= 0 ? "+" : ""}${latest.score - previous.score} from the prior day`}</p> : null}
  </section>;
}

function Overview({ data, lang, onOpenMethod }: { data: Dashboard; lang: Language; onOpenMethod: () => void }) {
  const t = copy[lang];
  const chartData = useMemo(() => data.history, [data.history]);
  const latestPoint = chartData.at(-1);
  const previousPoint = chartData.at(-2);
  const latestDirection = latestPoint && previousPoint ? latestPoint.score - previousPoint.score : 0;
  return (
    <>
      <div className="dashboard-grid">
        <div className="primary-column">
          <section className="score-section" aria-labelledby="pulse-heading">
            <div className="score-heading-row"><div><p className="eyebrow">{t.marketPulse}</p><h1 id="pulse-heading">{t.indexTitle}</h1></div><button className="info-button" onClick={onOpenMethod} aria-label={t.methodology}>{t.methodology} <span aria-hidden="true">↗</span></button></div>
            <div className="score-reading"><span className="score-number" style={{ color: scoreTone(data.score) }}>{data.score}</span><span className="score-out-of">/100</span><div className="score-copy"><strong>{sentimentLabel(data.sentiment, lang)}</strong><span>{latestDirection > 0 ? t.rising : latestDirection < 0 ? t.falling : t.unchanged}</span></div></div>
            <ScoreGauge score={data.score} lang={lang} />
          </section>
          <section className="chart-section" aria-labelledby="trend-heading">
            <div className="section-heading"><div><p className="eyebrow">{t.thirtyDays}</p><h2 id="trend-heading">{t.overlayTitle}</h2></div></div>
            {chartData.length > 1 ? <div className="chart-wrap chart-wrap-tall" role="img" aria-label={t.chartAria}><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 12, right: 6, bottom: 2, left: -18 }}><CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" /><XAxis dataKey="date" tickFormatter={(value: string) => formatDay(value, lang)} tick={{ fill: "var(--dim)", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={34} /><YAxis yAxisId="index" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: "var(--dim)", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis yAxisId="btc" orientation="right" domain={["auto", "auto"]} tickFormatter={(value: number) => compactUsd.format(value)} tick={{ fill: "var(--dim)", fontSize: 10 }} axisLine={false} tickLine={false} width={56} /><Tooltip labelFormatter={(value) => formatDay(String(value), lang)} formatter={(value, name) => [name === t.btcPrice ? fullUsd.format(Number(value)) : `${value}/100`, name]} contentStyle={{ background: "var(--surface-strong)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 11 }} /><Legend wrapperStyle={{ color: "var(--dim)", fontSize: 11, paddingTop: 8 }} /><Line yAxisId="index" type="monotone" dataKey="score" name="Market Pulse" stroke="#48d597" strokeWidth={3} dot={false} activeDot={{ r: 5 }} /><Line yAxisId="btc" type="monotone" dataKey="btcPrice" name={t.btcPrice} stroke="#f4b740" strokeWidth={2} dot={false} activeDot={{ r: 4 }} /></LineChart></ResponsiveContainer></div> : <p className="empty-inline">{t.noTrend}</p>}
          </section>
        </div>
        <aside className="side-column">
          <section className="signals-section" aria-labelledby="signals-heading"><div className="section-heading"><div><p className="eyebrow">SIGNALS</p><h2 id="signals-heading">{t.signals}</h2></div></div><div className="signal-list"><article><div><span>Fear & Greed</span><small>{sentimentLabel(data.fearGreed.classification, lang)}</small></div><strong>{data.fearGreed.value}</strong></article><article><div><span>BTC Momentum Score</span><small>0–100 · 24h {data.btcChangePct >= 0 ? "+" : ""}{data.btcChangePct.toFixed(2)}%</small></div><strong>{data.momentumScore}</strong></article><article><div><span>{t.newsSentiment}</span><small>{data.newsScore !== null ? t.newsIncluded(data.newsSentiment.total) : t.newsNotIncluded}</small></div><strong className="news-score">{data.newsScore ?? "—"}</strong></article></div></section>
          <section className="quotes-section" aria-labelledby="quotes-heading"><div className="section-heading"><div><p className="eyebrow">USD SPOT</p><h2 id="quotes-heading">{t.topCoins}</h2></div></div><div className="quote-list">{data.quotes.slice(0, 3).map((quote) => <QuoteRow key={quote.symbol} quote={quote} />)}</div></section>
        </aside>
      </div>
      <MarketCycle data={data} lang={lang} />
      <HistoricalTrend data={data} lang={lang} />
    </>
  );
}

function localized(value: { mm: string; en: string }, lang: Language) {
  return lang === "my" ? value.mm : value.en;
}

function MarketUpdate({ lang }: { lang: Language }) {
  const queryClient = useQueryClient();
  const t = copy[lang];
  const report = useQuery({ queryKey: ["daily-market-update"], queryFn: () => api.getDailyMarketUpdate({}), staleTime: 15 * 60 * 1000 });
  const regenerate = useMutation({
    mutationFn: () => api.refreshDailyMarketUpdate({}),
    onSuccess: (result) => queryClient.setQueryData(["daily-market-update"], result),
  });
  const result = regenerate.data ?? report.data;
  const data = result?.data ?? null;

  if (report.isPending && !data) {
    return <section className="update-state" aria-live="polite"><div className="loader" /><p>{t.generatingBrief}</p></section>;
  }
  if (report.isError || !data) {
    return <section className="update-state"><p className="eyebrow">DAILY BRIEF</p><h1>{t.briefUnavailable}</h1><button className="primary-button" onClick={() => report.refetch()}>{t.briefRetry}</button></section>;
  }

  return (
    <div className="market-update-page">
      <header className="update-hero">
        <div>
          <p className="eyebrow">{t.dailyBrief}</p>
          <h1>{localized(data.headline, lang)}</h1>
          <p className="update-deck">{localized(data.deck, lang)}</p>
        </div>
        <div className="snapshot-stamp">
          <span>{t.generated} · {formatTime(data.generatedAt, lang)}</span>
          <strong>DAILY · {data.score}/100</strong>
        </div>
      </header>

      <div className="daily-brief-toolbar">
        <p>{t.automatedDaily}</p>
        <button className="refresh-button" onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
          {regenerate.isPending ? t.generatingBrief : t.dailyRefresh}
        </button>
      </div>
      {result?.status === "stale" ? <div className="status-banner" role="status">{lang === "my" ? result.message : result.messageEn}</div> : null}

      <section className="update-section" aria-labelledby="daily-key-takeaways">
        <div className="report-section-heading"><span>01</span><div><p className="eyebrow">{t.keyTakeaways}</p><h2 id="daily-key-takeaways">{localized(data.bitcoinAnalysis.title, lang)}</h2></div></div>
        <div className="daily-takeaways">{data.keyTakeaways.map((item, index) => <article key={index}><span>0{index + 1}</span><p>{localized(item, lang)}</p></article>)}</div>
        <div className="report-metrics">
          <article><strong>{fullUsd.format(data.btcPrice)}</strong><span>BTC · {data.btcChangePct >= 0 ? "+" : ""}{data.btcChangePct.toFixed(2)}% / 24h</span></article>
          <article><strong>{data.score}/100</strong><span>Market Pulse · {sentimentLabel(data.sentiment, lang)}</span></article>
          <article><strong>{data.fearGreed}/100</strong><span>Fear & Greed</span></article>
        </div>
      </section>

      <section className="update-section" aria-labelledby="daily-macro">
        <div className="report-section-heading"><span>02</span><div><p className="eyebrow">{t.macroOutlook}</p><h2 id="daily-macro">{t.macroOutlook}</h2></div></div>
        <div className="macro-timeline">{data.macroOutlook.map((item, index) => <article key={index}><span>{localized(item.label, lang)}</span><div><h3>{localized(item.title, lang)}</h3><p>{localized(item.body, lang)}</p></div></article>)}</div>
      </section>

      <section className="update-section" aria-labelledby="daily-bitcoin">
        <div className="report-section-heading"><span>03</span><div><p className="eyebrow">{t.bitcoinAnalysis}</p><h2 id="daily-bitcoin">{localized(data.bitcoinAnalysis.title, lang)}</h2></div></div>
        <p className="report-lede">{localized(data.bitcoinAnalysis.body, lang)}</p>
        <h3 className="reference-heading">{t.referenceLevels}</h3>
        <div className="reference-grid">
          <article><span>{t.sevenDayLow}</span><strong>{fullUsd.format(data.referenceLevels.sevenDayLow)}</strong></article>
          <article><span>{t.thirtyDayLow}</span><strong>{fullUsd.format(data.referenceLevels.thirtyDayLow)}</strong></article>
          <article><span>{t.thirtyDayHigh}</span><strong>{fullUsd.format(data.referenceLevels.thirtyDayHigh)}</strong></article>
        </div>
        <p className="live-note">{copy[lang].updated} · {formatTime(data.marketAsOf, lang)} · Coinbase Exchange</p>
      </section>

      <section className="update-section" aria-labelledby="daily-playbook">
        <div className="report-section-heading"><span>04</span><div><p className="eyebrow">DECISION FRAMEWORK</p><h2 id="daily-playbook">{t.scenarioPlaybook}</h2></div></div>
        <div className="scenario-list">{data.scenarios.map((scenario, index) => <article key={index}><strong>{localized(scenario.name, lang)}</strong><p>{localized(scenario.trigger, lang)}</p><span>{localized(scenario.posture, lang)}</span></article>)}</div>
        <div className="daily-risk"><h3>{t.riskChecklist}</h3><ul>{data.riskChecklist.map((item, index) => <li key={index}>{localized(item, lang)}</li>)}</ul></div>
      </section>

      <section className="report-sources" aria-labelledby="daily-sources"><p className="eyebrow">SOURCES</p><h2 id="daily-sources">{t.reportSources}</h2>{data.sources.length > 0 ? <div>{data.sources.map((source, index) => <a key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.source}{source.publishedAt ? ` · ${formatTime(source.publishedAt, lang)}` : ""}</span></a>)}</div> : <p>{lang === "my" ? "အပိုဆောင်း source link မရရှိပါ။" : "No additional source links were available."}</p>}</section>
    </div>
  );
}

function PortfolioTracker({ data, settings, lang, onSettingsChange }: { data: Dashboard; settings: Settings; lang: Language; onSettingsChange: (settings: Settings) => void }) {
  type Tier = Settings["supportedCoins"][number]["tier"];
  const [symbol, setSymbol] = useState("BTC");
  const [quantity, setQuantity] = useState("");
  const [averageCost, setAverageCost] = useState("");
  const [acquiredOn, setAcquiredOn] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customSymbol, setCustomSymbol] = useState("");
  const [customName, setCustomName] = useState("");
  const [customTier, setCustomTier] = useState<Tier>("low");
  const [manualPrice, setManualPrice] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | Tier>("all");
  const save = useMutation({
    mutationFn: (args: { symbol: string; assetName?: string | null; tier?: Tier | null; quantity: number; averageCost: number | null; manualPrice?: number | null; acquiredOn?: string | null }) => api.upsertPortfolioHolding(args),
    onSuccess: (next) => { onSettingsChange(next); setQuantity(""); setAverageCost(""); setAcquiredOn(""); setManualPrice(""); },
  });
  const remove = useMutation({ mutationFn: (id: number) => api.deletePortfolioHolding({ id }), onSuccess: onSettingsChange });
  const quoteBySymbol = useMemo(() => new Map(data.quotes.map((quote) => [quote.symbol, quote])), [data.quotes]);
  const coinBySymbol = useMemo(() => new Map(settings.supportedCoins.map((coin) => [coin.symbol, coin])), [settings.supportedCoins]);
  const valued = settings.holdings.map((holding) => {
    const quote = quoteBySymbol.get(holding.symbol) ?? null;
    const price = quote?.price ?? holding.manualPrice;
    const value = price === null ? null : holding.quantity * price;
    const cost = holding.averageCost === null ? null : holding.quantity * holding.averageCost;
    const catalogCoin = coinBySymbol.get(holding.symbol);
    const coin = catalogCoin ?? (holding.tier ? { symbol: holding.symbol, name: holding.assetName ?? holding.symbol, tier: holding.tier } : undefined);
    return { ...holding, quote, coin, price, isManual: !catalogCoin, value, cost, pnl: value === null || cost === null ? null : value - cost };
  });
  const filteredHoldings = tierFilter === "all" ? valued : valued.filter((item) => item.coin?.tier === tierFilter);
  const totalValue = valued.reduce((sum, item) => sum + (item.value ?? 0), 0);
  const trackedPnl = valued.reduce((sum, item) => sum + (item.pnl ?? 0), 0);
  const costedCount = valued.filter((item) => item.pnl !== null).length;
  const btcQuote = quoteBySymbol.get("BTC");
  const benchmark = useMemo(() => {
    if (!btcQuote) return null;
    let invested = 0;
    let portfolioValue = 0;
    let btcUnits = 0;
    let holdings = 0;
    const orderedHistory = [...data.history].sort((a, b) => a.date.localeCompare(b.date));
    for (const item of valued) {
      if (item.cost === null || item.value === null || !item.acquiredOn) continue;
      const acquisitionDate = item.acquiredOn;
      const start = orderedHistory.find((point) => point.date >= acquisitionDate);
      if (!start || start.btcPrice <= 0) continue;
      invested += item.cost;
      portfolioValue += item.value;
      btcUnits += item.cost / start.btcPrice;
      holdings += 1;
    }
    if (holdings === 0 || invested <= 0) return null;
    const btcValue = btcUnits * btcQuote.price;
    const portfolioReturn = ((portfolioValue / invested) - 1) * 100;
    const btcReturn = ((btcValue / invested) - 1) * 100;
    return { invested, portfolioValue, btcValue, portfolioReturn, btcReturn, excess: portfolioReturn - btcReturn, holdings };
  }, [btcQuote, data.history, valued]);
  const tierCounts = settings.supportedCoins.reduce((counts, coin) => ({ ...counts, [coin.tier]: counts[coin.tier] + 1 }), { large: 0, mid: 0, low: 0 });
  const groupedCoins: Array<{ tier: Tier; coins: Settings["supportedCoins"] }> = (["large", "mid", "low"] as const).map((tier) => ({ tier, coins: settings.supportedCoins.filter((coin) => coin.tier === tier) }));

  function submit(event: FormEvent) {
    event.preventDefault();
    const amount = Number(quantity);
    const cost = averageCost.trim() === "" ? null : Number(averageCost);
    const price = manualPrice.trim() === "" ? null : Number(manualPrice);
    const normalizedCustomSymbol = customSymbol.trim().toUpperCase();
    if (!Number.isFinite(amount) || amount <= 0 || (cost !== null && (!Number.isFinite(cost) || cost <= 0))) return;
    if (customMode) {
      if (!/^[A-Z0-9]{2,12}$/.test(normalizedCustomSymbol) || customName.trim().length < 2 || price === null || !Number.isFinite(price) || price <= 0) return;
      save.mutate({ symbol: normalizedCustomSymbol, assetName: customName.trim(), tier: customTier, quantity: amount, averageCost: cost, manualPrice: price, acquiredOn: acquiredOn || null });
      return;
    }
    save.mutate({ symbol, quantity: amount, averageCost: cost, manualPrice: null, acquiredOn: acquiredOn || null });
  }

  return <section className="feature-section portfolio-section" aria-labelledby="portfolio-heading">
    <div className="portfolio-hero">
      <div><p className="eyebrow">PORTFOLIO</p><h1 id="portfolio-heading">{lang === "my" ? "Portfolio Tracker" : "Portfolio tracker"}</h1><p>{lang === "my" ? "Live coin ၂၆ မျိုးအပြင် ကိုယ်လိုချင်သော coin အသစ်ကို symbol၊ ဈေးနှင့် cap group ထည့်ပြီး manual စောင့်ကြည့်နိုင်သည်။" : "Track 26 live-priced assets, plus any new coin you add manually with its symbol, price, and cap group."}</p></div>
      <div className="portfolio-total"><span>{lang === "my" ? "စုစုပေါင်းတန်ဖိုး" : "Portfolio value"}</span><strong>{fullUsd.format(totalValue)}</strong><small>{settings.holdings.length} {lang === "my" ? "assets" : "assets"}</small></div>
    </div>

    <div className="cap-band" aria-label={lang === "my" ? "Coin အုပ်စုများ" : "Coin groups"}>
      {(["large", "mid", "low"] as const).map((tier) => <button key={tier} type="button" aria-pressed={tierFilter === tier} onClick={() => setTierFilter(tierFilter === tier ? "all" : tier)}><span className={`cap-dot cap-dot-${tier}`} />{tierLabel(tier, lang)}<strong>{tierCounts[tier]}</strong></button>)}
    </div>
    <p className="cap-note">{lang === "my" ? "Cap အုပ်စုများသည် coin ရွေးရလွယ်စေရန် စီထားခြင်းဖြစ်ပြီး real-time market-cap ranking မဟုတ်ပါ။" : "Cap groups are selection shortcuts, not a live market-cap ranking."}</p>

    <div className="portfolio-summary">
      <article><span>{lang === "my" ? "တွက်ထားသော P/L" : "Tracked P/L"}</span><strong className={trackedPnl >= 0 ? "change-positive" : "change-negative"}>{costedCount > 0 ? `${trackedPnl >= 0 ? "+" : ""}${fullUsd.format(trackedPnl)}` : "—"}</strong></article>
      <article><span>{lang === "my" ? "Cost basis ပါသော assets" : "Assets with cost basis"}</span><strong>{costedCount}<small> / {valued.length}</small></strong></article>
    </div>

    <section className="benchmark-panel" aria-labelledby="benchmark-heading">
      <div className="benchmark-heading"><div><p className="eyebrow">BENCHMARK</p><h2 id="benchmark-heading">{lang === "my" ? "Portfolio နှင့် BTC" : "Portfolio vs BTC"}</h2></div>{benchmark ? <span>{benchmark.holdings} {lang === "my" ? "holdings နှိုင်းယှဉ်ထား" : "holdings compared"}</span> : null}</div>
      {benchmark ? <><div className="benchmark-grid"><article><span>{lang === "my" ? "Portfolio return" : "Portfolio return"}</span><strong className={benchmark.portfolioReturn >= 0 ? "change-positive" : "change-negative"}>{benchmark.portfolioReturn >= 0 ? "+" : ""}{benchmark.portfolioReturn.toFixed(2)}%</strong><small>{fullUsd.format(benchmark.portfolioValue)}</small></article><article><span>{lang === "my" ? "တူညီငွေ BTC ဝယ်ထားလျှင်" : "Same cash in BTC"}</span><strong className={benchmark.btcReturn >= 0 ? "change-positive" : "change-negative"}>{benchmark.btcReturn >= 0 ? "+" : ""}{benchmark.btcReturn.toFixed(2)}%</strong><small>{fullUsd.format(benchmark.btcValue)}</small></article><article><span>{lang === "my" ? "BTC ထက်" : "Relative to BTC"}</span><strong className={benchmark.excess >= 0 ? "change-positive" : "change-negative"}>{benchmark.excess >= 0 ? "+" : ""}{benchmark.excess.toFixed(2)} pts</strong><small>{lang === "my" ? "စတင်ရက်တူ၊ ထည့်ငွေတူ" : "same dates and invested cash"}</small></article></div><p>{lang === "my" ? "ဝယ်ယူရက်နှင့် cost basis ရှိပြီး BTC history အတွင်းဝင်သော holdings များကိုသာ နှိုင်းထားသည်။" : "Uses only holdings with an acquisition date and cost basis that fall inside available BTC history."}</p></> : <div className="empty-panel"><strong>{lang === "my" ? "BTC benchmark တွက်ရန် ဝယ်ယူရက်လိုပါသည်" : "Acquisition dates are needed for a BTC benchmark"}</strong><span>{lang === "my" ? "Holding ကို ပြန်ထည့်ချိန်တွင် average cost နှင့် ဝယ်ယူရက်ကို ထည့်ပါ။" : "Re-save a holding with its average cost and acquisition date."}</span></div>}
    </section>

    <div className="asset-mode-switch" role="group" aria-label={lang === "my" ? "Coin ထည့်နည်း" : "Asset entry mode"}>
      <button type="button" aria-pressed={!customMode} onClick={() => setCustomMode(false)}>{lang === "my" ? "Live စာရင်းမှ" : "Live catalog"}</button>
      <button type="button" aria-pressed={customMode} onClick={() => setCustomMode(true)}>{lang === "my" ? "+ Coin အသစ် Manual" : "+ Add coin manually"}</button>
    </div>
    <form className={`holding-form${customMode ? " holding-form-custom" : ""}`} onSubmit={submit}>
      {customMode ? <>
        <label>{lang === "my" ? "Symbol" : "Symbol"}<input value={customSymbol} onChange={(event) => setCustomSymbol(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))} placeholder="e.g. TIA" aria-label={lang === "my" ? "Coin symbol" : "Coin symbol"} /></label>
        <label>{lang === "my" ? "Coin အမည်" : "Coin name"}<input value={customName} onChange={(event) => setCustomName(event.target.value.slice(0, 48))} placeholder="e.g. Celestia" aria-label={lang === "my" ? "Coin အမည်" : "Coin name"} /></label>
        <label>{lang === "my" ? "Cap အုပ်စု" : "Cap group"}<select value={customTier} onChange={(event) => setCustomTier(event.target.value === "large" ? "large" : event.target.value === "mid" ? "mid" : "low")}><option value="large">{tierLabel("large", lang)}</option><option value="mid">{tierLabel("mid", lang)}</option><option value="low">{tierLabel("low", lang)}</option></select></label>
        <label>{lang === "my" ? "လက်ရှိဈေး (USD)" : "Current price (USD)"}<input inputMode="decimal" value={manualPrice} onChange={(event) => setManualPrice(event.target.value)} placeholder="0.00" aria-label={lang === "my" ? "Manual လက်ရှိဈေး" : "Manual current price"} /></label>
      </> : <label>{lang === "my" ? "Coin ရွေးရန်" : "Choose coin"}<select value={symbol} onChange={(event) => setSymbol(event.target.value)}>{groupedCoins.map((group) => <optgroup key={group.tier} label={tierLabel(group.tier, lang)}>{group.coins.map((coin) => <option key={coin.symbol} value={coin.symbol}>{coin.symbol} · {coin.name}</option>)}</optgroup>)}</select></label>}
      <label>{lang === "my" ? "ပမာဏ" : "Quantity"}<input inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0.00" aria-label={lang === "my" ? "Coin ပမာဏ" : "Coin quantity"} /></label>
      <label>{lang === "my" ? "ပျမ်းမျှဝယ်ဈေး (USD၊ မလိုလျှင်ချန်ထား)" : "Average cost (USD, optional)"}<input inputMode="decimal" value={averageCost} onChange={(event) => setAverageCost(event.target.value)} placeholder="0.00" aria-label={lang === "my" ? "ပျမ်းမျှဝယ်ဈေး" : "Average cost"} /></label>
      <label>{lang === "my" ? "ဝယ်ယူရက် (BTC benchmark အတွက်)" : "Acquisition date (for BTC benchmark)"}<input type="date" value={acquiredOn} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setAcquiredOn(event.target.value)} aria-label={lang === "my" ? "ဝယ်ယူရက်" : "Acquisition date"} /></label>
      <button className="primary-button" type="submit" disabled={save.isPending || Number(quantity) <= 0 || (customMode && (!/^[A-Z0-9]{2,12}$/.test(customSymbol) || customName.trim().length < 2 || Number(manualPrice) <= 0))}>{save.isPending ? (lang === "my" ? "သိမ်းနေသည်…" : "Saving…") : (lang === "my" ? "Holding သိမ်းမည်" : "Save holding")}</button>
    </form>
    {customMode ? <p className="manual-price-note">{lang === "my" ? "Manual coin ဈေးသည် live feed မဟုတ်ပါ။ တန်ဖိုးမှန်ကန်စေရန် coin ကို ထပ်ရွေးပြီး လက်ရှိဈေးကို အချိန်မရွေး update လုပ်နိုင်သည်။" : "Manual prices are not live. Re-enter the same symbol anytime to update its current price and portfolio value."}</p> : null}

    <div className="holdings-toolbar"><strong>{tierFilter === "all" ? (lang === "my" ? "Holding အားလုံး" : "All holdings") : tierLabel(tierFilter, lang)}</strong>{tierFilter !== "all" ? <button type="button" onClick={() => setTierFilter("all")}>{lang === "my" ? "အားလုံးပြမည်" : "Show all"}</button> : null}</div>
    <div className="holding-list">{filteredHoldings.length > 0 ? filteredHoldings.map((item) => {
      const allocation = item.value !== null && totalValue > 0 ? (item.value / totalValue) * 100 : 0;
      return <article key={item.id}><div className="holding-identity"><span className={`cap-dot cap-dot-${item.coin?.tier ?? "low"}`} /><div><strong>{item.symbol} · {compactNumber.format(item.quantity)}</strong><span>{item.coin ? `${item.coin.name} · ${tierLabel(item.coin.tier, lang)}` : ""}{item.price !== null ? ` · ${fullUsd.format(item.price)} / coin` : ""}{item.isManual ? ` · ${lang === "my" ? "Manual ဈေး" : "Manual price"}` : ""}{item.acquiredOn ? ` · ${lang === "my" ? "ဝယ်ရက်" : "since"} ${formatDay(item.acquiredOn, lang)}` : ""}</span></div></div><div className="holding-value"><strong>{item.value === null ? "—" : fullUsd.format(item.value)}</strong><span className={item.pnl === null ? "" : item.pnl >= 0 ? "change-positive" : "change-negative"}>{item.price === null ? (lang === "my" ? "ဈေးမထည့်ထား" : "Price unavailable") : item.pnl === null ? (lang === "my" ? "Average cost မထည့်ထား" : "No average cost") : `${item.pnl >= 0 ? "+" : ""}${fullUsd.format(item.pnl)}`}</span>{item.value !== null ? <div className="allocation-track" aria-label={`${allocation.toFixed(1)}%`}><span style={{ width: `${allocation}%` }} /></div> : null}</div><button onClick={() => remove.mutate(item.id)} aria-label={`${item.symbol} ${lang === "my" ? "ဖျက်မည်" : "delete"}`}>×</button></article>;
    }) : <div className="empty-panel"><strong>{settings.holdings.length === 0 ? (lang === "my" ? "Holding မရှိသေးပါ" : "No holdings yet") : (lang === "my" ? "ဒီအုပ်စုမှာ holding မရှိသေးပါ" : "No holdings in this group")}</strong><span>{lang === "my" ? "အပေါ်က form နဲ့ ကိုယ့် portfolio ကို စတင်ထည့်နိုင်သည်။" : "Use the form above to start tracking your portfolio."}</span></div>}</div>
  </section>;
}

function NotificationControls({ settings, lang, onSettingsChange }: { settings: Settings; lang: Language; onSettingsChange: (settings: Settings) => void }) {
  const [permission, setPermission] = useState<string>(() => typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const save = useMutation({ mutationFn: (args: Settings["notifications"]) => api.setNotificationPreferences(args), onSuccess: onSettingsChange });
  async function enableDevice() {
    if (typeof Notification === "undefined") { setPermission("unsupported"); return; }
    try {
      const next = await Notification.requestPermission();
      setPermission(next);
      if (next === "granted") new Notification(lang === "my" ? "Crypto alert ဖွင့်ပြီးပါပြီ" : "Crypto alerts enabled", { body: lang === "my" ? "Dashboard ဖွင့်ထားစဉ် alert အသစ်များကို device notification ဖြင့် ပြမည်။" : "New alerts can appear as device notifications while the dashboard is open." });
    } catch { setPermission("unsupported"); }
  }
  const update = (key: keyof Settings["notifications"]) => save.mutate({ ...settings.notifications, [key]: !settings.notifications[key] });
  return <section className="feature-section notification-section" aria-labelledby="notification-heading"><div className="section-heading"><div><p className="eyebrow">NOTIFICATIONS</p><h2 id="notification-heading">{lang === "my" ? "Device notifications" : "Device notifications"}</h2></div><span className="permission-chip">{permission}</span></div><p className="section-description">{lang === "my" ? "Dashboard ဖွင့်ထားစဉ် alert အသစ်များကို device notification အဖြစ် ပြရန် browser permission လိုအပ်သည်။" : "Browser permission is required to show device notifications for new alerts while this dashboard is open."}</p><button className="notification-permission" onClick={() => void enableDevice()} disabled={permission === "granted"}>{permission === "granted" ? (lang === "my" ? "Permission ရပြီး" : "Permission granted") : (lang === "my" ? "Notification ခွင့်ပြုမည်" : "Allow notifications")}</button><div className="notification-toggles"><button aria-pressed={settings.notifications.priceAlerts} onClick={() => update("priceAlerts")}>Price alerts <span>{settings.notifications.priceAlerts ? "ON" : "OFF"}</span></button><button aria-pressed={settings.notifications.marketAlerts} onClick={() => update("marketAlerts")}>Fear & Greed <span>{settings.notifications.marketAlerts ? "ON" : "OFF"}</span></button><button aria-pressed={settings.notifications.signalAlerts} onClick={() => update("signalAlerts")}>Trading signals <span>{settings.notifications.signalAlerts ? "ON" : "OFF"}</span></button><button aria-pressed={settings.notifications.weeklyDigest} onClick={() => update("weeklyDigest")}>Weekly digest <span>{settings.notifications.weeklyDigest ? "ON" : "OFF"}</span></button></div></section>;
}

function WatchlistAndAlerts({ data, settings, lang, onSettingsChange, onRefresh }: { data: Dashboard; settings: Settings; lang: Language; onSettingsChange: (settings: Settings) => void; onRefresh: () => void }) {
  const t = copy[lang];
  const [alertSymbol, setAlertSymbol] = useState("BTC");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");
  const setWatchlist = useMutation({ mutationFn: (args: { symbol: string; selected: boolean }) => api.setWatchlistItem(args), onSuccess: onSettingsChange });
  const addAlert = useMutation({ mutationFn: (args: { symbol: string; direction: "above" | "below"; targetPrice: number }) => api.addPriceAlert(args), onSuccess: (result) => { onSettingsChange(result); setTarget(""); onRefresh(); } });
  const deleteAlert = useMutation({ mutationFn: (id: number) => api.deletePriceAlert({ id }), onSuccess: onSettingsChange });
  const setMarketAlerts = useMutation({ mutationFn: (args: { extremeFear: boolean; extremeGreed: boolean }) => api.setMarketAlerts(args), onSuccess: (result) => { onSettingsChange(result); onRefresh(); } });
  const dismissMarketAlert = useMutation({ mutationFn: (id: number) => api.dismissMarketAlertEvent({ id }), onSuccess: onSettingsChange });
  const watchedQuotes = settings.watchlist.flatMap((symbol) => { const quote = data.quotes.find((item) => item.symbol === symbol); return quote ? [quote] : []; });
  const currentAlertQuote = data.quotes.find((item) => item.symbol === alertSymbol);
  function submitAlert(event: FormEvent) { event.preventDefault(); const value = Number(target); if (!Number.isFinite(value) || value <= 0) return; addAlert.mutate({ symbol: alertSymbol, direction, targetPrice: value }); }
  return (
    <>
      <PortfolioTracker data={data} settings={settings} lang={lang} onSettingsChange={onSettingsChange} />
      <div className="feature-grid">
      <section className="feature-section" aria-labelledby="watchlist-heading"><div className="section-heading"><div><p className="eyebrow">WATCHLIST</p><h1 id="watchlist-heading">{t.watchedCoins}</h1></div><span className="history-count">{t.selectedCount(settings.watchlist.length)}</span></div><p className="section-description">{t.watchDescription}</p><div className="coin-picker" role="group" aria-label={t.watchPicker}>{settings.supportedCoins.map((coin) => { const selected = settings.watchlist.includes(coin.symbol); return <button key={coin.symbol} aria-pressed={selected} onClick={() => setWatchlist.mutate({ symbol: coin.symbol, selected: !selected })} disabled={setWatchlist.isPending}>{coin.symbol}<span>{selected ? "✓" : "+"}</span></button>; })}</div><div className="watchlist-quotes">{watchedQuotes.length > 0 ? watchedQuotes.map((quote) => <QuoteRow compact key={quote.symbol} quote={quote} />) : <div className="empty-panel"><strong>{t.emptyWatch}</strong><span>{t.chooseCoin}</span></div>}</div></section>
      <section className="feature-section" aria-labelledby="alerts-heading"><div className="section-heading"><div><p className="eyebrow">ALERTS</p><h2 id="alerts-heading">{t.marketAlerts}</h2></div></div><div className="market-alert-panel"><div><strong>{t.extremeTitle}</strong><span>{t.extremeHelp}</span></div><div className="market-alert-toggles" role="group" aria-label={t.extremeTitle}><button aria-pressed={settings.marketAlerts.extremeFear} disabled={setMarketAlerts.isPending} onClick={() => setMarketAlerts.mutate({ extremeFear: !settings.marketAlerts.extremeFear, extremeGreed: settings.marketAlerts.extremeGreed })}>Extreme Fear <span>{settings.marketAlerts.extremeFear ? "ON" : "OFF"}</span></button><button aria-pressed={settings.marketAlerts.extremeGreed} disabled={setMarketAlerts.isPending} onClick={() => setMarketAlerts.mutate({ extremeFear: settings.marketAlerts.extremeFear, extremeGreed: !settings.marketAlerts.extremeGreed })}>Extreme Greed <span>{settings.marketAlerts.extremeGreed ? "ON" : "OFF"}</span></button></div>{settings.marketAlertEvents.length > 0 ? <div className="market-alert-events">{settings.marketAlertEvents.map((event) => <article key={event.id} role="status"><div><strong>{event.kind === "extreme_fear" ? "Extreme Fear" : "Extreme Greed"} {t.arrived}</strong><span>Fear & Greed {event.fearGreed} · Market Pulse {event.score} · {formatTime(event.triggeredAt, lang)}</span></div><button onClick={() => dismissMarketAlert.mutate(event.id)} aria-label={t.dismiss}>{t.dismiss}</button></article>)}</div> : null}</div><div className="subsection-heading"><strong>{t.priceAlert}</strong><span>{t.targetHelp}</span></div><form className="alert-form" onSubmit={submitAlert}><label>Coin<select value={alertSymbol} onChange={(event) => setAlertSymbol(event.target.value)}>{settings.supportedCoins.map((coin) => <option key={coin.symbol} value={coin.symbol}>{coin.symbol}</option>)}</select></label><label>{t.condition}<select value={direction} onChange={(event) => setDirection(event.target.value === "below" ? "below" : "above")}><option value="above">{t.above}</option><option value="below">{t.below}</option></select></label><label className="alert-price-field">{t.targetUsd}<input inputMode="decimal" value={target} onChange={(event) => setTarget(event.target.value)} placeholder={currentAlertQuote ? String(currentAlertQuote.price.toFixed(2)) : "0.00"} aria-label={t.targetUsd} /></label><button className="primary-button" type="submit" disabled={addAlert.isPending || Number(target) <= 0}>{addAlert.isPending ? t.saving : t.addAlert}</button></form><p className="form-note">{t.alertNote}</p><div className="alert-list">{settings.alerts.length > 0 ? settings.alerts.map((alert) => <article className="alert-row" key={alert.id}><div><strong>{alert.symbol} {alert.direction === "above" ? "≥" : "≤"} {fullUsd.format(alert.targetPrice)}</strong><span className={alert.active ? "alert-active" : "alert-triggered"}>{alert.active ? t.monitoring : `${t.triggered}${alert.triggeredPrice ? ` · ${fullUsd.format(alert.triggeredPrice)}` : ""}`}</span></div><button onClick={() => deleteAlert.mutate(alert.id)} aria-label={`${alert.symbol} ${t.delete}`}>{t.delete}</button></article>) : <div className="empty-panel"><strong>{t.noAlerts}</strong><span>{t.addTarget}</span></div>}</div></section>
      </div>
      <NotificationControls settings={settings} lang={lang} onSettingsChange={onSettingsChange} />
    </>
  );
}

function NewsAndWhales({ data, lang }: { data: Dashboard; lang: Language }) {
  const t = copy[lang];
  const total = Math.max(data.newsSentiment.total, 1);
  return (
    <div className="feature-grid feature-grid-wide">
      <section className="feature-section" aria-labelledby="news-heading">
        <div className="section-heading">
          <div><p className="eyebrow">NEWS SENTIMENT</p><h1 id="news-heading">{t.cryptoNews}</h1></div>
          <span className="history-count">{t.stories(data.newsSentiment.total)}</span>
        </div>
        <div className="source-roster" aria-label={t.configuredSources}>
          <span>{t.configuredSources}</span>
          <div>{data.configuredNewsSources.map((source) => <strong key={source}>{source}</strong>)}</div>
        </div>
        {data.newsSentiment.total > 0 ? <>
          <div className="sentiment-strip" aria-label={`${t.positive} ${data.newsSentiment.positive}, ${t.neutral} ${data.newsSentiment.neutral}, ${t.negative} ${data.newsSentiment.negative}, ${t.unclassified} ${data.newsSentiment.unclassified}`}>
            <span className="sentiment-positive" style={{ width: `${(data.newsSentiment.positive / total) * 100}%` }} />
            <span className="sentiment-neutral" style={{ width: `${(data.newsSentiment.neutral / total) * 100}%` }} />
            <span className="sentiment-negative" style={{ width: `${(data.newsSentiment.negative / total) * 100}%` }} />
            <span className="sentiment-unclassified" style={{ width: `${(data.newsSentiment.unclassified / total) * 100}%` }} />
          </div>
          <div className="sentiment-counts"><span>{t.positive} {data.newsSentiment.positive}</span><span>{t.neutral} {data.newsSentiment.neutral}</span><span>{t.negative} {data.newsSentiment.negative}</span>{data.newsSentiment.unclassified > 0 ? <span>{t.unclassified} {data.newsSentiment.unclassified}</span> : null}</div>
          <div className="news-list">{data.news.map((item, index) => <article className="news-row" key={`${item.headline}-${index}`}><div className={`sentiment-dot sentiment-${item.sentiment}`} aria-label={item.sentiment} /><div>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.headline}</a> : <strong>{item.headline}</strong>}<p>{lang === "my" ? item.summaryMm ?? item.summaryEn : item.summaryEn}</p><span>{item.source}{item.publishedAt ? ` · ${formatTime(item.publishedAt, lang)}` : ""}</span></div></article>)}</div>
        </> : <div className="empty-panel"><strong>{t.noNews}</strong><span>{t.noNewsHelp}</span></div>}
      </section>

      <section className="feature-section" aria-labelledby="whales-heading">
        <div className="section-heading"><div><p className="eyebrow">BITCOIN MEMPOOL</p><h2 id="whales-heading">{t.whaleActivity}</h2></div></div>
        <p className="section-description">{t.whaleDescription(data.whaleThresholdBtc)}</p>
        <div className="whale-list">{data.whales.length > 0 ? data.whales.map((whale) => <article className="whale-row" key={whale.hash}><div><strong>{compactNumber.format(whale.btc)} BTC</strong><span>{formatTime(whale.time, lang)}</span></div><code title={whale.hash}>{whale.hash.slice(0, 8)}…{whale.hash.slice(-6)}</code></article>) : <div className="empty-panel"><strong>{t.noWhales}</strong><span>{t.whaleSnapshot(data.whaleThresholdBtc)}</span></div>}</div>
        <div className="whale-coverage-heading"><p className="eyebrow">SOURCE COVERAGE</p><h3>{t.whaleCoverage}</h3><p>{t.whaleCoverageHelp}</p></div>
        {data.whaleCoverage.length > 0 ? <div className="news-list whale-news-list">{data.whaleCoverage.map((item, index) => <article className="news-row" key={`${item.headline}-${index}`}><div className={`sentiment-dot sentiment-${item.sentiment}`} aria-label={item.sentiment} /><div>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.headline}</a> : <strong>{item.headline}</strong>}<p>{lang === "my" ? item.summaryMm ?? item.summaryEn : item.summaryEn}</p><span>{item.source}{item.publishedAt ? ` · ${formatTime(item.publishedAt, lang)}` : ""}</span></div></article>)}</div> : <p className="coverage-empty">{t.noWhaleCoverage}</p>}
      </section>
    </div>
  );
}

function formatOptional(value: number | null, formatter: (value: number) => string) {
  return value === null ? "—" : formatter(value);
}

function MarketIntelligence({ data, lang, onRefresh, refreshing, refreshMessage }: { data: Dashboard; lang: Language; onRefresh: () => void; refreshing: boolean; refreshMessage: string | null }) {
  const t = copy[lang];
  const status = data.marketIntelligenceStatus;
  const derivativeSources = [...new Set(data.derivatives.map((item) => item.source))];
  const emptyMessage = (feedStatus: "ok" | "empty" | "unavailable" | undefined) => feedStatus === "empty" ? t.noUpcomingEvents : t.sourceUnavailable;
  const savedWarning = (feedStatus: "ok" | "empty" | "unavailable" | undefined, hasRows: boolean) => feedStatus === "unavailable" && hasRows ? <p className="feed-warning" role="status">{t.savedWhileUnavailable}</p> : null;
  return <div className="intel-layout">
    <section className="feature-section intel-heading" aria-labelledby="intel-heading">
      <div><p className="eyebrow">MARKET INTELLIGENCE</p><h1 id="intel-heading">{lang === "my" ? "Derivatives၊ Macro နှင့် On-chain" : "Derivatives, macro & on-chain"}</h1><p className="section-description">{lang === "my" ? "Leverage အနေအထား၊ US macro event များနှင့် Bitcoin network signal များ။" : "Leverage positioning, US macro events, and Bitcoin network signals."}</p></div>
      <div className="intel-refresh-wrap"><button className="refresh-button" onClick={onRefresh} disabled={refreshing} aria-label={t.refreshMarkets}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5M18.2 9A7 7 0 0 0 6.4 6.4L4 9m16 6-2.4 2.6A7 7 0 0 1 5.8 15" /></svg><span>{refreshing ? t.refreshingMarkets : t.refreshMarkets}</span></button>{status?.refreshedAt ? <span className="intel-checked">{t.checked} · {formatTime(status.refreshedAt, lang)}</span> : null}</div>
    </section>
    {refreshMessage ? <div className="status-banner" role="status">{refreshMessage}</div> : null}
    <section className="intel-card" aria-labelledby="derivatives-heading"><div className="intel-card-head"><div><p className="eyebrow">PERPETUALS</p><h2 id="derivatives-heading">Funding rates & open interest</h2></div><span>{derivativeSources.length > 0 ? derivativeSources.join(" · ") : "Binance / OKX"}</span></div>{savedWarning(status?.derivatives, data.derivatives.length > 0)}{data.derivatives.length > 0 ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Asset</th><th>Mark</th><th>Funding</th><th>Open interest</th><th>Next funding</th></tr></thead><tbody>{data.derivatives.map((item) => <tr key={item.symbol}><td><strong>{item.symbol}</strong><small>{item.source}</small></td><td>{fullUsd.format(item.markPrice)}</td><td><span className={item.fundingRate > 0 ? "change-positive" : item.fundingRate < 0 ? "change-negative" : ""}>{(item.fundingRate * 100).toFixed(4)}%</span></td><td>{compactUsd.format(item.openInterestUsd)}</td><td>{formatTime(item.nextFundingTime, lang)}</td></tr>)}</tbody></table></div> : <div className="empty-panel"><strong>{emptyMessage(status?.derivatives)}</strong></div>}</section>
    <section className="intel-card" aria-labelledby="etf-heading">
      <div className="intel-card-head"><div><p className="eyebrow">US SPOT ETFs</p><h2 id="etf-heading">{lang === "my" ? "BTC / ETH နေ့စဉ် ETF စီးဝင်/စီးထွက်" : "BTC / ETH daily ETF flows"}</h2></div><span>{lang === "my" ? "Net flow" : "Net flow"}</span></div>
      {savedWarning(status?.etfFlows, data.etfFlows.length > 0)}
      {data.etfFlows.length > 0 ? <div className="etf-flow-list">{data.etfFlows.map((item) => <article key={`${item.date}-${item.asset}`}><time dateTime={item.date}>{formatDay(item.date, lang)}</time><strong>{item.asset}</strong><span className={item.netFlowUsd >= 0 ? "change-positive" : "change-negative"}>{item.netFlowUsd >= 0 ? "+" : ""}{compactUsd.format(item.netFlowUsd)}</span><a href={item.url} target="_blank" rel="noreferrer">{item.source} ↗</a></article>)}</div> : <div className="empty-panel"><strong>{status?.etfFlows === "unavailable" ? t.sourceUnavailable : (lang === "my" ? "အတည်ပြုနိုင်သော နေ့စဉ် flow မတွေ့ပါ" : "No verified daily flow was found")}</strong><span>{lang === "my" ? "Refresh လုပ်ပြီး နောက်ဆုံး aggregate report ကို ထပ်စစ်ပါ။" : "Refresh to check for the latest aggregate report."}</span></div>}
    </section>
    <section className="intel-card" aria-labelledby="liquidation-heading">
      <div className="intel-card-head"><div><p className="eyebrow">BTC LIQUIDATIONS</p><h2 id="liquidation-heading">{lang === "my" ? "Liquidation heat levels" : "Liquidation heat levels"}</h2></div><span>{lang === "my" ? "ထုတ်ပြန်ထားသော cluster များ" : "Published clusters"}</span></div>
      {savedWarning(status?.liquidations, data.liquidationLevels.length > 0)}
      {data.liquidationLevels.length > 0 ? <><div className="liquidation-chart" role="img" aria-label={lang === "my" ? "BTC liquidation level magnitude ဇယား" : "BTC liquidation level magnitude chart"}><ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={data.liquidationLevels.map((item) => ({ ...item, priceLabel: fullUsd.format(item.priceUsd) }))} margin={{ top: 8, right: 20, bottom: 18, left: 18 }}><CartesianGrid horizontal={false} stroke="var(--chart-grid)" strokeDasharray="3 6" /><XAxis type="number" domain={[0, "dataMax"]} tickFormatter={(value: number) => compactUsd.format(value)} tick={{ fill: "var(--dim)", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="priceLabel" width={78} tick={{ fill: "var(--text)", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [compactUsd.format(Number(value)), lang === "my" ? "Liquidation ပမာဏ" : "Liquidation magnitude"]} contentStyle={{ background: "var(--surface-strong)", border: "1px solid var(--border)", borderRadius: 9, fontSize: 11 }} /><Bar dataKey="magnitudeUsd" name="Liquidations" radius={[0, 5, 5, 0]}>{data.liquidationLevels.map((item, index) => <Cell key={`${item.priceUsd}-${index}`} fill={item.side === "long_below" ? "#e4635b" : "#2fb481"} />)}</Bar></BarChart></ResponsiveContainer></div><div className="liquidation-level-list">{data.liquidationLevels.map((item) => <a key={`${item.priceUsd}-${item.side}`} href={item.url} target="_blank" rel="noreferrer"><i className={item.side === "long_below" ? "long-level" : "short-level"} /><span>{item.side === "long_below" ? (lang === "my" ? "Longs အောက်ဘက်" : "Longs below") : (lang === "my" ? "Shorts အပေါ်ဘက်" : "Shorts above")} · {item.timeframe}</span><strong>{fullUsd.format(item.priceUsd)} · {compactUsd.format(item.magnitudeUsd)}</strong><small>{item.source}</small></a>)}</div></> : <div className="empty-panel"><strong>{status?.liquidations === "unavailable" ? t.sourceUnavailable : (lang === "my" ? "ပမာဏပါသော liquidation cluster မတွေ့ပါ" : "No quantified liquidation cluster was found")}</strong><span>{lang === "my" ? "အတု level မဖြည့်ထားပါ။ Refresh လုပ်၍ public report အသစ်ကို စစ်နိုင်သည်။" : "No synthetic levels are shown. Refresh to check new public reports."}</span></div>}
    </section>
    <section className="intel-card" aria-labelledby="onchain-heading"><div className="intel-card-head"><div><p className="eyebrow">BITCOIN NETWORK</p><h2 id="onchain-heading">On-chain signals</h2></div><span>{data.onChain?.source ?? "Coin Metrics Community"}</span></div>{data.onChain ? <><div className="metric-grid"><div><span>MVRV</span><strong>{formatOptional(data.onChain.mvrv, (value) => value.toFixed(2))}</strong></div><div><span>Exchange netflow</span><strong>{formatOptional(data.onChain.exchangeNetflowBtc, (value) => `${value >= 0 ? "+" : ""}${compactNumber.format(value)} BTC`)}</strong></div><div><span>Active addresses</span><strong>{formatOptional(data.onChain.activeAddresses, (value) => compactNumber.format(value))}</strong></div><div><span>Transactions</span><strong>{formatOptional(data.onChain.transactions, (value) => compactNumber.format(value))}</strong></div></div><p className="intel-note">{lang === "my" ? "Netflow အပေါင်းဆိုလျှင် exchange ထဲဝင်သည့် BTC က ပိုများပြီး အနုတ်ဆိုလျှင် ထွက်သည့် BTC က ပိုများသည်။" : "Positive netflow means more BTC moved into tracked exchanges; negative means more moved out."} · {formatTime(data.onChain.asOf, lang)}</p></> : <div className="empty-panel"><strong>{t.sourceUnavailable}</strong></div>}</section>
    <section className="intel-card" aria-labelledby="economic-heading"><div className="intel-card-head"><div><p className="eyebrow">NEXT 35 DAYS</p><h2 id="economic-heading">Economic calendar</h2></div><span>US macro</span></div>{savedWarning(status?.economicCalendar, data.economicCalendar.length > 0)}{data.economicCalendar.length > 0 ? <div className="event-list">{data.economicCalendar.map((item) => <article key={`${item.date}-${item.title}`} className="event-row"><time dateTime={item.date}>{formatDay(item.date, lang)}</time><div><div className="event-title-line"><h3>{item.title}</h3><span className={`importance ${item.importance}`}>{item.importance}</span></div><p>{lang === "my" ? item.whyItMattersMm : item.whyItMattersEn}</p><a href={item.url} target="_blank" rel="noreferrer">{item.source} ↗</a></div></article>)}</div> : <div className="empty-panel"><strong>{emptyMessage(status?.economicCalendar)}</strong></div>}</section>
    <section className="intel-card" aria-labelledby="unlock-heading"><div className="intel-card-head"><div><p className="eyebrow">SUPPLY EVENTS</p><h2 id="unlock-heading">Token unlock calendar</h2></div><span>Verified search</span></div>{savedWarning(status?.tokenUnlocks, data.tokenUnlocks.length > 0)}{data.tokenUnlocks.length > 0 ? <div className="event-list">{data.tokenUnlocks.map((item) => <article key={`${item.date}-${item.token}`} className="event-row"><time dateTime={item.date}>{formatDay(item.date, lang)}</time><div><div className="event-title-line"><h3>{item.token}</h3><span className="amount-badge">{item.amount}</span></div><p>{lang === "my" ? item.noteMm : item.noteEn}</p><a href={item.url} target="_blank" rel="noreferrer">{item.source} ↗</a></div></article>)}</div> : <div className="empty-panel"><strong>{emptyMessage(status?.tokenUnlocks)}</strong></div>}</section>
  </div>;
}

function TradingSignals({ lang, settings, onSettingsChange }: { lang: Language; settings: Settings; onSettingsChange: (settings: Settings) => void }) {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState<"BTC" | "ETH" | "SOL">("BTC");
  const [timeframe, setTimeframe] = useState<"1H" | "4H" | "1D">("1D");
  const query = useQuery({ queryKey: ["trading-signal", symbol], queryFn: () => api.getTradingSignal({ symbol }), staleTime: 15 * 60 * 1000 });
  const refresh = useMutation({ mutationFn: () => api.refreshTradingSignal({ symbol }), onSuccess: async (next) => { queryClient.setQueryData(["trading-signal", symbol], next); onSettingsChange(await api.getSettings({})); } });
  const result = refresh.data ?? query.data;
  const data = result?.data ?? null;
  const signalLabel = (value: "buy" | "neutral" | "sell") => value === "buy" ? (lang === "my" ? "ဝယ်ဘက်" : "Buy") : value === "sell" ? (lang === "my" ? "ရောင်းဘက်" : "Sell") : (lang === "my" ? "တည်ငြိမ်" : "Neutral");
  const verdictLabel = (value: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell") => ({ strong_buy: lang === "my" ? "အားကောင်းသော ဝယ်ဘက်" : "Strong buy", buy: lang === "my" ? "ဝယ်ဘက်" : "Buy", neutral: lang === "my" ? "တည်ငြိမ်" : "Neutral", sell: lang === "my" ? "ရောင်းဘက်" : "Sell", strong_sell: lang === "my" ? "အားကောင်းသော ရောင်းဘက်" : "Strong sell" }[value]);
  const dismissSignalEvent = useMutation({ mutationFn: (id: number) => api.dismissTradingSignalEvent({ id }), onSuccess: onSettingsChange });
  useEffect(() => {
    if (!settings.notifications.signalAlerts || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    for (const event of settings.signalEvents) {
      try {
        const key = `crypto-signal-alert-${event.id}`;
        if (window.localStorage.getItem(key)) continue;
        new Notification(`${event.symbol} · ${verdictLabel(event.newVerdict as "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell")}`, { body: `${event.previousVerdict.replaceAll("_", " ")} → ${event.newVerdict.replaceAll("_", " ")} · ${event.confidence}%` });
        window.localStorage.setItem(key, "shown");
      } catch { /* Alert remains visible in-app. */ }
    }
  }, [lang, settings.notifications.signalAlerts, settings.signalEvents]);
  if (query.isPending && !data) return <section className="update-state" aria-live="polite"><div className="loader" /><p>{lang === "my" ? "Trading signal တွက်ချက်နေသည်…" : "Calculating trading signals…"}</p></section>;
  if (!data) return <section className="update-state"><p className="eyebrow">TRADING SIGNALS</p><h1>{lang === "my" ? "Signal မရနိုင်သေးပါ" : "Trading signal is unavailable"}</h1><button className="primary-button" onClick={() => void query.refetch()}>{copy[lang].retry}</button></section>;
  const selectedTimeframe = data.timeframes ? timeframe === "1H" ? data.timeframes.oneHour : timeframe === "4H" ? data.timeframes.fourHour : data.timeframes.oneDay : null;
  const selectedIndicators = selectedTimeframe?.indicators ?? data.indicators;
  const indicators = [
    { name: "RSI (14)", detail: lang === "my" ? "30 အောက် oversold · 70 အထက် overbought" : "Below 30 oversold · above 70 overbought", value: selectedIndicators.rsi.value.toFixed(2), signal: selectedIndicators.rsi.signal },
    { name: "MACD (12, 26, 9)", detail: `MACD ${selectedIndicators.macd.macd.toFixed(3)} · Signal ${selectedIndicators.macd.signalLine.toFixed(3)} · Hist ${selectedIndicators.macd.histogram.toFixed(3)}`, value: selectedIndicators.macd.histogram.toFixed(3), signal: selectedIndicators.macd.signal },
    { name: "SMA crossover", detail: `SMA20 ${fullUsd.format(selectedIndicators.movingAverage.fast)} · SMA50 ${fullUsd.format(selectedIndicators.movingAverage.slow)}`, value: selectedIndicators.movingAverage.fast > selectedIndicators.movingAverage.slow ? "20 > 50" : "20 ≤ 50", signal: selectedIndicators.movingAverage.signal },
  ];
  return <div className="trading-page"><header className="trading-hero"><div><p className="eyebrow">TECHNICAL + AI</p><h1>{lang === "my" ? "Trading အချက်ပြများ" : "Trading Signals"}</h1><p>{lang === "my" ? "1H၊ 4H၊ 1D RSI၊ MACD၊ moving-average crossover နှင့် စျေးနှုန်း၊ သတင်း၊ on-chain context ကိုပေါင်းစပ်ထားသည်။" : "1H, 4H, and 1D RSI, MACD, and moving-average signals combined with price, news, and on-chain context."}</p></div><div className="signal-asset-picker" aria-label="Signal asset">{(["BTC", "ETH", "SOL"] as const).map((item) => <button key={item} onClick={() => setSymbol(item)} aria-pressed={symbol === item}>{item}</button>)}</div></header><div className="signal-toolbar"><p>{copy[lang].updated} · {formatTime(data.generatedAt, lang)} · Market {formatTime(data.marketAsOf, lang)}</p><button className="refresh-button" onClick={() => refresh.mutate()} disabled={refresh.isPending}>{refresh.isPending ? copy[lang].refreshing : copy[lang].refresh}</button></div>{result?.status === "stale" ? <div className="status-banner">{lang === "my" ? result.message : result.messageEn}</div> : null}{settings.signalEvents.length > 0 ? <section className="signal-alert-list" aria-label={lang === "my" ? "Signal ပြောင်းလဲမှုများ" : "Signal changes"}>{settings.signalEvents.map((event) => <article key={event.id} role="status"><div><strong>{event.symbol} · {event.previousVerdict.replaceAll("_", " ")} → {event.newVerdict.replaceAll("_", " ")}</strong><span>{lang === "my" ? `ယုံကြည်မှု ${event.confidence}% · ${formatTime(event.triggeredAt, lang)}` : `Confidence ${event.confidence}% · ${formatTime(event.triggeredAt, lang)}`}</span></div><button onClick={() => dismissSignalEvent.mutate(event.id)}>{lang === "my" ? "ပိတ်မည်" : "Dismiss"}</button></article>)}</section> : null}<section className={`signal-verdict verdict-${data.verdict}`}><div className="verdict-mark"><span>{data.symbol} · {data.name}</span><strong>{verdictLabel(data.verdict)}</strong><small>{sentimentForScore(data.aiScore)} · AI {data.aiScore}/100</small></div><div className="verdict-price"><span>{lang === "my" ? "စျေးနှုန်း" : "Price"}</span><strong>{fullUsd.format(data.price)}</strong><Change value={data.changePct} /></div><div className="signal-score-track" aria-label={`AI score ${data.aiScore} out of 100`}><span style={{ width: `${data.aiScore}%` }} /></div><div className="signal-score-labels"><span>Sell</span><strong>{lang === "my" ? `ယုံကြည်မှု ${data.confidence}%` : `Confidence ${data.confidence}%`}</strong><span>Buy</span></div></section><div className="signal-detail-grid"><section className="feature-section"><div className="section-heading"><div><p className="eyebrow">TECHNICALS</p><h2>{lang === "my" ? "Indicator အချက်ပြများ" : "Indicator signals"}</h2></div><span className="technical-score">{selectedTimeframe?.technicalScore ?? data.technicalScore}/100</span></div>{data.timeframes ? <div className="timeframe-switch" role="group" aria-label={lang === "my" ? "Signal အချိန်ကာလ" : "Signal timeframe"}>{(["1H", "4H", "1D"] as const).map((item) => { const frame = item === "1H" ? data.timeframes?.oneHour : item === "4H" ? data.timeframes?.fourHour : data.timeframes?.oneDay; return <button key={item} aria-pressed={timeframe === item} onClick={() => setTimeframe(item)}><strong>{item}</strong><span className={`indicator-${frame?.verdict ?? "neutral"}`}>{frame ? signalLabel(frame.verdict) : "—"}</span></button>; })}</div> : <p className="form-note">{lang === "my" ? "Cached signal အဟောင်းတွင် 1D data သာရှိသည်။ Refresh လုပ်ပြီး multi-timeframe data ယူပါ။" : "This saved signal contains daily data only. Refresh for multi-timeframe analysis."}</p>}<div className="indicator-list">{indicators.map((item) => <article key={item.name}><div><strong>{item.name}</strong><span>{item.detail}</span></div><b>{item.value}</b><em className={`indicator-${item.signal}`}>{signalLabel(item.signal)}</em></article>)}</div></section><section className="feature-section"><p className="eyebrow">CONTEXT</p><h2>{lang === "my" ? "AI ထည့်သွင်းချက်များ" : "AI inputs"}</h2><div className="signal-input-list"><article><span>News sentiment</span><strong>{data.news.score ?? "—"}</strong><small>{data.news.total} stories</small></article><article><span>On-chain</span><strong>{data.onChain.score ?? "—"}</strong><small>{localized({ mm: data.onChain.detailMm, en: data.onChain.detailEn }, lang)}</small></article></div></section></div><section className="signal-analysis"><p className="eyebrow">ASSESSMENT</p><h2>{lang === "my" ? "AI သုံးသပ်ချက်" : "AI assessment"}</h2><p>{localized(data.rationale, lang)}</p><div><strong>{lang === "my" ? "သတိပြုရန်" : "Caution"}</strong><p>{localized(data.caution, lang)}</p></div></section><p className="signal-method-note">{lang === "my" ? "Signal များသည် အချက်အလက်ဆိုင်ရာ သုံးသပ်ချက်သာဖြစ်ပြီး ရင်းနှီးမြှုပ်နှံမှုအကြံပြုချက် မဟုတ်ပါ။" : "Signals are informational analysis, not investment advice."} · {data.sources.join(" · ")}</p></div>;
}

function WeeklyDigest({ lang, notificationsEnabled }: { lang: Language; notificationsEnabled: boolean }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["weekly-market-digest"], queryFn: () => api.getWeeklyMarketDigest({}), staleTime: 60 * 60 * 1000 });
  const refresh = useMutation({ mutationFn: () => api.refreshWeeklyMarketDigest({}), onSuccess: (next) => queryClient.setQueryData(["weekly-market-digest"], next) });
  const result = refresh.data ?? query.data;
  const data = result?.data ?? null;
  useEffect(() => {
    if (!notificationsEnabled || !data || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      const key = `crypto-weekly-digest-${data.generatedAt}`;
      if (window.localStorage.getItem(key)) return;
      new Notification(lang === "my" ? "Weekly Market Digest အသစ်" : "New Weekly Market Digest", { body: localized(data.headline, lang) });
      window.localStorage.setItem(key, "shown");
    } catch { /* The report remains available in-app. */ }
  }, [data, lang, notificationsEnabled]);
  if (query.isPending && !data) return <section className="update-state" aria-live="polite"><div className="loader" /><p>{lang === "my" ? "Weekly Digest ဖန်တီးနေသည်…" : "Generating the Weekly Digest…"}</p></section>;
  if (!data) return <section className="update-state"><p className="eyebrow">WEEKLY DIGEST</p><h1>{lang === "my" ? "Weekly Digest မရနိုင်သေးပါ" : "Weekly Digest is unavailable"}</h1><button className="primary-button" onClick={() => void query.refetch()}>{copy[lang].retry}</button></section>;
  return <div className="market-update-page"><header className="update-hero"><div><p className="eyebrow">WEEKLY DIGEST</p><h1>{localized(data.headline, lang)}</h1><p className="update-deck">{localized(data.deck, lang)}</p></div><div className="snapshot-stamp"><span>{copy[lang].generated} · {formatTime(data.generatedAt, lang)}</span><strong>7D · {data.endScore}/100</strong></div></header><div className="daily-brief-toolbar"><p>{lang === "my" ? "အပတ်စဉ် အလိုအလျောက်ထုတ်ပေးပြီး လိုချင်သည့်အချိန်တွင်လည်း ပြန်ယူနိုင်သည်။" : "Generated automatically each week, with an on-demand refresh."}</p><button className="refresh-button" onClick={() => refresh.mutate()} disabled={refresh.isPending}>{refresh.isPending ? copy[lang].refreshing : copy[lang].refresh}</button></div>{result?.status === "stale" ? <div className="status-banner">{lang === "my" ? result.message : result.messageEn}</div> : null}<section className="update-section"><div className="report-section-heading"><span>01</span><div><p className="eyebrow">7-DAY REVIEW</p><h2>{lang === "my" ? "တစ်ပတ်စာ ပြောင်းလဲမှု" : "The week in review"}</h2></div></div><div className="report-metrics"><article><strong>{fullUsd.format(data.btcEndPrice)}</strong><span>BTC · {data.btcWeeklyChangePct >= 0 ? "+" : ""}{data.btcWeeklyChangePct.toFixed(2)}% / 7d</span></article><article><strong>{data.startScore} → {data.endScore}</strong><span>Market Pulse</span></article><article><strong>{fullUsd.format(data.btcStartPrice)}</strong><span>{lang === "my" ? "အပတ်အစ BTC" : "Week-start BTC"}</span></article></div><div className="daily-takeaways">{data.weekInReview.map((item, index) => <article key={index}><span>0{index + 1}</span><p>{localized(item, lang)}</p></article>)}</div></section><section className="update-section"><div className="report-section-heading"><span>02</span><div><p className="eyebrow">STRUCTURE</p><h2>{lang === "my" ? "Market structure" : "Market structure"}</h2></div></div><p className="report-lede">{localized(data.marketStructure, lang)}</p></section><section className="update-section"><div className="report-section-heading"><span>03</span><div><p className="eyebrow">NEXT WEEK</p><h2>{lang === "my" ? "နောက်အပတ် စောင့်ကြည့်ရန်" : "What to watch next week"}</h2></div></div><div className="daily-takeaways">{data.nextWeek.map((item, index) => <article key={index}><span>0{index + 1}</span><p>{localized(item, lang)}</p></article>)}</div><div className="daily-risk"><h3>{lang === "my" ? "Risk checklist" : "Risk checklist"}</h3><ul>{data.riskNotes.map((item, index) => <li key={index}>{localized(item, lang)}</li>)}</ul></div></section><section className="report-sources"><p className="eyebrow">SOURCES</p><h2>{copy[lang].sources}</h2><div>{data.sources.map((source, index) => <a key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.source}{source.publishedAt ? ` · ${formatTime(source.publishedAt, lang)}` : ""}</span></a>)}</div></section></div>;
}


function DcaCalculator({ data, lang }: { data: Dashboard; lang: Language }) {
  const t = copy[lang];
  const [amount, setAmount] = useState("100");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("weekly");
  const [purchases, setPurchases] = useState("4");
  const [allocationProfile, setAllocationProfile] = useState<"steady" | "balanced" | "growth">("balanced");
  const btc = data.quotes.find((quote) => quote.symbol === "BTC");
  const result = useMemo(() => { if (!btc) return null; const perPurchase = Number(amount); const requested = Math.max(1, Math.floor(Number(purchases))); if (!Number.isFinite(perPurchase) || perPurchase <= 0 || !Number.isFinite(requested)) return null; const step = frequency === "daily" ? 1 : 7; const chosen = [...data.history].reverse().filter((_point, index) => index % step === 0).slice(0, requested); if (chosen.length === 0) return null; const units = chosen.reduce((sum, point) => sum + perPurchase / point.btcPrice, 0); const invested = perPurchase * chosen.length; const currentValue = units * btc.price; return { units, invested, currentValue, pnl: currentValue - invested, actualPurchases: chosen.length, oldestDate: chosen.at(-1)?.date ?? chosen[0]?.date ?? "" }; }, [amount, btc, data.history, frequency, purchases]);
  const maxPurchases = frequency === "daily" ? data.history.length : Math.ceil(data.history.length / 7);
  const profiles = {
    steady: { btc: 60, eth: 30, sol: 10, labelMy: "BTC အလေးပေး", labelEn: "BTC-led" },
    balanced: { btc: 55, eth: 30, sol: 15, labelMy: "မျှတ", labelEn: "Balanced" },
    growth: { btc: 50, eth: 30, sol: 20, labelMy: "တိုးတက်မှုအလေးပေး", labelEn: "Growth-tilted" },
  } as const;
  const allocation = profiles[allocationProfile];
  const monthlyDca = Number.isFinite(Number(amount)) && Number(amount) > 0 ? Number(amount) * (frequency === "daily" ? 30 : 4) : 0;
  return <div className="dca-page"><div className="dca-layout"><section className="feature-section" aria-labelledby="dca-heading"><p className="eyebrow">BTC DCA</p><h1 id="dca-heading">{t.dcaTitle}</h1><p className="section-description">{t.dcaDescription}</p><div className="dca-form"><label>{t.amount}<input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} aria-label={t.amount} /></label><label>{t.frequency}<select value={frequency} onChange={(event) => setFrequency(event.target.value === "daily" ? "daily" : "weekly")}><option value="daily">{t.daily}</option><option value="weekly">{t.weekly}</option></select></label><label>{t.purchases}<input type="number" min="1" max={Math.max(maxPurchases, 1)} value={purchases} onChange={(event) => setPurchases(event.target.value)} aria-label={t.purchases} /></label></div><p className="form-note">{t.dcaLimit(maxPurchases)}</p></section><section className="dca-result" aria-live="polite">{result ? <><div className="dca-result-head"><span>{result.oldestDate ? formatDay(result.oldestDate, lang) : ""} {t.from}</span><strong>{t.times(result.actualPurchases)}</strong></div><div className="dca-hero"><span>{t.currentValue}</span><strong>{fullUsd.format(result.currentValue)}</strong><Change value={result.invested === 0 ? 0 : (result.pnl / result.invested) * 100} /></div><dl><div><dt>{t.invested}</dt><dd>{fullUsd.format(result.invested)}</dd></div><div><dt>{t.btcReceived}</dt><dd>{compactNumber.format(result.units)} BTC</dd></div><div><dt>{t.pnl}</dt><dd className={result.pnl >= 0 ? "change-positive" : "change-negative"}>{result.pnl >= 0 ? "+" : ""}{fullUsd.format(result.pnl)}</dd></div><div><dt>{t.currentBtc}</dt><dd>{fullUsd.format(btc?.price ?? 0)}</dd></div></dl></> : <div className="empty-panel"><strong>{t.invalidAmount}</strong></div>}</section></div><section className="allocation-guide" aria-labelledby="allocation-heading"><div className="allocation-head"><div><p className="eyebrow">LONG-TERM ALLOCATION</p><h2 id="allocation-heading">{lang === "my" ? "BTC / ETH / SOL DCA လမ်းညွှန်" : "BTC / ETH / SOL DCA guide"}</h2><p>{lang === "my" ? "အပေါ်က DCA ပမာဏနှင့် frequency မှ တစ်လစာခန့်မှန်းငွေကို profile အလိုက် ခွဲပြထားသည်။" : "Splits the estimated monthly amount from the DCA settings above across a long-term profile."}</p></div><strong>{fullUsd.format(monthlyDca)}<small> / {lang === "my" ? "လ" : "month"}</small></strong></div><div className="allocation-profile-switch" role="group" aria-label={lang === "my" ? "Allocation profile" : "Allocation profile"}>{(Object.keys(profiles) as Array<keyof typeof profiles>).map((key) => <button type="button" key={key} aria-pressed={allocationProfile === key} onClick={() => setAllocationProfile(key)}><strong>{lang === "my" ? profiles[key].labelMy : profiles[key].labelEn}</strong><span>{profiles[key].btc}/{profiles[key].eth}/{profiles[key].sol}</span></button>)}</div><div className="allocation-bars"><article><div><strong>BTC</strong><span>{allocation.btc}% · {fullUsd.format(monthlyDca * allocation.btc / 100)}</span></div><progress max="100" value={allocation.btc} /></article><article><div><strong>ETH</strong><span>{allocation.eth}% · {fullUsd.format(monthlyDca * allocation.eth / 100)}</span></div><progress max="100" value={allocation.eth} /></article><article><div><strong>SOL</strong><span>{allocation.sol}% · {fullUsd.format(monthlyDca * allocation.sol / 100)}</span></div><progress max="100" value={allocation.sol} /></article></div><div className="allocation-notes"><p>{lang === "my" ? "BTC သည် core allocation၊ ETH သည် smart-contract exposure၊ SOL သည် volatility ပိုမြင့်သော satellite allocation အဖြစ် သတ်မှတ်ထားသည်။" : "BTC anchors the core, ETH adds smart-contract exposure, and SOL is the higher-volatility satellite allocation."}</p><p>{lang === "my" ? "၆ လမှ ၁၂ လတစ်ကြိမ် သို့မဟုတ် allocation ၅ percentage points ကျော်လွဲချိန်တွင် ပြန်ညှိစဉ်းစားပါ။" : "Consider reviewing every 6–12 months, or when an allocation drifts by more than 5 percentage points."}</p></div><p className="signal-method-note">{lang === "my" ? "ပညာရေးဆိုင်ရာ model သာဖြစ်ပြီး ကိုယ်ပိုင်ရင်းနှီးမြှုပ်နှံမှုအကြံပြုချက် မဟုတ်ပါ။" : "This is an educational model, not personalized investment advice."}</p></section></div>;
}

function ScrollToTopButton({ lang }: { lang: Language }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // The Muse shell scrolls the fixed generated root, not the iframe window.
    const scrollRoot = document.querySelector<HTMLElement>("[data-generated-space-root]");
    const updateVisibility = () => {
      const offset = Math.max(
        scrollRoot?.scrollTop ?? 0,
        window.scrollY,
        document.documentElement.scrollTop,
        document.body.scrollTop,
      );
      setVisible(offset > 240);
    };

    updateVisibility();
    scrollRoot?.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => {
      scrollRoot?.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("scroll", updateVisibility);
    };
  }, []);

  if (!visible) return null;

  const label = lang === "my" ? "စာမျက်နှာ အပေါ်ဆုံးသို့ ပြန်သွားမည်" : "Back to top";
  const scrollToTop = () => {
    const scrollRoot = document.querySelector<HTMLElement>("[data-generated-space-root]");
    scrollRoot?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };
  return <button type="button" className="scroll-to-top" onClick={scrollToTop} aria-label={label} title={label}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 11 6-6 6 6M12 5v14" /></svg></button>;
}

function DashboardView({ data, settings, lang, setLang, themeMode, setThemeMode, staleMessage, onRefresh, refreshing, onMarketRefresh, marketRefreshing, marketRefreshMessage, onSettingsChange }: { data: Dashboard; settings: Settings; lang: Language; setLang: (lang: Language) => void; themeMode: ThemeMode; setThemeMode: (mode: ThemeMode) => void; staleMessage: string | null; onRefresh: () => void; refreshing: boolean; onMarketRefresh: () => void; marketRefreshing: boolean; marketRefreshMessage: string | null; onSettingsChange: (settings: Settings) => void }) {
  const t = copy[lang];
  const [tab, setTab] = useState<Tab>("overview");
  const [methodOpen, setMethodOpen] = useState(false);
  const [marketRefreshRequested, setMarketRefreshRequested] = useState(false);
  useEffect(() => {
    if (tab !== "markets" || marketRefreshRequested) return;
    const needsData = data.derivatives.length === 0 || data.etfFlows.length === 0 || data.liquidationLevels.length === 0 || data.economicCalendar.length === 0 || data.tokenUnlocks.length === 0;
    if (!data.marketIntelligenceStatus || needsData) {
      setMarketRefreshRequested(true);
      onMarketRefresh();
    }
  }, [data.derivatives.length, data.economicCalendar.length, data.etfFlows.length, data.liquidationLevels.length, data.marketIntelligenceStatus, data.tokenUnlocks.length, marketRefreshRequested, onMarketRefresh, tab]);
  const tabs: Array<{ id: Tab; label: string }> = [{ id: "overview", label: t.overview }, { id: "update", label: t.updateTab }, { id: "signals", label: lang === "my" ? "Trading အချက်ပြများ" : "Trading Signals" }, { id: "weekly", label: lang === "my" ? "Weekly" : "Weekly" }, { id: "watchlist", label: lang === "my" ? "Portfolio & Alerts" : "Portfolio & Alerts" }, { id: "markets", label: lang === "my" ? "Markets" : "Markets" }, { id: "news", label: t.newsTab }, { id: "dca", label: "DCA" }];
  return <main className="app-shell"><span id="dashboard-top-marker" className="dashboard-top-marker" aria-hidden="true" /><section className="topline" aria-label={t.marketStatus}><div><p className="section-kicker">{t.marketStatus}</p><p className="update-time">{t.updated} · {formatTime(data.sourceTime, lang)}</p></div><div className="topline-actions"><ThemeControl mode={themeMode} setMode={setThemeMode} lang={lang} /><LanguageControl lang={lang} setLang={setLang} /><button className="refresh-button" onClick={onRefresh} disabled={refreshing} aria-label={t.refresh}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5M18.2 9A7 7 0 0 0 6.4 6.4L4 9m16 6-2.4 2.6A7 7 0 0 1 5.8 15" /></svg><span>{refreshing ? t.refreshing : t.refresh}</span></button></div></section>{staleMessage ? <div className="status-banner" role="status">{staleMessage}</div> : null}<nav className="tab-bar" aria-label="Dashboard sections">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined}>{item.label}</button>)}</nav>{tab === "overview" ? <Overview data={data} lang={lang} onOpenMethod={() => setMethodOpen(true)} /> : null}{tab === "update" ? <MarketUpdate lang={lang} /> : null}{tab === "signals" ? <TradingSignals lang={lang} settings={settings} onSettingsChange={onSettingsChange} /> : null}{tab === "weekly" ? <WeeklyDigest lang={lang} notificationsEnabled={settings.notifications.weeklyDigest} /> : null}{tab === "watchlist" ? <WatchlistAndAlerts data={data} settings={settings} lang={lang} onSettingsChange={onSettingsChange} onRefresh={onRefresh} /> : null}{tab === "markets" ? <MarketIntelligence data={data} lang={lang} onRefresh={onMarketRefresh} refreshing={marketRefreshing} refreshMessage={marketRefreshMessage} /> : null}{tab === "news" ? <NewsAndWhales data={data} lang={lang} /> : null}{tab === "dca" ? <DcaCalculator data={data} lang={lang} /> : null}<footer className="source-note"><p>{t.sources} · {data.sources.join(" · ")}</p><p>{t.disclaimer}</p></footer><ScrollToTopButton lang={lang} />{methodOpen ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setMethodOpen(false); }}><section className="method-modal" role="dialog" aria-modal="true" aria-labelledby="method-title"><button className="close-button" onClick={() => setMethodOpen(false)} aria-label={t.dismiss}>×</button><p className="eyebrow">METHODOLOGY</p><h2 id="method-title">{t.methodology}</h2><p>{t.methodIntro}</p><div className="formula"><div><strong>55%</strong><span>Alternative.me Fear & Greed</span></div><div><strong>25%</strong><span>BTC 24-hour momentum</span></div><div><strong>20%</strong><span>{t.newsSentiment}</span></div></div><div className="method-scale" aria-hidden="true" /><div className="method-labels"><span>0 · {t.fear}</span><span>50 · {t.neutral}</span><span>100 · {t.greed}</span></div><p className="method-detail">{t.methodDetail}</p></section></div> : null}</main>;
}

export function App() {
  const queryClient = useQueryClient();
  const [lang, setLangState] = useState<Language>(() => { try { return window.localStorage.getItem("crypto-dashboard-language") === "en" ? "en" : "my"; } catch { return "my"; } });
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => { try { const saved = window.localStorage.getItem("crypto-dashboard-theme"); return saved === "light" || saved === "dark" ? saved : "auto"; } catch { return "auto"; } });
  const t = copy[lang];
  useEffect(() => { try { window.localStorage.setItem("crypto-dashboard-language", lang); } catch { /* Preferences still work for this session. */ } }, [lang]);
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", themeMode);
    try { window.localStorage.setItem("crypto-dashboard-theme", themeMode); } catch { /* The theme still works for this session. */ }
  }, [themeMode]);
  const dashboard = useQuery({ queryKey: ["crypto-dashboard"], queryFn: () => api.getDashboard({}), refetchInterval: 5 * 60 * 1000, refetchOnWindowFocus: true });
  const settings = useQuery({ queryKey: ["crypto-settings"], queryFn: () => api.getSettings({}) });
  const refresh = useMutation({ mutationFn: () => api.refreshMarketData({}), onSuccess: (result) => { queryClient.setQueryData(["crypto-dashboard"], result); void queryClient.invalidateQueries({ queryKey: ["crypto-settings"] }); } });
  const marketRefresh = useMutation({ mutationFn: () => api.refreshMarketIntelligence({}), onSuccess: (result) => { queryClient.setQueryData(["crypto-dashboard"], result); } });
  useEffect(() => {
    if (!settings.data || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      const seenKey = "crypto-dashboard-seen-notifications";
      const seen = new Set<string>(JSON.parse(window.localStorage.getItem(seenKey) ?? "[]") as string[]);
      const delivered: string[] = [];
      if (settings.data.notifications.marketAlerts) {
        for (const event of settings.data.marketAlertEvents) {
          const key = `market-${event.id}`;
          if (seen.has(key)) continue;
          new Notification(event.kind === "extreme_fear" ? "Extreme Fear alert" : "Extreme Greed alert", { body: `Fear & Greed ${event.fearGreed} · Market Pulse ${event.score}` });
          seen.add(key); delivered.push(key);
        }
      }
      if (settings.data.notifications.priceAlerts) {
        for (const alert of settings.data.alerts.filter((item) => !item.active && item.triggeredAt)) {
          const key = `price-${alert.id}-${alert.triggeredAt}`;
          if (seen.has(key)) continue;
          new Notification(`${alert.symbol} price alert`, { body: `${alert.direction === "above" ? "≥" : "≤"} ${fullUsd.format(alert.targetPrice)} · ${alert.triggeredPrice ? fullUsd.format(alert.triggeredPrice) : "triggered"}` });
          seen.add(key); delivered.push(key);
        }
      }
      if (delivered.length > 0) window.localStorage.setItem(seenKey, JSON.stringify([...seen].slice(-100)));
    } catch { /* The in-app alert state remains available. */ }
  }, [settings.data]);
  if (dashboard.isPending || settings.isPending) return <main className="state-screen"><LanguageControl lang={lang} setLang={setLangState} /><div className="loader" /><p>{t.loading}</p></main>;
  if (dashboard.isError || settings.isError || !dashboard.data?.data || !settings.data) return <main className="state-screen error-state"><LanguageControl lang={lang} setLang={setLangState} /><p className="eyebrow">DATA UNAVAILABLE</p><h1>{t.unavailable}</h1><p>{lang === "en" ? dashboard.data?.messageEn ?? t.connectionIssue : dashboard.data?.message ?? t.connectionIssue}</p><button onClick={() => { void dashboard.refetch(); void settings.refetch(); }} aria-label={t.retry}>{t.retry}</button></main>;
  return <DashboardView data={dashboard.data.data} settings={settings.data} lang={lang} setLang={setLangState} themeMode={themeMode} setThemeMode={setThemeMode} staleMessage={dashboard.data.status === "stale" ? (lang === "en" ? dashboard.data.messageEn : dashboard.data.message) : null} onRefresh={() => refresh.mutate()} refreshing={refresh.isPending} onMarketRefresh={() => marketRefresh.mutate()} marketRefreshing={marketRefresh.isPending} marketRefreshMessage={marketRefresh.data?.status === "stale" ? (lang === "en" ? marketRefresh.data.messageEn : marketRefresh.data.message) : null} onSettingsChange={(next) => queryClient.setQueryData(["crypto-settings"], next)} />;
}
