# Development Guide

## Setup

### Prerequisites

- Node.js 20+
- Docker Desktop (for MongoDB and Redis)
- Git

### First-time setup

```bash
git clone git@github.com:adtommo/anaroo.git
cd anaroo
npm install
```

Start MongoDB and Redis:

```bash
docker run -d -p 27017:27017 --name mongo-dev mongo:7
docker run -d -p 6379:6379 --name redis-dev redis:7-alpine
```

Configure the backend:

```bash
cp backend/.env.example backend/.env
```

Build the shared package (backend and frontend depend on it):

```bash
npm run build --workspace=packages/shared
```

### Running locally

```bash
# Both servers at once
npm run dev

# Or separately
npm run dev:backend   # http://localhost:3001
npm run dev:frontend  # http://localhost:5173
```

## Project Structure

```
anaroo/
├── packages/shared/         # @anaroo/shared — types, modes, scoring, hints, XP
├── backend/                 # @anaroo/backend — Express API
│   ├── src/
│   │   ├── models/          # MongoDB schemas (User, Run, BestScore, AnagramGroup)
│   │   ├── services/        # Business logic (score, leaderboard, daily, redis, stats)
│   │   ├── routes/          # API endpoints
│   │   └── server.ts
│   └── Dockerfile
├── frontend/                # @anaroo/frontend — React SPA
│   ├── src/
│   │   ├── components/      # UI components (Daily, TimedMode, InfiniteSurvival, etc.)
│   │   ├── contexts/        # AuthContext, ThemeContext, GameSettingsContext
│   │   ├── hooks/           # useDaily, useTimedMode, useInfiniteSurvival
│   │   └── services/        # API client
│   ├── cypress/             # E2E tests
│   ├── Dockerfile
│   └── nginx.conf
├── .github/                 # CI/CD workflows, issue templates, security policy
├── release-please-config.json
└── docker-compose.yml
```

### Workspace dependencies

The shared package must be built before backend or frontend can compile:

```
packages/shared  →  backend
                 →  frontend
```

If you change shared code, rebuild it: `npm run build --workspace=packages/shared`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run build` | Build shared → backend → frontend |
| `npm test` | Run all workspace tests |
| `npm run test:shared` | Test shared package only |
| `npm run test:backend` | Test backend only |
| `npm run test:frontend` | Test frontend only |
| `npm run storybook` | Launch Storybook on port 6006 |
| `npm run cy:open` | Open Cypress test runner |
| `npm run docker:build` | Build Docker images |
| `npm run docker:up` | Start all containers |

## Testing

Unit tests use Vitest across all workspaces:

```bash
npm test                           # all workspaces
npm run test:frontend              # frontend only
npm run test:backend               # backend only
npm run test --workspace=packages/shared  # shared only
```

E2E tests use Cypress (requires dev servers running):

```bash
npm run cy:open   # interactive
npm run cy:run    # headless
```

Component stories:

```bash
npm run storybook
```

## Theming

Colors are managed entirely in `frontend/src/contexts/ThemeContext.tsx`. The CSS uses `var(--main-color)` etc. but the values are set by ThemeContext at runtime. Available themes: dark (default), light, midnight, forest, sunset.

To add a theme:
1. Add the theme to `THEMES` in `packages/shared/src/xp.ts`
2. Add color vars to `THEME_VARS` in `frontend/src/contexts/ThemeContext.tsx`

## Git Workflow

### Branching

- `main` — production-ready, CI runs on every push
- `feature/*`, `fix/*` — branch from `main`, PR back to `main`

### Commit Messages

Use [conventional commits](https://www.conventionalcommits.org/) — release-please uses these to auto-determine version bumps:

```
feat: add multiplayer mode          → minor bump (1.0.0 → 1.1.0)
fix: correct combo streak scoring   → patch bump (1.0.0 → 1.0.1)
feat!: redesign auth system         → major bump (1.0.0 → 2.0.0)
chore: update dependencies          → no release
docs: update README                 → no release
```

### Pull Requests

1. Create a branch from `main`
2. Make changes, write tests
3. Push and open a PR — CI runs automatically
4. The PR template has a checklist to follow
5. Merge when CI passes

### Releases

Handled automatically by [release-please](https://github.com/googleapis/release-please):

1. Push conventional commits to `main`
2. release-please opens a "Release PR" with changelog and version bump
3. Review and merge the Release PR
4. A git tag, GitHub Release, and Docker images are created automatically

## Common Issues

**"Cannot find module '@anaroo/shared'"**
→ Build the shared package: `npm run build --workspace=packages/shared`

**MongoDB connection error**
→ Check it's running: `docker ps | grep mongo` — start it: `docker start mongo-dev`

**Redis connection failed**
→ Start Redis: `docker start redis-dev`

**Frontend API calls failing**
→ Check backend is running on port 3001, verify `CORS_ORIGIN` in `backend/.env`, check proxy in `frontend/vite.config.ts`

## Debugging

### Backend

```bash
# View logs in dev (tsx watch auto-restarts)
npm run dev:backend
```

### Database

```bash
# MongoDB shell
docker exec -it mongo-dev mongosh
use anaroo
db.users.find()

# Redis CLI
docker exec -it redis-dev redis-cli
KEYS leaderboard:*
```

### Frontend

Use React DevTools browser extension to inspect component state and props.
