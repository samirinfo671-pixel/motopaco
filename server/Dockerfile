FROM node:20-slim AS builder

WORKDIR /app

# Copy server package files
COPY server/package*.json ./
RUN npm ci

# Copy server source
COPY server/tsconfig.json ./
COPY server/src/ ./src/

# Build with esbuild
RUN npm run build

# ---- Production Stage ----
FROM node:20-slim

# Install sqlite3 CLI for database restore
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY server/src/db/schema.sql ./src/db/schema.sql
COPY server/src/db/seed.sql ./src/db/seed.sql
COPY server/uploads ./uploads

ENV PORT=5005
ENV NODE_ENV=production
# By default, store the database at /app/data/data.db so it can be mounted as a volume
ENV DATABASE_PATH=/app/data/data.db
EXPOSE 5005

# Entrypoint: restore seed.sql into the database if it doesn't exist yet, then start the server
CMD ["/bin/sh", "-c", "mkdir -p /app/data && if [ ! -f /app/data/data.db ]; then echo '[BOOT] No database found — restoring from seed.sql...' && sqlite3 /app/data/data.db < /app/src/db/seed.sql && echo '[BOOT] Database restored successfully.'; else echo '[BOOT] Existing database found — skipping restore.'; fi && node dist/index.js"]
