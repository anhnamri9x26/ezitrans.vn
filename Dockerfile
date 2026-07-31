FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ARG CORE_VERSION=0.1.0
ARG CORE_GIT_SHA=development
ARG CORE_BUILD_TIME=development
ARG CORE_IMAGE_DIGEST=
ENV CORE_VERSION=${CORE_VERSION}
ENV CORE_GIT_SHA=${CORE_GIT_SHA}
ENV CORE_BUILD_TIME=${CORE_BUILD_TIME}
ENV CORE_IMAGE_DIGEST=${CORE_IMAGE_DIGEST}
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY next.config.ts tsconfig.json postcss.config.mjs prisma.config.ts ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY public ./public
COPY src ./src
RUN npm run generate
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ARG CORE_VERSION=0.1.0
ARG CORE_GIT_SHA=development
ARG CORE_BUILD_TIME=development
ARG CORE_IMAGE_DIGEST=
ENV CORE_VERSION=${CORE_VERSION}
ENV CORE_GIT_SHA=${CORE_GIT_SHA}
ENV CORE_BUILD_TIME=${CORE_BUILD_TIME}
ENV CORE_IMAGE_DIGEST=${CORE_IMAGE_DIGEST}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache postgresql-client unzip \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/lib/generated ./src/lib/generated
COPY --from=builder /app/src/plugins ./src/plugins
COPY --from=builder /app/src/themes ./src/themes

RUN mkdir -p /app/public/uploads /app/content/uploads /app/content/plugins /app/content/themes /app/content/backups /app/content/upgrade-temp /app/content/logs \
  && chown -R nextjs:nodejs /app/content /app/public/uploads

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]
