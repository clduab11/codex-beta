# syntax=docker/dockerfile:1.5

ARG NODE_VERSION=20-bookworm-slim
FROM node:${NODE_VERSION} AS base
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json package-lock.json ./
COPY config ./config
RUN npm prune --omit=dev && \
    mkdir -p logs && \
    chown -R node:node /app
VOLUME ["/app/logs", "/app/config"]
USER node
CMD ["node", "dist/index.js"]

FROM base AS development
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
