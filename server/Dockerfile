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

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY server/src/db/schema.sql ./src/db/schema.sql

ENV PORT=5005
ENV NODE_ENV=production
EXPOSE 5005

CMD ["node", "dist/index.js"]
