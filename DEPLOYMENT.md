# Deployment Guide

## Docker Images

Each release automatically publishes Docker images to GitHub Container Registry:

```
ghcr.io/adtommo/anaroo-backend:<version>
ghcr.io/adtommo/anaroo-frontend:<version>
```

Pull the latest:

```bash
docker pull ghcr.io/adtommo/anaroo-backend:latest
docker pull ghcr.io/adtommo/anaroo-frontend:latest
```

---

## Docker Compose (Recommended)

### Development

```bash
docker-compose up --build
```

### Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:7
    container_name: anaroo-mongo
    restart: always
    ports:
      - "127.0.0.1:27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: anaroo
    networks:
      - anaroo-network

  redis:
    image: redis:7-alpine
    container_name: anaroo-redis
    restart: always
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    networks:
      - anaroo-network

  backend:
    image: ghcr.io/adtommo/anaroo-backend:latest
    container_name: anaroo-backend
    restart: always
    ports:
      - "127.0.0.1:3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - MONGODB_URI=mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongo:27017/anaroo?authSource=admin
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - RATE_LIMIT_WINDOW_MS=1000
      - RATE_LIMIT_MAX_REQUESTS=100
    depends_on:
      - mongo
      - redis
    networks:
      - anaroo-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: ghcr.io/adtommo/anaroo-frontend:latest
    container_name: anaroo-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - anaroo-network

volumes:
  mongo-data:
  redis-data:

networks:
  anaroo-network:
    driver: bridge
```

Create a `.env` file:

```env
MONGO_USER=admin
MONGO_PASSWORD=<generate-strong-password>
REDIS_PASSWORD=<generate-strong-password>
JWT_SECRET=<generate-with: openssl rand -hex 32>
CORS_ORIGIN=https://yourdomain.com
```

Deploy:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Cloud Server (AWS EC2 / DigitalOcean)

### 1. Server setup

```bash
ssh ubuntu@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose -y
```

### 2. Deploy

```bash
# Copy docker-compose.prod.yml and .env to server, then:
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Reverse proxy with SSL

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Create `/etc/nginx/sites-available/anaroo`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/anaroo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Database Management

### Backup

```bash
# MongoDB
docker exec anaroo-mongo mongodump --out=/backup
docker cp anaroo-mongo:/backup ./mongodb-backup-$(date +%Y%m%d)

# Redis
docker exec anaroo-redis redis-cli BGSAVE
docker cp anaroo-redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

### Restore

```bash
# MongoDB
docker cp ./mongodb-backup anaroo-mongo:/backup
docker exec anaroo-mongo mongorestore /backup

# Redis
docker cp ./dump.rdb anaroo-redis:/data/dump.rdb
docker restart anaroo-redis
```

---

## Monitoring

```bash
# Service status
docker-compose -f docker-compose.prod.yml ps

# Logs
docker logs -f anaroo-backend
docker logs -f anaroo-mongo
docker logs -f anaroo-redis

# Resource usage
docker stats
```

---

## Security Checklist

- [ ] Strong passwords for MongoDB and Redis
- [ ] HTTPS with valid SSL certificate
- [ ] Firewall rules (only ports 80, 443, 22 open)
- [ ] `JWT_SECRET` generated with `openssl rand -hex 32`
- [ ] `CORS_ORIGIN` set to your domain (not `*`)
- [ ] Database ports bound to localhost only (`127.0.0.1:`)
- [ ] Regular backups scheduled
- [ ] Docker images pinned to release versions (not just `latest`)

---

## Updating

When a new release is published:

```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

Or pin a specific version in your compose file:

```yaml
backend:
  image: ghcr.io/adtommo/anaroo-backend:1.2.0
frontend:
  image: ghcr.io/adtommo/anaroo-frontend:1.2.0
```
