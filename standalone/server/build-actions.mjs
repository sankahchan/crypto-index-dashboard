#!/usr/bin/env bun
/**
 * Rewrite `server/src/actions.ts` for the standalone server.
 *
 * - `@hatch/space-sdk`  -> `../space-sdk-shim.js` (the local shim)
 * - `./schema`          -> `../../../server/src/schema.js` (unmodified source)
 *
 * The rewritten copy is written to `standalone/server/.build/actions.ts`.
 * `server/src` is never modified. `.build/` is gitignored and regenerated on
 * every build (Docker build included).
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const srcPath = join(root, "server", "src", "actions.ts");
const outDir = join(root, "standalone", "server", ".build");
const outPath = join(outDir, "actions.ts");

const src = readFileSync(srcPath, "utf8");

if (!src.includes('from "@hatch/space-sdk"')) {
  throw new Error(`expected SDK import not found in ${srcPath}`);
}
if (!src.includes('from "./schema"')) {
  throw new Error(`expected ./schema import not found in ${srcPath}`);
}

const out = src
  .replaceAll('"@hatch/space-sdk"', '"../space-sdk-shim.js"')
  .replaceAll('"./schema"', '"../../../server/src/schema.js"');

if (out.includes("@hatch/space-sdk")) {
  throw new Error("rewrite incomplete: @hatch/space-sdk still referenced");
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, out);
console.log(`rewrote ${srcPath} -> ${outPath}`);
