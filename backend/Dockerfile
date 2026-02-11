FROM node:24.11.0-alpine3.22 AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install dependencies
RUN npm install --workspace=shared --workspace=backend

# Copy source code
COPY shared ./shared
COPY backend ./backend

# Build shared package
RUN npm run build --workspace=shared

# Build backend
RUN npm run build --workspace=backend

# Production stage
FROM node:24.11.0-alpine3.22

WORKDIR /app

# Copy package files
COPY package.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install production dependencies only
RUN npm install --workspace=shared --workspace=backend --omit=dev

# Copy built files
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/backend/dist ./backend/dist

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "dist/server.js"]
