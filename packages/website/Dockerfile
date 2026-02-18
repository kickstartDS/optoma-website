FROM node:18-alpine AS base

# Disabling Telemetry
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat curl
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps
WORKDIR /app

# Copy workspace config files first for layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc package.json ./
# Copy package.json files for all required workspace packages
COPY packages/storyblok-services/package.json ./packages/storyblok-services/
COPY packages/website/package.json ./packages/website/
RUN pnpm install --frozen-lockfile

FROM base AS builder
ARG NEXT_STORYBLOK_SPACE_ID
ENV NEXT_STORYBLOK_SPACE_ID=$NEXT_STORYBLOK_SPACE_ID
ARG NEXT_STORYBLOK_API_TOKEN
ENV NEXT_STORYBLOK_API_TOKEN=$NEXT_STORYBLOK_API_TOKEN
ARG NEXT_STORYBLOK_OAUTH_TOKEN
ENV NEXT_STORYBLOK_OAUTH_TOKEN=$NEXT_STORYBLOK_OAUTH_TOKEN
ARG NEXT_OPENAI_API_KEY
ENV NEXT_OPENAI_API_KEY=$NEXT_OPENAI_API_KEY
WORKDIR /app
COPY --from=deps /app ./
# Copy source for shared lib and website
COPY packages/storyblok-services/ ./packages/storyblok-services/
COPY packages/website/ ./packages/website/

# Build shared lib first, then website
RUN pnpm --filter @kickstartds/storyblok-services run build
RUN pnpm --filter @kickstartds/storyblok-starter-premium run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/packages/website/public ./public
RUN mkdir .next
RUN chown 1001:1001 .next

COPY --from=builder --chown=1001:1001 /app/packages/website/.next/standalone ./
COPY --from=builder --chown=1001:1001 /app/packages/website/.next/static ./.next/static
COPY --from=builder --chown=1001:1001 /app/packages/website/public ./public

USER nextjs

EXPOSE 3030

ENV PORT=3030
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
