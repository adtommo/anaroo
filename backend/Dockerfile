FROM node:24.11.0-alpine3.22 AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/

# Install dependencies
RUN npm install --workspace=packages/shared --workspace=backend

# Copy source code
COPY packages/shared ./packages/shared
COPY backend ./backend

# Build shared package
RUN npm run build --workspace=packages/shared

# Build backend
RUN npm run build --workspace=backend

# Production stage
FROM node:24.11.0-alpine3.22

WORKDIR /app

# Copy package files
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/

# Install production dependencies only
RUN npm install --workspace=packages/shared --workspace=backend --omit=dev

# Copy built files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/backend/dist ./backend/dist

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "dist/server.js"]