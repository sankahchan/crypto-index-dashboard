import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
Area,
CartesianGrid,
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
type Tab = "overview" | "update" | "watchlist" | "markets" | "news" | "dca" | "weekly";
type Language = "my" | "en";
type ThemeMode = "auto" | "light" | "dark";
type TrendRange = "30d" | "90d" | "180d" | "1y" | "all";

const copy = {
  my: {
    language: "ဘာသာစကား",
    updated: "Update",
    refresh: "Refresh",
    refreshing: "ရယူနေသည်",
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
  return new Intl.DateTimeFormat(lang === "my" ? "my-MM" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDay(value: string, lang: Language) {
  return new Intl.DateTimeFormat(lang === "my" ? "my-MM" : "en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
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

function MarketCycle({ data, lang }: { data: Dashboard; lang: Language }) {
  const latest = data.history.at(-1);
  const previous = data.history.at(-2);
  const rising = !latest || !previous ? data.btcChangePct >= 0 : latest.score >= previous.score;
  const stageIndex = rising
    ? Math.min(5, Math.max(0, Math.floor(data.score / 17)))
    : Math.min(12, 6 + Math.max(0, Math.floor((100 - data.score) / 15)));
  const [selectedIndex, setSelectedIndex] = useState(stageIndex);
  const current = cycleStages[stageIndex] ?? cycleStages[0];
  const selected = cycleStages[selectedIndex] ?? current;
  const chartStages = cycleStages.map((stage, index) => ({ ...stage, position: index, label: lang === "my" ? stage.my : stage.en }));
  const closingStage = cycleStages[0];
  const cycleChartData = [...chartStages, { ...closingStage, position: 13, level: 31, label: lang === "my" ? "ပြန်လည် မယုံကြည်သေး" : "Disbelief returns" }];
  const directionLabel = rising ? (lang === "my" ? "ပြန်လည်မြင့်တက်" : "Recovering") : (lang === "my" ? "ကျဆင်းဘက်" : "Declining");
  return <section className="cycle-section" aria-labelledby="cycle-heading">
    <div className="cycle-header"><div><h2 id="cycle-heading">{lang === "my" ? "Cycle position" : "Cycle position"}</h2><p className="cycle-subtitle">{lang === "my" ? "Investor psychology အဆင့် ၁၃ ဆင့်ဖြင့် market cycle ကို အချိန်နှင့်တပြေးညီ ခြေရာခံပါ။" : "Track the market cycle in real time through 13 stages of investor psychology."}</p></div></div>
    <div className="cycle-stage-tabs" role="group" aria-label={lang === "my" ? "Cycle အဆင့်တစ်ခုရွေးရန်" : "Choose a cycle stage"}>
      <button type="button" className={`cycle-position-chip${selectedIndex === stageIndex ? " selected" : ""}`} onClick={() => setSelectedIndex(stageIndex)} aria-pressed={selectedIndex === stageIndex}>
        <i style={{ background: current.color }} /><strong>{lang === "my" ? "လက်ရှိအဆင့်" : "Current position"}</strong><span>{lang === "my" ? current.my : current.en}</span>
      </button>
      {cycleStages.map((stage, index) => index === stageIndex ? null : <button type="button" key={stage.en} className={index === selectedIndex ? "selected" : ""} onClick={() => setSelectedIndex(index)} aria-pressed={index === selectedIndex} style={index === selectedIndex ? { background: `color-mix(in srgb, ${stage.color} 12%, var(--surface-strong))` } : undefined}><i style={{ background: stage.color }} />{lang === "my" ? stage.my : stage.en}</button>)}
    </div>
    <div className="cycle-detail" aria-live="polite">
      <div className="cycle-detail-title"><strong>{lang === "my" ? selected.my : selected.en}</strong><span>“{lang === "my" ? selected.quoteMy : selected.quoteEn}”</span></div>
      {selectedIndex === stageIndex ? <div className="cycle-current-meta"><span>{lang === "my" ? "ဦးတည်ချက်" : "Direction"} <strong>{directionLabel}</strong></span><span>{lang === "my" ? "အဆင့်" : "Stage"} <strong>{stageIndex + 1}/13</strong></span></div> : null}
      <p>{lang === "my" ? selected.noteMy : selected.noteEn}</p>
    </div>
    <div className="cycle-chart" role="img" aria-label={`${lang === "my" ? current.my : current.en}, ${stageIndex + 1} of 13, ${directionLabel}`}>
      <span className="cycle-axis-y">{lang === "my" ? "ဈေးနှုန်း" : "PRICE"}</span>
      <ResponsiveContainer width="100%" height="100%"><ComposedChart data={cycleChartData} margin={{ top: 30, right: 18, bottom: 20, left: 22 }}>
        <defs>
          <linearGradient id="cycle-line-gradient" x1="0" y1="0" x2="1" y2="0">
            {cycleStages.map((stage, index) => <stop key={stage.en} offset={`${(index / 12) * 100}%`} stopColor={stage.color} />)}
          </linearGradient>
          <linearGradient id="cycle-area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6bcf86" stopOpacity=".18" /><stop offset="100%" stopColor="#6bcf86" stopOpacity=".015" /></linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 7" />
        <XAxis type="number" dataKey="position" domain={[0, 13]} hide />
        <YAxis domain={[0, 110]} hide />
        <ReferenceArea x1={Math.max(0, stageIndex - .38)} x2={Math.min(13, stageIndex + .38)} fill={current.color} fillOpacity={.11} strokeOpacity={0} />
        <ReferenceLine x={stageIndex} stroke={current.color} strokeDasharray="3 4" strokeOpacity={.72} />
        <Area type="monotone" dataKey="level" stroke="url(#cycle-line-gradient)" strokeWidth={4} fill="url(#cycle-area-gradient)" dot={{ r: 2.7, fill: "var(--surface-strong)", stroke: "#57bb8a", strokeWidth: 1.7 }} isAnimationActive={false}>
          <LabelList dataKey="label" position="top" className="cycle-chart-label" fill="var(--dim)" fontSize={8} />
        </Area>
        {selectedIndex !== stageIndex ? <ReferenceDot x={selectedIndex} y={selected.level} r={5} fill="var(--surface-strong)" stroke={selected.color} strokeWidth={2} /> : null}
        <ReferenceDot x={stageIndex} y={current.level} r={8} fill="var(--surface-strong)" stroke={current.color} strokeWidth={4} />
      </ComposedChart></ResponsiveContainer>
      <span className="cycle-axis-x">{lang === "my" ? "အချိန်" : "TIME"} →</span>
      <span className="cycle-peak">{lang === "my" ? "အမြင့်ဆုံး အကောင်းမြင်မှု" : "PEAK OPTIMISM"}</span>
      <span className="cycle-low">{lang === "my" ? "အမြင့်ဆုံး ကြောက်ရွံ့မှု" : "PEAK FEAR"}</span>
    </div>
    <p className="cycle-note">{lang === "my" ? "Market Pulse score နဲ့ လတ်တလောဦးတည်ချက်ကို ပေါင်းစပ်ထားသော ခန့်မှန်းချက်ဖြစ်ပြီး cycle အတည်ပြုချက် မဟုတ်ပါ။" : "An indicative reading derived from the Market Pulse score and its latest direction—not a confirmed market-cycle call."}</p>
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
  const [customMode, setCustomMode] = useState(false);
  const [customSymbol, setCustomSymbol] = useState("");
  const [customName, setCustomName] = useState("");
  const [customTier, setCustomTier] = useState<Tier>("low");
  const [manualPrice, setManualPrice] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | Tier>("all");
  const save = useMutation({
    mutationFn: (args: { symbol: string; assetName?: string | null; tier?: Tier | null; quantity: number; averageCost: number | null; manualPrice?: number | null }) => api.upsertPortfolioHolding(args),
    onSuccess: (next) => { onSettingsChange(next); setQuantity(""); setAverageCost(""); setManualPrice(""); },
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
      save.mutate({ symbol: normalizedCustomSymbol, assetName: customName.trim(), tier: customTier, quantity: amount, averageCost: cost, manualPrice: price });
      return;
    }
    save.mutate({ symbol, quantity: amount, averageCost: cost, manualPrice: null });
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
      <button className="primary-button" type="submit" disabled={save.isPending || Number(quantity) <= 0 || (customMode && (!/^[A-Z0-9]{2,12}$/.test(customSymbol) || customName.trim().length < 2 || Number(manualPrice) <= 0))}>{save.isPending ? (lang === "my" ? "သိမ်းနေသည်…" : "Saving…") : (lang === "my" ? "Holding သိမ်းမည်" : "Save holding")}</button>
    </form>
    {customMode ? <p className="manual-price-note">{lang === "my" ? "Manual coin ဈေးသည် live feed မဟုတ်ပါ။ တန်ဖိုးမှန်ကန်စေရန် coin ကို ထပ်ရွေးပြီး လက်ရှိဈေးကို အချိန်မရွေး update လုပ်နိုင်သည်။" : "Manual prices are not live. Re-enter the same symbol anytime to update its current price and portfolio value."}</p> : null}

    <div className="holdings-toolbar"><strong>{tierFilter === "all" ? (lang === "my" ? "Holding အားလုံး" : "All holdings") : tierLabel(tierFilter, lang)}</strong>{tierFilter !== "all" ? <button type="button" onClick={() => setTierFilter("all")}>{lang === "my" ? "အားလုံးပြမည်" : "Show all"}</button> : null}</div>
    <div className="holding-list">{filteredHoldings.length > 0 ? filteredHoldings.map((item) => {
      const allocation = item.value !== null && totalValue > 0 ? (item.value / totalValue) * 100 : 0;
      return <article key={item.id}><div className="holding-identity"><span className={`cap-dot cap-dot-${item.coin?.tier ?? "low"}`} /><div><strong>{item.symbol} · {compactNumber.format(item.quantity)}</strong><span>{item.coin ? `${item.coin.name} · ${tierLabel(item.coin.tier, lang)}` : ""}{item.price !== null ? ` · ${fullUsd.format(item.price)} / coin` : ""}{item.isManual ? ` · ${lang === "my" ? "Manual ဈေး" : "Manual price"}` : ""}</span></div></div><div className="holding-value"><strong>{item.value === null ? "—" : fullUsd.format(item.value)}</strong><span className={item.pnl === null ? "" : item.pnl >= 0 ? "change-positive" : "change-negative"}>{item.price === null ? (lang === "my" ? "ဈေးမထည့်ထား" : "Price unavailable") : item.pnl === null ? (lang === "my" ? "Average cost မထည့်ထား" : "No average cost") : `${item.pnl >= 0 ? "+" : ""}${fullUsd.format(item.pnl)}`}</span>{item.value !== null ? <div className="allocation-track" aria-label={`${allocation.toFixed(1)}%`}><span style={{ width: `${allocation}%` }} /></div> : null}</div><button onClick={() => remove.mutate(item.id)} aria-label={`${item.symbol} ${lang === "my" ? "ဖျက်မည်" : "delete"}`}>×</button></article>;
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
  return <section className="feature-section notification-section" aria-labelledby="notification-heading"><div className="section-heading"><div><p className="eyebrow">NOTIFICATIONS</p><h2 id="notification-heading">{lang === "my" ? "Device notifications" : "Device notifications"}</h2></div><span className="permission-chip">{permission}</span></div><p className="section-description">{lang === "my" ? "Dashboard ဖွင့်ထားစဉ် alert အသစ်များကို device notification အဖြစ် ပြရန် browser permission လိုအပ်သည်။" : "Browser permission is required to show device notifications for new alerts while this dashboard is open."}</p><button className="notification-permission" onClick={() => void enableDevice()} disabled={permission === "granted"}>{permission === "granted" ? (lang === "my" ? "Permission ရပြီး" : "Permission granted") : (lang === "my" ? "Notification ခွင့်ပြုမည်" : "Allow notifications")}</button><div className="notification-toggles"><button aria-pressed={settings.notifications.priceAlerts} onClick={() => update("priceAlerts")}>Price alerts <span>{settings.notifications.priceAlerts ? "ON" : "OFF"}</span></button><button aria-pressed={settings.notifications.marketAlerts} onClick={() => update("marketAlerts")}>Fear & Greed <span>{settings.notifications.marketAlerts ? "ON" : "OFF"}</span></button><button aria-pressed={settings.notifications.weeklyDigest} onClick={() => update("weeklyDigest")}>Weekly digest <span>{settings.notifications.weeklyDigest ? "ON" : "OFF"}</span></button></div></section>;
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

function MarketIntelligence({ data, lang }: { data: Dashboard; lang: Language }) {
  const number = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });
  const localText = (mm: string, en: string) => lang === "my" ? mm : en;
  return <div className="intelligence-layout">
    <section className="feature-section" aria-labelledby="derivatives-heading"><div className="section-heading"><div><p className="eyebrow">DERIVATIVES</p><h1 id="derivatives-heading">{localText("Funding rates & Open Interest", "Funding rates & open interest")}</h1></div></div><p className="section-description">{localText("Perpetual futures market ထဲက leverage အပူချိန်ကို funding rate နဲ့ open interest ဖြင့် ကြည့်နိုင်သည်။", "A live view of perpetual-futures positioning through funding rates and open interest.")}</p>{data.derivatives.length > 0 ? <div className="derivatives-table"><div className="market-row market-head"><span>Asset</span><span>Funding</span><span>Open interest</span></div>{data.derivatives.map((item) => <article className="market-row" key={item.symbol}><strong>{item.symbol}</strong><span className={item.fundingRate >= 0 ? "change-positive" : "change-negative"}>{(item.fundingRate * 100).toFixed(4)}%</span><span>{compactUsd.format(item.openInterestUsd)}</span><small>{localText("နောက် funding", "Next funding")} · {formatTime(item.nextFundingTime, lang)}</small></article>)}</div> : <div className="empty-panel"><strong>{localText("Derivatives data မရသေးပါ", "Derivatives data is unavailable")}</strong><span>{localText("နောက် Refresh တွင် ပြန်စမ်းမည်။", "It will be retried on the next refresh.")}</span></div>}<p className="data-source-line">Binance Futures · {copy[lang].updated} {formatTime(data.sourceTime, lang)}</p></section>

    <section className="feature-section" aria-labelledby="onchain-heading"><div className="section-heading"><div><p className="eyebrow">ON-CHAIN</p><h2 id="onchain-heading">{localText("Bitcoin on-chain အချက်ပြများ", "Bitcoin on-chain signals")}</h2></div></div>{data.onChain ? <><div className="onchain-grid"><article><span>MVRV</span><strong>{data.onChain.mvrv?.toFixed(2) ?? "—"}</strong></article><article><span>{localText("Exchange netflow", "Exchange net flow")}</span><strong className={(data.onChain.exchangeNetflowBtc ?? 0) <= 0 ? "change-positive" : "change-negative"}>{data.onChain.exchangeNetflowBtc === null ? "—" : `${data.onChain.exchangeNetflowBtc > 0 ? "+" : ""}${number.format(data.onChain.exchangeNetflowBtc)} BTC`}</strong></article><article><span>{localText("Exchange inflow", "Exchange inflow")}</span><strong>{data.onChain.exchangeInflowBtc === null ? "—" : `${number.format(data.onChain.exchangeInflowBtc)} BTC`}</strong></article><article><span>{localText("Exchange outflow", "Exchange outflow")}</span><strong>{data.onChain.exchangeOutflowBtc === null ? "—" : `${number.format(data.onChain.exchangeOutflowBtc)} BTC`}</strong></article><article><span>{localText("Active addresses", "Active addresses")}</span><strong>{data.onChain.activeAddresses === null ? "—" : number.format(data.onChain.activeAddresses)}</strong></article><article><span>{localText("Transactions", "Transactions")}</span><strong>{data.onChain.transactions === null ? "—" : number.format(data.onChain.transactions)}</strong></article></div><p className="data-source-line">{data.onChain.source} · {formatTime(data.onChain.asOf, lang)}</p></> : <div className="empty-panel"><strong>{localText("On-chain data မရသေးပါ", "On-chain data is unavailable")}</strong><span>{localText("မရသည့် metric ကို အတုဖြင့် မဖြည့်ထားပါ။", "Unavailable metrics are left blank rather than estimated.")}</span></div>}</section>

    <section className="feature-section" aria-labelledby="calendar-heading"><div className="section-heading"><div><p className="eyebrow">MACRO CALENDAR</p><h2 id="calendar-heading">{localText("စီးပွားရေး အစီအစဉ်", "Economic calendar")}</h2></div><span className="history-count">{data.economicCalendar.length}</span></div><p className="section-description">{localText("ရှာဖွေရင်းမြစ်များတွင် ရက်စွဲအတိအကျ အတည်ပြုနိုင်သော US macro events များသာ ပါဝင်သည်။", "Only explicitly dated US macro events found in current sources are included.")}</p>{data.economicCalendar.length > 0 ? <div className="calendar-list">{data.economicCalendar.map((item, index) => <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer"><time dateTime={item.date}>{formatDay(item.date, lang)}</time><div><strong>{item.title}</strong><p>{lang === "my" ? item.whyItMattersMm : item.whyItMattersEn}</p><span>{item.source} · {item.importance}</span></div></a>)}</div> : <div className="empty-panel"><strong>{localText("အတည်ပြုထားသော upcoming event မရှိသေးပါ", "No verified upcoming events")}</strong><span>{localText("Refresh လုပ်ပြီး ပြန်စစ်နိုင်သည်။", "Refresh to search again.")}</span></div>}</section>

    <section className="feature-section" aria-labelledby="unlocks-heading"><div className="section-heading"><div><p className="eyebrow">TOKEN SUPPLY</p><h2 id="unlocks-heading">{localText("Token unlock calendar", "Token unlock calendar")}</h2></div><span className="history-count">{data.tokenUnlocks.length}</span></div><p className="section-description">{localText("အမည်၊ ရက်စွဲနှင့် unlock ပမာဏကို ရင်းမြစ်က အတည်ပြုထားသည့် rows များသာ ပြသည်။", "Shows only rows whose source explicitly identifies the token, date, and unlock amount.")}</p>{data.tokenUnlocks.length > 0 ? <div className="calendar-list">{data.tokenUnlocks.map((item, index) => <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer"><time dateTime={item.date}>{formatDay(item.date, lang)}</time><div><strong>{item.token} · {item.amount}</strong><p>{lang === "my" ? item.noteMm : item.noteEn}</p><span>{item.source}</span></div></a>)}</div> : <div className="empty-panel"><strong>{localText("အတည်ပြုထားသော unlock မရှိသေးပါ", "No verified token unlocks")}</strong><span>{localText("မရှင်းလင်းသော ရက်စွဲနှင့် ပမာဏများကို မဖော်ပြထားပါ။", "Ambiguous dates and amounts are omitted.")}</span></div>}</section>
  </div>;
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
  const btc = data.quotes.find((quote) => quote.symbol === "BTC");
  const result = useMemo(() => { if (!btc) return null; const perPurchase = Number(amount); const requested = Math.max(1, Math.floor(Number(purchases))); if (!Number.isFinite(perPurchase) || perPurchase <= 0 || !Number.isFinite(requested)) return null; const step = frequency === "daily" ? 1 : 7; const chosen = [...data.history].reverse().filter((_point, index) => index % step === 0).slice(0, requested); if (chosen.length === 0) return null; const units = chosen.reduce((sum, point) => sum + perPurchase / point.btcPrice, 0); const invested = perPurchase * chosen.length; const currentValue = units * btc.price; return { units, invested, currentValue, pnl: currentValue - invested, actualPurchases: chosen.length, oldestDate: chosen.at(-1)?.date ?? chosen[0]?.date ?? "" }; }, [amount, btc, data.history, frequency, purchases]);
  const maxPurchases = frequency === "daily" ? data.history.length : Math.ceil(data.history.length / 7);
  return <div className="dca-layout"><section className="feature-section" aria-labelledby="dca-heading"><p className="eyebrow">BTC DCA</p><h1 id="dca-heading">{t.dcaTitle}</h1><p className="section-description">{t.dcaDescription}</p><div className="dca-form"><label>{t.amount}<input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} aria-label={t.amount} /></label><label>{t.frequency}<select value={frequency} onChange={(event) => setFrequency(event.target.value === "daily" ? "daily" : "weekly")}><option value="daily">{t.daily}</option><option value="weekly">{t.weekly}</option></select></label><label>{t.purchases}<input type="number" min="1" max={Math.max(maxPurchases, 1)} value={purchases} onChange={(event) => setPurchases(event.target.value)} aria-label={t.purchases} /></label></div><p className="form-note">{t.dcaLimit(maxPurchases)}</p></section><section className="dca-result" aria-live="polite">{result ? <><div className="dca-result-head"><span>{result.oldestDate ? formatDay(result.oldestDate, lang) : ""} {t.from}</span><strong>{t.times(result.actualPurchases)}</strong></div><div className="dca-hero"><span>{t.currentValue}</span><strong>{fullUsd.format(result.currentValue)}</strong><Change value={result.invested === 0 ? 0 : (result.pnl / result.invested) * 100} /></div><dl><div><dt>{t.invested}</dt><dd>{fullUsd.format(result.invested)}</dd></div><div><dt>{t.btcReceived}</dt><dd>{compactNumber.format(result.units)} BTC</dd></div><div><dt>{t.pnl}</dt><dd className={result.pnl >= 0 ? "change-positive" : "change-negative"}>{result.pnl >= 0 ? "+" : ""}{fullUsd.format(result.pnl)}</dd></div><div><dt>{t.currentBtc}</dt><dd>{fullUsd.format(btc?.price ?? 0)}</dd></div></dl></> : <div className="empty-panel"><strong>{t.invalidAmount}</strong></div>}</section></div>;
}

function DashboardView({ data, settings, lang, setLang, themeMode, setThemeMode, staleMessage, onRefresh, refreshing, onSettingsChange }: { data: Dashboard; settings: Settings; lang: Language; setLang: (lang: Language) => void; themeMode: ThemeMode; setThemeMode: (mode: ThemeMode) => void; staleMessage: string | null; onRefresh: () => void; refreshing: boolean; onSettingsChange: (settings: Settings) => void }) {
  const t = copy[lang];
  const [tab, setTab] = useState<Tab>("overview");
  const [methodOpen, setMethodOpen] = useState(false);
  const tabs: Array<{ id: Tab; label: string }> = [{ id: "overview", label: t.overview }, { id: "update", label: t.updateTab }, { id: "weekly", label: lang === "my" ? "Weekly" : "Weekly" }, { id: "watchlist", label: lang === "my" ? "Portfolio & Alerts" : "Portfolio & Alerts" }, { id: "markets", label: lang === "my" ? "Markets" : "Markets" }, { id: "news", label: t.newsTab }, { id: "dca", label: "DCA" }];
  return <main className="app-shell"><section className="topline" aria-label={t.marketStatus}><div><p className="section-kicker">{t.marketStatus}</p><p className="update-time">{t.updated} · {formatTime(data.sourceTime, lang)}</p></div><div className="topline-actions"><ThemeControl mode={themeMode} setMode={setThemeMode} lang={lang} /><LanguageControl lang={lang} setLang={setLang} /><button className="refresh-button" onClick={onRefresh} disabled={refreshing} aria-label={t.refresh}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5M18.2 9A7 7 0 0 0 6.4 6.4L4 9m16 6-2.4 2.6A7 7 0 0 1 5.8 15" /></svg><span>{refreshing ? t.refreshing : t.refresh}</span></button></div></section>{staleMessage ? <div className="status-banner" role="status">{staleMessage}</div> : null}<nav className="tab-bar" aria-label="Dashboard sections">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined}>{item.label}</button>)}</nav>{tab === "overview" ? <Overview data={data} lang={lang} onOpenMethod={() => setMethodOpen(true)} /> : null}{tab === "update" ? <MarketUpdate lang={lang} /> : null}{tab === "weekly" ? <WeeklyDigest lang={lang} notificationsEnabled={settings.notifications.weeklyDigest} /> : null}{tab === "watchlist" ? <WatchlistAndAlerts data={data} settings={settings} lang={lang} onSettingsChange={onSettingsChange} onRefresh={onRefresh} /> : null}{tab === "markets" ? <MarketIntelligence data={data} lang={lang} /> : null}{tab === "news" ? <NewsAndWhales data={data} lang={lang} /> : null}{tab === "dca" ? <DcaCalculator data={data} lang={lang} /> : null}<footer className="source-note"><p>{t.sources} · {data.sources.join(" · ")}</p><p>{t.disclaimer}</p></footer>{methodOpen ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setMethodOpen(false); }}><section className="method-modal" role="dialog" aria-modal="true" aria-labelledby="method-title"><button className="close-button" onClick={() => setMethodOpen(false)} aria-label={t.dismiss}>×</button><p className="eyebrow">METHODOLOGY</p><h2 id="method-title">{t.methodology}</h2><p>{t.methodIntro}</p><div className="formula"><div><strong>55%</strong><span>Alternative.me Fear & Greed</span></div><div><strong>25%</strong><span>BTC 24-hour momentum</span></div><div><strong>20%</strong><span>{t.newsSentiment}</span></div></div><div className="method-scale" aria-hidden="true" /><div className="method-labels"><span>0 · {t.fear}</span><span>50 · {t.neutral}</span><span>100 · {t.greed}</span></div><p className="method-detail">{t.methodDetail}</p></section></div> : null}</main>;
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
  return <DashboardView data={dashboard.data.data} settings={settings.data} lang={lang} setLang={setLangState} themeMode={themeMode} setThemeMode={setThemeMode} staleMessage={dashboard.data.status === "stale" ? (lang === "en" ? dashboard.data.messageEn : dashboard.data.message) : null} onRefresh={() => refresh.mutate()} refreshing={refresh.isPending} onSettingsChange={(next) => queryClient.setQueryData(["crypto-settings"], next)} />;
}
