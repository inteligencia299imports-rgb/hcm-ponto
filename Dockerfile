# Build stage
# @tanstack/react-start requires Node >=22.12.0 and @supabase/auth-js requires
# >=22.0.0 (see package-lock.json engines) — Node 20 fails the install/build.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# `npm ci` fails here: its strict lockfile-sync check chokes on an unresolved
# *optional* peer dependency (lru-cache, pulled in transitively by Nitro's
# unstorage) that isn't recorded as its own entry in package-lock.json.
# `npm install` performs the same resolution without that rigid check.
RUN npm install

COPY . .

# Vite inlines these into the client AND server bundles at build time
# (import.meta.env.VITE_*), so they must be present as build args, not
# runtime env vars.
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_URL
ARG VITE_EXTERNAL_SUPABASE_URL
ARG VITE_EXTERNAL_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_EXTERNAL_SUPABASE_URL=$VITE_EXTERNAL_SUPABASE_URL \
    VITE_EXTERNAL_SUPABASE_ANON_KEY=$VITE_EXTERNAL_SUPABASE_ANON_KEY

# The Lovable TanStack Start config defaults Nitro's build target to
# Cloudflare; override it so `npm run build` emits a self-hostable Node
# server under .output/ instead.
RUN NITRO_PRESET=node-server npm run build

# Production stage — TanStack Start ships an SSR server (auth middleware,
# server functions, error handling), not a static SPA, so it needs a Node
# runtime rather than nginx serving files.
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
