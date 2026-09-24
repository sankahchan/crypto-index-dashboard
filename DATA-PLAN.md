# Data Plan

## Context provenance
- `Live data နဲ့ ချိတ်ပေးပါ မြန်မာဘာသာပါ ထည့်ပေးပါ` (prior user statement; requires live market inputs and Burmese interface copy)
- `Auto-refresh နဲ့ ပြန်ဆောက်ပေးပါ` (prior request; requires automatic refresh and an hourly scheduled prefetch)
- `အကုန်ထည့်ပေးပါ` (prior request; accepted all six proposed additions: price alerts, watchlist, index/BTC overlay, news sentiment, whale activity, and DCA calculator)
- `Crypto သတင်း နဲ့ Whale လုပ်ရှားမှုမှာ ဘာ Data မှ မရှိသေးဘူး အဲဒါကို ရအောင်လုပ်ပေးပါ ပြီးတော့ English ဘာသာပါ ပြောင်းလို့ရအောင် လုပ်ပေးပါ` (prior request; requires resilient news and whale feeds plus a Burmese/English interface switch)
- `Retry ကြည့်ပါ မရရင် တခြား သတင်း source နဲ့ ချိတ်ပေး` (prior request; retry the managed news search and use an independent alternative when it remains unavailable)
- `မဟုတ်ဘူး အဲဒီ Market Update ကို ခုနက App မှာ ထည့်ချင်တာပါ` (prior request; add the previously requested market update directly inside this dashboard)
- `နေ့တိုင်း update လုပ်ပေးပါ` (prior request; regenerate the in-app Market Update once per day)
- `News & Whale အတွက် source တွေ ထပ်ထည့်ချင်တယ် The Block CryptoSlate crypto.news r/CryptoCurrency` (prior request; prioritize these four sources in the news feed and add a distinct whale-coverage feed sourced from them)
- `အကုန်ထည့်ပေးပါ` (current request; add all seven proposed extensions: portfolio tracker, funding rates and open interest, economic calendar, on-chain signals, token-unlock calendar, device notifications, and weekly digest)
- The user-supplied `Bitcoin_Buy_the_Dip_Strategy__Macro___PCE_Report_Outlook___Cryptonary.pdf` originally shaped the Market Update section structure. After the daily-update request, the tab no longer republishes that historical report or its old price zones; it renders a newly generated bilingual briefing from current sourced inputs.
- The supplied screenshot `workspace/user/media_library/image/43/43f978b92e15b8db9c4c6a344f8818886145ce55b548cb1cbce0d90d17f3be14.jpg` shaped the dominant 0–100 score and information hierarchy without copying proprietary branding.
- The supplied `CPT_Index___Cryptonary.html` does not expose proprietary live data or scoring methodology, so the artifact uses a transparent original formula rather than claiming to reproduce Cryptonary’s CPT score.

## Declared runtime hosts
- `api.exchange.coinbase.com`
- `api.alternative.me`
- `blockchain.info`
- `min-api.cryptocompare.com`
- `news.google.com`
- `fapi.binance.com`
- `community-api.coinmetrics.io`

## Tested sources
### Coinbase Exchange public market data
**Used by**: `refreshMarketData`, `getDashboard`
**Tested endpoints**: product 24-hour stats for BTC-USD, ETH-USD, SOL-USD and the extended supported coin catalog; BTC-USD daily candles; Coinbase server time.
**Processing**: Parse numeric strings, compute each asset’s 24-hour percentage change as `(last-open)/open*100`, retain high/low/volume, and map daily BTC candle timestamps to UTC calendar dates. The overlay and DCA calculator both read the same returned BTC close series. Missing optional coin quotes are omitted rather than substituted.

### Alternative.me Crypto Fear & Greed API
**Used by**: `refreshMarketData`, `getDashboard`
**Tested endpoint**: 30-row Fear & Greed JSON response.
**Processing**: Parse values to 0–100, retain official classification and timestamps, and translate classification labels into Burmese in the client.

