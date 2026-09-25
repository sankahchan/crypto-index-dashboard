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
- `api.bybit.com`
- `www.okx.com`
- `community-api.coinmetrics.io`
- `www.bls.gov`
- `crypto-corner.com`

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
- **Refresh policy**: `getDashboard` immediately serves the newest cached snapshot so opening the artifact never waits on the slowest external feed or inference step; it performs a synchronous live fetch only when no snapshot exists yet. The visible timestamp communicates the snapshot's age, a manual refresh control calls `refreshMarketData`, and the existing silent hourly artifact-action schedule prefetches the same action. The Markets tab separately calls `refreshMarketIntelligence` on first entry when any intelligence feed is empty and also exposes a dedicated retry button, so recovering these optional feeds does not wait on every coin, news, and dashboard source. `getDailyMarketUpdate` serves a report for up to 20 hours, while `refreshDailyMarketUpdate` regenerates on demand and through the managed daily artifact-action schedule at approximately 8:22 AM in the user's current timezone.
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
- **Derivatives**: The dashboard fetches BTC, ETH, and SOL perpetual mark price, last funding rate, next funding time, and open interest from Binance Futures public endpoints. If a Binance symbol request fails, it falls back first to Bybit's public v5 linear-ticker endpoint, whose response carries all four readings together, and then to the equivalent OKX USDT perpetual using the public funding-rate, open-interest, and ticker endpoints on `www.okx.com`. Each row names the venue that actually supplied it. If all three venues are unavailable, the UI marks the source unavailable and preserves any saved row as stale instead of presenting it as current.
- **On-chain signals**: The dashboard requests Bitcoin MVRV, exchange inflow/outflow, active-address, and transaction-count metrics from the Coin Metrics Community API. It calculates net flow as inflow minus outflow only when both observations are present. Missing metrics render as unavailable, never estimated.
- **Economic calendar and token unlocks**: The economic calendar first reads and parses the official U.S. Bureau of Labor Statistics 2026 release schedule at `https://www.bls.gov/schedule/2026/`, filtering major labor and inflation releases to the explicit 35-day window. The token calendar first reads and parses the dated Sep/Oct 2026 schedule at `https://crypto-corner.com/2026/09/22/upcoming-token-unlocks-sep-oct-2026/`, retaining only rows with a named token, exact date, and amount. If either direct source has no qualifying future rows, its existing targeted managed search and bounded extraction path runs independently, so one feed cannot erase the other. Each rendered row links to the exact source URL. A successful source read with no qualifying rows is shown as “no upcoming events,” while retrieval/extraction failure is shown as “source unavailable”; ambiguous rows are omitted.
- **Informing URLs verified during this resilience update**: OKX public funding and open-interest responses were validated at `https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP` and `https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=BTC-USDT-SWAP`; the fallback also uses the corresponding ticker response at `https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT-SWAP`. Upcoming calendar extraction was informed by `https://wellsfargo.bluematrix.com/links2/pdf/fc2ebe60-9ab5-4651-b108-f9bbfed201d0`, `https://statspolicy.gov/assets/fcsm/files/docs/OMB_pfei_schedule_release_dates_cy2026.pdf`, and `https://crypto-corner.com/2026/09/22/upcoming-token-unlocks-sep-oct-2026/`. These URLs document the shape and availability of real current data; runtime rows still come only from live responses and returned search results.
- **Device notifications**: `notification_preferences` stores the user's choices for price alerts, extreme market alerts, and weekly-digest notifications. The client requests browser notification permission only after an explicit button press and surfaces eligible notifications while the dashboard is open; all underlying alerts remain visible in-app if permission is denied or unsupported.
- **Weekly digest**: `getWeeklyMarketDigest` and `refreshWeeklyMarketDigest` generate a bilingual seven-day report from current dashboard history, sourced headlines, derivatives, on-chain readings, and verified calendars. The newest eight reports are retained in `weekly_market_digests`; generation failure falls back to the latest saved digest with a stale label.


