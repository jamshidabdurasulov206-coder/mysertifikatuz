# Stage 1: Build frontend assets
FROM node:20-alpine AS builder

WORKDIR /app

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci

WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci --legacy-peer-deps

WORKDIR /app
COPY . .

WORKDIR /app/frontend
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

COPY --from=builder /app/server/src ./src
COPY --from=builder /app/server/migrations ./migrations
COPY --from=builder /app/server/migrate.js ./migrate.js
COPY --from=builder /app/server/createSupportTable.js ./createSupportTable.js

RUN mkdir -p /app/server/public /app/server/uploads/receipts
COPY --from=builder /app/frontend/build ./public

ENV PORT=4000

EXPOSE 4000

CMD ["sh", "-c", "node migrate.js && node src/server.js"]
