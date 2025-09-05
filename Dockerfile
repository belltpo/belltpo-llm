# Simple Dockerfile for AnythingLLM - Single Container Deployment
FROM node:18-alpine

# Install system dependencies including OpenSSL
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    curl \
    bash \
    supervisor \
    openssl \
    openssl-dev

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY server/package*.json ./server/
COPY collector/package*.json ./collector/
COPY frontend/package*.json ./frontend/
COPY embed/package*.json ./embed/

# Install dependencies for each service separately
RUN cd server && npm install --production --legacy-peer-deps
RUN cd collector && npm install --production --legacy-peer-deps
RUN cd frontend && npm install --legacy-peer-deps
RUN cd embed && npm install --legacy-peer-deps

# Copy source code
COPY server/ ./server/
COPY collector/ ./collector/
COPY frontend/ ./frontend/
COPY embed/ ./embed/

# Build frontend and embed
RUN cd frontend && npm run build
RUN cd embed && npm run build

# Create app user
RUN addgroup -g 1001 -S anythingllm && \
    adduser -S anythingllm -u 1001

# Create necessary directories
RUN mkdir -p /app/server/storage/documents/custom-documents && \
    mkdir -p /app/collector/hotdir && \
    mkdir -p /app/server/storage/vector-cache && \
    mkdir -p /app/server/storage/direct-uploads && \
    mkdir -p /app/server/storage/logs && \
    mkdir -p /var/log/supervisor && \
    chown -R anythingllm:anythingllm /app

# Setup Prisma with OpenSSL environment
WORKDIR /app/server
ENV OPENSSL_CONF=/etc/ssl/openssl.cnf
RUN npx prisma generate

# Create supervisor configuration
COPY <<EOF /etc/supervisor/conf.d/anythingllm.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:anythingllm-server]
command=node index.js
directory=/app/server
user=anythingllm
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/server.err.log
stdout_logfile=/var/log/supervisor/server.out.log
environment=NODE_ENV=production,STORAGE_DIR=/app/server/storage

[program:anythingllm-collector]
command=node working-collector-final.js
directory=/app/collector
user=anythingllm
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/collector.err.log
stdout_logfile=/var/log/supervisor/collector.out.log
environment=NODE_ENV=production,STORAGE_DIR=/app/server/storage,COLLECTOR_PORT=8888
EOF

# Create entrypoint script
COPY <<EOF /usr/local/bin/docker-entrypoint.sh
#!/bin/bash
set -e

# Create supervisor log directory
mkdir -p /var/log/supervisor

# Set OpenSSL environment variables
export OPENSSL_CONF=/etc/ssl/openssl.cnf

# Initialize database if it doesn't exist
if [ ! -f "/app/server/storage/anythingllm.db" ]; then
    echo "Initializing database..."
    cd /app/server
    npx prisma migrate deploy
    npx prisma db seed
fi

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/anythingllm.conf
EOF

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to app user
USER anythingllm

# Expose ports
EXPOSE 3001 8888

# Set environment variables
ENV NODE_ENV=production
ENV STORAGE_DIR=/app/server/storage
ENV COLLECTOR_PORT=8888
ENV SERVER_PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/api/ping || exit 1

WORKDIR /app

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
