#!/usr/bin/env bun
/**
 * Standalone client build.
 *
 * Mirrors the hosted `client/build.mjs` (same `client/dist/` output) but:
 * - aliases `@hatch/space-sdk/client` to the local `standalone/sdk-client/`
 *   shim instead of the Muse-hosted SDK,
 * - stubs the `./theme.css` import out of the JS bundle and compiles it
 *   separately with the Tailwind v4 CLI (same `@import "tailwindcss"` +
 *   `@import "tailwindcss-safe-area"` source),
 * - rewrites `client/index.html` to reference the built assets.
 *
 * No file in `client/src` is modified.
 */

import { readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outdir = join(root, "client", "dist");

rmSync(outdir, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: [join(root, "client", "src", "main.tsx")],
  outdir,
  target: "browser",
  minify: true,
  splitting: true,
  sourcemap: "external",
  naming: {
    entry: "[name].js",
    chunk: "[name]-[hash].js",
    asset: "[name]-[hash].[ext]",
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  plugins: [
    {
      name: "space-sdk-alias",
      setup(build) {
        build.onResolve({ filter: /^@hatch\/space-sdk\/client$/ }, () => ({
          path: join(root, "standalone", "sdk-client", "index.ts"),
        }));
        // theme.css is compiled separately with the Tailwind CLI below;
        // keep it out of the JS bundle.
        build.onResolve({ filter: /theme\.css$/ }, () => ({
          path: join(root, "standalone", "build-client.mjs"),
          namespace: "css-stub",
        }));
      },
    },
    {
      name: "css-stub",
      setup(build) {
        build.onLoad({ filter: /.*/, namespace: "css-stub" }, () => ({
          contents: "export default {};",
          loader: "ts",
        }));
      },
    },
  ],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  throw new Error("client build failed");
}

// Compile Tailwind CSS with the v4 CLI (resolves `@import "tailwindcss"`
// and `@import "tailwindcss-safe-area"` from node_modules).
const tailwind = Bun.spawnSync(
  ["bun", "x", "--bun", "@tailwindcss/cli@4", "-i", join(root, "client", "src", "theme.css"), "-o", join(outdir, "theme.css"), "--minify"],
  { cwd: root, stdout: "pipe", stderr: "pipe" },
);
if (tailwind.exitCode !== 0) {
  console.error(tailwind.stderr.toString());
  throw new Error("tailwind CSS build failed");
}

// Rewrite index.html: bundle entry + compiled stylesheet.
const html = readFileSync(join(root, "client", "index.html"), "utf8")
  .replace('<script src="./src/main.tsx" type="module"></script>', '<script src="./main.js" type="module"></script>')
  .replace("</head>", '    <link rel="stylesheet" href="./theme.css" />\n  </head>');
await Bun.write(join(outdir, "index.html"), html);

console.log(`client built -> ${outdir}`);
