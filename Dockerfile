# ============================================
# K3s Workshop Demo — CAP Dockerfile
# ============================================

# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production 2>/dev/null || npm install --only=production

# --- Stage 2: Production image ---
FROM node:20-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY srv/ ./srv/
COPY app/ ./app/
COPY db/ ./db/
COPY package.json ./

USER appuser

EXPOSE 4004

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4004/health || exit 1

CMD ["npm", "start"]
