# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json ./
RUN npm install --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

# Set environment variables (these should be overridden at runtime)
ENV NODE_ENV=production
ENV STORYBLOK_API_TOKEN=""
ENV STORYBLOK_OAUTH_TOKEN=""
ENV STORYBLOK_SPACE_ID=""
ENV OPENAI_API_KEY=""

# Health check (the server communicates via stdio, so we just check the process)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001 -G nodejs

USER mcp

# The MCP server communicates via stdio
ENTRYPOINT ["node", "dist/index.js"]
