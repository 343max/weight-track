# Use Bun base image
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend
RUN bun run build

# Build backend - compile server to standalone binary
RUN bun build server/main.ts --compile --outfile weight-tracker

# Install Caddy on a base that supports Bun binaries
FROM debian:12-slim AS runtime

# Install Caddy
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Caddy
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg \
    && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list \
    && apt-get update \
    && apt-get install -y caddy \
    && rm -rf /var/lib/apt/lists/*

# Copy built files from base
COPY --from=base /app/dist /var/www/html
COPY --from=base /app/weight-tracker /usr/local/bin/weight-tracker

# Copy Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Create data directory and set environment variables
RUN mkdir -p /data
ENV DATABASE_PATH=/data/tracker.db
ENV PORT=3001

# Expose port 3000 for Caddy
EXPOSE 3000

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo '# Start weight tracker server in background' >> /start.sh && \
    echo 'PORT=3001 DATABASE_PATH=/data/tracker.db /usr/local/bin/weight-tracker &' >> /start.sh && \
    echo '# Start Caddy in foreground' >> /start.sh && \
    echo 'exec caddy run --config /etc/caddy/Caddyfile' >> /start.sh && \
    chmod +x /start.sh

CMD ["/start.sh"]