# syntax=docker/dockerfile:1

# For the hosted HTTP transport (ECS) and for running the server in a
# container alongside an agent. Local Claude Desktop and Claude Code run
# it via npx instead, over stdio.
#
# Both `npm ci` calls pass --ignore-scripts deliberately. package.json has
# a `prepare` script (npm run build) so that publishing to npm always
# ships freshly compiled output, but npm runs `prepare` on install too —
# which breaks here in both directions: the build stage installs before
# tsconfig.json and src/ exist, and the deps stage has no TypeScript to
# compile with. The build below is invoked explicitly instead.

FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS deps
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /src/node_modules ./node_modules
COPY --from=build /src/dist ./dist
COPY package.json ./
USER node
EXPOSE 8080
ENTRYPOINT ["node", "dist/index.js"]