### Managed web search + named publishers + independent news fallbacks + inference
**Used by**: `refreshMarketData`, `getDashboard`
**Processing**: First run a targeted managed search across The Block (`theblock.co`), CryptoSlate (`cryptoslate.com`), crypto.news (`crypto.news`), and the r/CryptoCurrency community (`reddit.com/r/CryptoCurrency`). Normalize publisher labels only when the returned article URL matches the corresponding host/path. If fewer than four current results are returned, merge a broader managed crypto-market search, deduplicate by article URL/title, and cap the main feed at eight stories. If managed search returns no stories, fetch the CryptoCompare public news feed at `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest`; if it is also unavailable, fetch the Google News RSS query at `https://news.google.com/rss/search?q=cryptocurrency%20markets&hl=en-US&gl=US&ceid=US:en`. Preserve each returned headline, source, timestamp, article URL, and source body/snippet. Run only those supplied title/snippet pairs through `ctx.inference.complete` to classify positive/neutral/negative market sentiment and create concise Burmese and English summaries. If classification is unavailable, the sourced story still appears with its original English excerpt and an explicit unclassified state; only when every retrieval path fails does the news section show an honest empty state. The dashboard source note names publishers that actually returned rows, while the News tab separately labels the four configured sources.

### Named-source whale coverage
**Used by**: `refreshMarketData`, `getDashboard`
**Processing**: Run a separate targeted managed search for recent large-holder transfers, whale activity, and exchange inflow/outflow reporting from The Block, CryptoSlate, crypto.news, and r/CryptoCurrency. Preserve and link only returned search results, deduplicate them, cap the feed at six, and apply the same bounded bilingual summarization and sentiment classification used for news. This editorial coverage is displayed separately from the Blockchain.com mempool transaction feed so reported context is never presented as on-chain evidence. When no matching coverage is returned, show an honest empty state while keeping the on-chain feed available.

### Blockchain.com unconfirmed transaction feed
**Used by**: `refreshMarketData`, `getDashboard`
**Tested endpoint**: `https://blockchain.info/unconfirmed-transactions?format=json` returned current transaction objects with hashes, timestamps, and output values.
**Processing**: Sum each transaction’s output values in satoshis, convert to BTC, retain rows at or above 10 BTC, sort by output total, and show at most six. The lower threshold gives the current mempool snapshot a practical chance to contain rows while remaining a large-value filter. The UI explicitly says totals may include change output and does not label them buys, sells, sender transfers, or exchange flows.

## User-owned state
- `watchlist_items` stores only coins the user explicitly selects from the supported catalog. It starts empty and is never auto-populated.
- `price_alerts` stores the user-selected coin, above/below condition, target USD price, creation time, active state, and trigger observation.
- `market_alert_preferences` stores the user’s explicit Extreme Fear and Extreme Greed alert toggles. `market_alert_events` records a notification only when an enabled extreme state is newly entered, avoiding duplicate notifications on each refresh. Both price alerts and market alerts are evaluated after every manual or scheduled refresh and surface in-app; no browser-notification permission is assumed.

## Daily Market Update
- **Used by**: `getDailyMarketUpdate`, `refreshDailyMarketUpdate`
- **Inputs**: A fresh dashboard snapshot plus a managed web search for current Bitcoin/crypto market, macro, central-bank, regulation, and ETF-flow coverage. When managed search is unavailable, the report uses the independently sourced dashboard news instead.
- **Processing**: `ctx.inference.complete` produces a bounded bilingual Burmese/English briefing with factual takeaways, macro backdrop, Bitcoin analysis, three conditional scenarios, and a risk checklist. The model is explicitly limited to supplied readings and headlines and may not invent dates, prices, events, forecasts, or flows. The UI displays exact source links returned by the retrieval channel and deterministically calculated 7-day/30-day BTC reference levels from Coinbase closes.
- **Storage**: Keep the newest 14 generated daily reports in `daily_market_updates`, preserving generation and market-source timestamps. If a new generation fails, show the latest saved report labeled stale; if no saved report exists, show an honest retry state.

