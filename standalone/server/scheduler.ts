/**
 * In-process scheduler for the standalone server. No external cron needed.
 *
 * - Every hour: `refreshMarketData` + `refreshMarketIntelligence`
 * - Daily ~08:22 in `APP_TIMEZONE`: `refreshDailyMarketUpdate`
 * - Monday ~08:22 in `APP_TIMEZONE`: `refreshWeeklyMarketDigest`
 *
 * Each job computes its next run robustly (IANA timezone aware, DST safe),
 * catches and logs its own errors, and reschedules itself — a failing job
 * never crashes the process and never blocks the other jobs.
 */

import type { Ctx } from "./space-sdk-shim.js";
import { invokeHandler } from "./space-sdk-shim.js";
import { Actions } from "./.build/actions.js";

const DAY_MS = 86_400_000;

function partValue(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find((p) => p.type === type)?.value ?? "";
}

/** Offset (ms) to add to a UTC instant to get the wall clock in `timeZone`. */
function tzOffsetMs(timeZone: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const asUtc = Date.UTC(
    Number(partValue(parts, "year")),
    Number(partValue(parts, "month")) - 1,
    Number(partValue(parts, "day")),
    Number(partValue(parts, "hour")) % 24,
    Number(partValue(parts, "minute")),
    Number(partValue(parts, "second")),
  );
  return asUtc - utcMs;
}

const WEEKDAY_NUM: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Next UTC instant (ms) at which the wall clock in `timeZone` reads
 * `hour:minute`. When `weekday` (0=Sunday..6=Saturday) is given, only that
 * weekday qualifies. Always strictly in the future.
 */
export function nextDailyRunMs(
  hour: number,
  minute: number,
  timeZone: string,
  weekday?: number,
): number {
  const now = Date.now();
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const probe = new Date(now + dayOffset * DAY_MS);
    const dateParts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(probe);
    if (weekday !== undefined) {
      const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(probe);
      if (WEEKDAY_NUM[wd] !== weekday) continue;
    }
    const y = Number(partValue(dateParts, "year"));
    const mo = Number(partValue(dateParts, "month"));
    const d = Number(partValue(dateParts, "day"));
    if (!y || !mo || !d) continue;
    // Solve u + offset(u) = targetWall for u (two fixed-point iterations
    // keep this correct across DST transitions).
    const targetWallAsUtc = Date.UTC(y, mo - 1, d, hour, minute);
    let u = targetWallAsUtc - tzOffsetMs(timeZone, targetWallAsUtc);
    u = targetWallAsUtc - tzOffsetMs(timeZone, u);
    if (u > now) return u;
  }
  // Fallback: same time tomorrow (should be unreachable).
  return now + DAY_MS;
}

function logError(name: string, err: unknown): void {
  console.error(`[scheduler] ${name} failed: ${err instanceof Error ? err.message : String(err)}`);
}

function scheduleDaily(
  name: string,
  hour: number,
  minute: number,
  timeZone: string,
  weekday: number | undefined,
  job: () => Promise<unknown>,
): void {
  const arm = () => {
    let delay: number;
    try {
      delay = Math.max(0, nextDailyRunMs(hour, minute, timeZone, weekday) - Date.now());
    } catch (err) {
      logError(`${name} (scheduling)`, err);
      delay = DAY_MS;
    }
    console.log(`[scheduler] next ${name} in ${Math.round(delay / 60_000)} min`);
    setTimeout(() => {
      job().catch((err: unknown) => logError(name, err)).finally(arm);
    }, delay);
  };
  arm();
}

function scheduleHourly(name: string, job: () => Promise<unknown>, firstDelayMs: number): void {
  const tick = () => {
    job()
      .catch((err: unknown) => logError(name, err))
      .finally(() => {
        setTimeout(tick, 60 * 60 * 1_000);
      });
  };
  setTimeout(tick, firstDelayMs);
}

async function runMarketRefresh(ctx: Ctx): Promise<void> {
  await invokeHandler(Actions.refreshMarketData.handler, ctx, {});
  await invokeHandler(Actions.refreshMarketIntelligence.handler, ctx, {});
}

export function startScheduler(ctx: Ctx): void {
  const timeZone = (process.env.APP_TIMEZONE ?? "").trim() || "UTC";

  // Hourly market refresh; first run shortly after boot so a fresh VPS
  // populates its database without waiting an hour.
  scheduleHourly("hourly market refresh", () => runMarketRefresh(ctx), 15_000);

  // Daily market update ~08:22 in the configured timezone.
  scheduleDaily("daily market update", 8, 22, timeZone, undefined, () =>
    invokeHandler(Actions.refreshDailyMarketUpdate.handler, ctx, {}),
  );

  // Weekly digest Monday ~08:22 in the configured timezone.
  scheduleDaily("weekly market digest", 8, 22, timeZone, 1, () =>
    invokeHandler(Actions.refreshWeeklyMarketDigest.handler, ctx, {}),
  );

  process.on("unhandledRejection", (reason: unknown) => {
    console.error(
      `[scheduler] unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`,
    );
  });
}
