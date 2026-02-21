FROM node:24.11.0-alpine3.22 AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm install --workspace=shared --workspace=frontend --legacy-peer-deps

# Copy source code
COPY shared ./shared
COPY frontend ./frontend

# Build shared package
RUN npm run build --workspace=shared

# Build frontend (Vite inlines these at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_API_URL
ARG VITE_ADSENSE_CLIENT
RUN npm run build --workspace=frontend

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration as a template (uses envsubst for dynamic PORT/BACKEND_URL)
COPY frontend/nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

# envsubst replaces ${PORT} and ${BACKEND_URL} at container start;
# other nginx variables ($uri etc.) are left untouched
ENV PORT=80
ENV BACKEND_URL=http://backend:3001

CMD ["/bin/sh", "-c", "envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
