# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared dependency first
COPY shared/storyblok-services /app/shared/storyblok-services

# Copy package files
COPY mcp-server/package.json /app/mcp-server/

# Install dependencies
WORKDIR /app/mcp-server
RUN npm install

# Copy source code
COPY mcp-server/tsconfig.json ./
COPY mcp-server/src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy shared dependency and install its production dependencies
COPY --from=builder /app/shared/storyblok-services /app/shared/storyblok-services
WORKDIR /app/shared/storyblok-services
RUN npm install --omit=dev

# Copy package files and install production dependencies only
WORKDIR /app/mcp-server
COPY mcp-server/package.json ./
RUN npm install --omit=dev

# Copy built files
COPY --from=builder /app/mcp-server/dist ./dist

# Copy schemas (runtime dependency for auto-schema derivation)
COPY mcp-server/schemas/ ./schemas/

# Set environment variables (these should be overridden at runtime)
ENV NODE_ENV=production
ENV MCP_TRANSPORT=http
ENV MCP_PORT=8080
ENV STORYBLOK_API_TOKEN=""
ENV STORYBLOK_OAUTH_TOKEN=""
ENV STORYBLOK_SPACE_ID=""
ENV OPENAI_API_KEY=""

# Expose the HTTP port
EXPOSE 8080

# Health check against the /health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001 -G nodejs

USER mcp

# Start in HTTP mode
ENTRYPOINT ["node", "dist/index.js"]
