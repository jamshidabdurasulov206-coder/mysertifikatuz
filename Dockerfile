# Dockerfile
# Production-ready Dockerfile is multi-stage

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Server package.json
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci

WORKDIR /app
# Frontend package.json
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
# Add legacy peer deps if React deps conflict
RUN npm install --legacy-peer-deps

WORKDIR /app
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner

WORKDIR /app

# Set node env
ENV NODE_ENV=production

# Copy server code and node_modules
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/src ./server/src
COPY --from=builder /app/server/utils ./server/utils
COPY --from=builder /app/server/migrations ./server/migrations
COPY --from=builder /app/server/migrate.js ./server/

# Copy built frontend output to serve it statically from backend
COPY --from=builder /app/frontend/build ./server/public

WORKDIR /app/server

EXPOSE 4000

# Optionally, add a script to run migrations & start server
# e.g.: CMD ["npm", "start"]
CMD ["node", "src/server.js"]
