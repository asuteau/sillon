# Sillon

A personal app to browse and rediscover my vinyl record collection.

Built because no existing app felt right — too cluttered, too slow, not designed
for the moment of standing in front of your records and picking something to play.
The name comes from the groove cut into a vinyl record.

## Stack

- [TanStack Start](https://tanstack.com/start) — full-stack React framework
- [TanStack Query](https://tanstack.com/query) — server state & caching
- [TanStack Router](https://tanstack.com/router) — file-based routing
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- Familjen Grotesk + Martian Mono, self-hosted — see [docs/design-system.md](docs/design-system.md)
- Motion: CSS + Web Animations API (no animation library)
- Discogs OAuth 1.0a — authentication & collection data
- Deezer API — HD cover art

## Features

- **Collection** — browse your Discogs Collection, with Recent additions and an Estimated value
- **Random pick** — one record drawn from the whole Collection, to answer "what do I play now?"
- **Search** — artists, Discographies, Masters and their Releases; scan a barcode to find a Release
- **Wantlist** — with a Fulfilled want prompt when a record you added was on it
- **Marketplace** — Listing count, Lowest price and suggested prices for a Release
- **Covers** — HD art from Deezer; a generated House sleeve when a record has none
- **PWA** — installable, cached covers, offline screen
- Light / dark theme following the system, with a manual override

## Design

Sillon means the groove in a record. The identity is built on it: a single
spiral line for the mark, the loader and the launch screen; black, white and
grey, with colour coming only from covers; square like a sleeve, round like a
record. See [`docs/design-system.md`](docs/design-system.md).

## Status

Active development — migrated from Remix to TanStack Start.
See [`docs/roadmap.md`](docs/roadmap.md) for the full phased plan.

## Development

```bash
pnpm install
pnpm dev                    # http://localhost:3000
pnpm test                   # vitest
pnpm check                  # prettier + eslint fix
pnpm generate:pwa-assets    # re-render icons and launch screens from the mark
```

Requires a `.env` file with Discogs API credentials:

```bash
DISCOGS_CONSUMER_KEY=
DISCOGS_CONSUMER_SECRET=
SESSION_SECRET=
```
