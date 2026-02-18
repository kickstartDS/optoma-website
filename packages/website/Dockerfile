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

# With outputFileTracingRoot pointing to the monorepo root, Next.js standalone
# output mirrors the repo structure: .next/standalone/packages/website/server.js
# Copy the entire standalone tree, then layer static + public into the correct subpath.
COPY --from=builder --chown=1001:1001 /app/packages/website/.next/standalone ./
COPY --from=builder --chown=1001:1001 /app/packages/website/.next/static ./packages/website/.next/static
COPY --from=builder --chown=1001:1001 /app/packages/website/public ./packages/website/public

USER nextjs

EXPOSE 3030

ENV PORT=3030
ENV HOSTNAME="0.0.0.0"

CMD ["node", "packages/website/server.js"]
