FROM node:24.11.0-alpine3.22 AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm install --workspace=packages/shared --workspace=frontend --legacy-peer-deps

# Copy source code
COPY packages/shared ./packages/shared
COPY frontend ./frontend

# Build shared package
RUN npm run build --workspace=packages/shared

# Build frontend
RUN npm run build --workspace=frontend

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]