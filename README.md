![Anaroo](frontend/public/banner.svg)

[![Status](https://img.shields.io/badge/-Alpha-F97316?style=for-the-badge)](#)
[![Release](https://img.shields.io/github/v/release/adtommo/anaroo?color=60A5FA&label=release&style=for-the-badge)](https://github.com/adtommo/anaroo/releases)
[![Open Source](https://img.shields.io/badge/-Open%20Source-16A34A?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](https://opensource.org/)
[![License](https://img.shields.io/badge/-GPLv3-15803D?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/-PRs%20Welcome-22C55E?style=for-the-badge)](CONTRIBUTING.md)
[![Issues Welcome](https://img.shields.io/badge/-Issues%20Welcome-2563EB?style=for-the-badge)](https://github.com/adtommo/anaroo/issues)

[![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![SCSS](https://img.shields.io/badge/-SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white)](https://sass-lang.com/)
[![Vitest](https://img.shields.io/badge/-Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Cypress](https://img.shields.io/badge/-Cypress-17202C?style=for-the-badge&logo=cypress&logoColor=white)](https://www.cypress.io/)
[![Storybook](https://img.shields.io/badge/-Storybook-FF4785?style=for-the-badge&logo=storybook&logoColor=white)](https://storybook.js.org/)
[![Express](https://img.shields.io/badge/-Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/-Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

A fast-paced word unscrambling game with timed challenges, infinite survival mode, and daily puzzles. Compete on leaderboards, track your stats, and level up.

## Game Modes

- **Timed** -- Solve as many anagrams as you can before time runs out (30s / 60s / 120s).
- **Infinite Survival** -- Each correct answer keeps you alive; wrong answers cost time.
- **Daily Challenge** -- One word per day, same for everyone.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, TypeScript |
| Backend | Express, TypeScript |
| Database | MongoDB, Redis |
| Testing | Vitest, Cypress, Storybook |
| Deployment | Docker Compose |

## Quick Start

```bash
git clone https://github.com/adtommo/anaroo.git
cd anaroo
./quick-start.sh
```

Or manually:

```bash
npm install
npm run build --workspace=shared
cp backend/.env.example backend/.env
npm run dev
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for the full setup guide.

## Maintenance

This is a personal project maintained on a best-effort basis. It may not be actively developed long-term. Bug reports and feature requests are welcome via [issues](https://github.com/adtommo/anaroo/issues), but there is no guaranteed response timeline.

## Contributing

Pull requests are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[GPLv3](LICENSE)