## Long-term data behavior
- **Refresh policy**: `getDashboard` serves the newest cached snapshot and refreshes synchronously when missing or older than five minutes; a manual refresh control calls `refreshMarketData`; the existing silent hourly artifact-action schedule prefetches the same action. `getDailyMarketUpdate` serves a report for up to 20 hours, while `refreshDailyMarketUpdate` regenerates on demand and through the managed daily artifact-action schedule at approximately 8:22 AM in the user's current timezone.
- **Growth**: Store timestamped aggregate snapshots and prune to the newest 168 rows. Watchlist and alert rows are user-controlled.
- **Ordering**: Current snapshot first; daily chart history oldest-to-newest for plotting, newest-to-oldest for reading.
- **Time semantics**: Fetch timestamps are UTC instants rendered in the viewer’s locale; source-day labels use UTC because upstream history is keyed by Unix timestamps.
- **Index formula**: When news is available, Market Pulse is 55% Alternative.me Fear & Greed, 25% BTC 24-hour momentum, and 20% news sentiment. News sentiment maps each model-classified result to positive=100, neutral=50, or negative=0 and averages the real returned set. When news is unavailable, the index falls back transparently to 70% Fear & Greed and 30% BTC momentum rather than inventing a neutral news input. Historical points retain the two-input formula except the newest point, which includes the current news score when the dates match.
- **DCA formula**: Use the selected real BTC close points, sum `purchase_amount / close_price`, and value the accumulated units at the current Coinbase BTC quote. Fees and taxes are excluded and disclosed.

## Imagery
Imagery is not needed: this is a dense live numeric dashboard whose primary visual subjects are the gauge, charts, market rows, and calculators.

## Degraded states
- An unavailable primary market source falls back to the newest valid cached snapshot, visibly labeled stale.
- Unavailable news or whale feeds do not fabricate rows; their sections show an empty state.
- Optional coin products that fail individually are omitted while BTC remains required for the score and DCA math.


## Added portfolio and intelligence features
- **Portfolio tracker**: `portfolio_holdings` stores only user-entered symbol, quantity, and optional average cost. Live value and unrealized P/L are calculated in the client from the same current Coinbase quote data; the app never invents holdings or cost basis.
- **Derivatives**: The dashboard fetches BTC, ETH, and SOL perpetual mark price, last funding rate, next funding time, and open interest from Binance Futures public endpoints. Open-interest notional is calculated as units × mark price. If the venue is unavailable, the section stays empty and names the retry path.
- **On-chain signals**: The dashboard requests Bitcoin MVRV, exchange inflow/outflow, active-address, and transaction-count metrics from the Coin Metrics Community API. It calculates net flow as inflow minus outflow only when both observations are present. Missing metrics render as unavailable, never estimated.
- **Economic calendar and token unlocks**: Two targeted managed web searches retrieve upcoming US macro events and token unlocks. A bounded inference extraction keeps only future rows whose search result explicitly includes a full date; token unlock rows also require an explicit token and amount. Each rendered row links to the exact URL returned by search and preserves the source name. Ambiguous rows are omitted.
- **Device notifications**: `notification_preferences` stores the user's choices for price alerts, extreme market alerts, and weekly-digest notifications. The client requests browser notification permission only after an explicit button press and surfaces eligible notifications while the dashboard is open; all underlying alerts remain visible in-app if permission is denied or unsupported.
- **Weekly digest**: `getWeeklyMarketDigest` and `refreshWeeklyMarketDigest` generate a bilingual seven-day report from current dashboard history, sourced headlines, derivatives, on-chain readings, and verified calendars. The newest eight reports are retained in `weekly_market_digests`; generation failure falls back to the latest saved digest with a stale label.