## Trading Signals addition (2026-09-25)
- **User request**: add a bilingual Trading Signals section combining technical indicators (RSI, MACD, moving-average crossover) with an AI assessment over price, news sentiment, and on-chain context.
- **Live price history**: `getTradingSignal` and `refreshTradingSignal` fetch daily candles from the already-declared Coinbase Exchange host for the selected BTC, ETH, or SOL market. The service computes RSI (14), MACD (12/26/9), and SMA 20/50 from returned closes; it does not fabricate missing candles.
- **AI assessment**: `ctx.inference.complete` receives only the calculated technical readings, current cached quote/change, classified news aggregate, and verified on-chain snapshot. BTC uses the existing Coin Metrics on-chain feed when present. ETH and SOL explicitly mark on-chain input unavailable and require the assessment to lower confidence rather than invent a reading.
- **Cache**: generated reports are stored per symbol in `trading_signal_snapshots`, reused for 15 minutes, and pruned to the newest 24 rows per symbol. Generated time and underlying market time are both shown.
- **Failure behavior**: a failed refresh returns the latest saved signal as stale; if no saved signal exists, the UI shows an honest unavailable state with a retry control.


## Seven-feature reliability and analysis extension (2026-09-25)
- **User request**: add all seven requested fixes/features, keep Burmese and English available, and make the artifact work without errors.
- **Cycle position**: the client synchronizes its selected detail stage whenever the automatically calculated stage changes, so the current marker and explanatory text cannot drift apart after a refresh. Manual exploration remains available between automatic stage changes.
- **Multi-timeframe trading signals**: each BTC, ETH, or SOL signal now reads Coinbase 1-hour and 1-day candles. The service calculates 1H indicators directly, deterministically aggregates consecutive 1-hour rows into 4H OHLCV candles, and calculates 1D indicators from daily rows. RSI (14), MACD (12/26/9), and SMA 20/50 are computed independently for 1H, 4H, and 1D. The AI assessment receives all three frames and must lower confidence when frames disagree. Older saved daily-only reports remain readable and prompt a refresh for the three-frame view.
- **ETF flows**: `refreshMarketData` and `refreshMarketIntelligence` run a targeted managed search for daily aggregate U.S. spot BTC and ETH ETF net flows. Bounded extraction retains only rows with an explicit full trading date, signed aggregate USD flow, asset, and returned source URL, preferring finalized SoSoValue/Farside-attributed aggregates. Conflicting or ambiguous rows are omitted rather than averaged. The UI keeps source links and shows an honest empty or unavailable state. Recent source behavior was informed by `https://www.theblock.co/news/markets/2026-09-22-spot-bitcoin-etfs-1-billion-daily-inflow-416005`, `https://coinomedia.com/bitcoin-etf-inflows-9/`, `https://coincentral.com/ethereum-eth-price-whales-return-to-buying-as-etf-inflows-hit-fourth-straight-day/`, `https://cryptocompass.com/articles/bitcoin-etf-inflows-hit-999m-as-ether-funds-add-270m`, and `https://mytokencap.com/en/news/597585.html`; runtime rows still come only from current returned search results.
- **BTC liquidation levels**: runtime managed search and bounded extraction retain only explicitly published BTC liquidation clusters with a price, long-below/short-above side, USD magnitude, timeframe, and exact returned source URL. Support, resistance, order-book liquidity, and unquantified targets are excluded. The responsive Recharts bar view starts at zero and is built from the same rows shown beneath it. No historical liquidation series is claimed because Binance’s official WebSocket feeds only publish snapshots after subscription: `https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/Liquidation-Order-Streams` and `https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/All-Market-Liquidation-Order-Streams`.
- **Signal-change notifications**: `notification_preferences.signal_alerts` stores the explicit user toggle. After a newly generated signal is saved, its verdict is compared with the previous saved verdict; only an actual change creates `trading_signal_events`, and only when the toggle is enabled. Events remain visible and dismissible in-app. Browser notifications are attempted only while the dashboard is open and permission was explicitly granted.
- **Portfolio vs BTC**: `portfolio_holdings.acquired_on` stores the optional acquisition/benchmark date the user enters. The comparison includes only holdings with quantity, cost basis, current value, and an acquisition date covered by the saved BTC close history. For each eligible holding it compares the current portfolio value with the value of BTC purchased using the same invested USD on the same date; rows that cannot be matched are omitted and the UI explains the requirement. No acquisition date is inferred for existing rows.
- **BTC/ETH/SOL long-term DCA guide**: the client provides clearly labeled educational BTC-led (60/30/10), balanced (55/30/15), and growth-tilted (50/30/20) allocation models. Dollar amounts derive from the DCA amount and frequency entered directly above; no market prices or user holdings are invented. The UI explains the roles and volatility tradeoff and labels the output as educational, not personalized investment advice.
