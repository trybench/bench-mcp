# syntax=docker/dockerfile:1

# bench-mcp speaks stdio, so this image is for the hosted HTTP transport
# and for running the server in a container alongside an agent — not for
# local Claude Desktop or Claude Code, which run it via npx.

FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS deps
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /src/node_modules ./node_modules
COPY --from=build /src/dist ./dist
COPY package.json ./
USER node
ENTRYPOINT ["node", "dist/index.js"]
