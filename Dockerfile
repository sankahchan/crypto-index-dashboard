# Standalone Crypto Index Dashboard — multi-stage Docker build.
#
# Stage 1 (builder): install deps with Bun, rewrite the server actions for the
# standalone runtime, build the client bundle, and typecheck the server.
# Stage 2 (runtime): minimal oven/bun image with only the built output and
# production runtime files. SQLite lives on a mounted volume (/app/data).

FROM oven/bun:1 AS builder
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json bun.lock ./
# The hosted-only `@hatch/space-sdk` tarball is not resolvable outside the
# Muse runtime; the standalone server/client use local shims instead
# (standalone/server/space-sdk-shim.ts, standalone/sdk-client/).
RUN bun -e 'const fs = require("node:fs"); const p = JSON.parse(fs.readFileSync("package.json", "utf8")); delete p.dependencies["@hatch/space-sdk"]; fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");' \
 && bun add -d bun-types

COPY . .

# Rewrite server/src/actions.ts for the standalone runtime (import shim only;
# server/src itself is never modified) and typecheck the standalone server.
RUN bun standalone/server/build-actions.mjs
RUN bun x tsc -p standalone/tsconfig.json

# Build the client bundle into client/dist/.
RUN bun standalone/build-client.mjs

# ---- Runtime ----
FROM oven/bun:1
WORKDIR /app
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV PORT=3000

COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/standalone ./standalone
COPY --from=builder /app/client/dist ./client/dist

VOLUME ["/app/data"]
EXPOSE 3000

HEALTHCHECK --interval=60s --timeout=10s --start-period=90s --retries=3 \
  CMD bun -e "const r = await fetch('http://127.0.0.1:3000/api/health'); if (!r.ok) process.exit(1)"

CMD ["bun", "standalone/server/index.ts"]
