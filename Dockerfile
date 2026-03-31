#
# Multi-stage build:
# 1) Build Vite client
# 2) Install server deps + copy client dist, run server
#

FROM node:20-bookworm-slim AS client-build
WORKDIR /app/client

COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ ./
RUN npm run build


FROM node:20-bookworm-slim AS server
ENV NODE_ENV=production
WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY server/ ./

# Copy built frontend into expected path
COPY --from=client-build /app/client/dist /app/client/dist

EXPOSE 8080
CMD ["node", "index.js"]

