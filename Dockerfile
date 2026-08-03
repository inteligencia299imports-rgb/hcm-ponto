# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* bun.lockb* ./
RUN npm install
COPY . .

# VITE_* vars are inlined into the client bundle at build time. They're read
# straight from the committed .env file (no .dockerignore excludes it), so
# no --build-arg plumbing is needed here.

# This app is TanStack Start (SSR via Nitro), whose default preset targets
# Cloudflare Workers for Lovable's own deploys. For a plain Docker container
# we need Nitro's standalone Node server preset instead.
ENV NITRO_PRESET=node-server
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
