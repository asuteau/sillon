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
- [Framer Motion](https://www.framer.com/motion/) — animations
- Discogs OAuth 1.0a — authentication & collection data
- Deezer API — HD cover art

## Features

- Browse your Discogs collection with fast virtualized scrolling
- Progressive cover art loading (color → thumbnail → HD)
- Animated vinyl record detail view
- Wantlist with followed seller cross-referencing
- **Surprise me** — a full-screen random pick experience
- PWA — installable on mobile, works offline while crate digging
- Dark / light / system theme

## Status

Active development — migrated from Remix to TanStack Start.
See [`docs/roadmap.md`](docs/roadmap.md) for the full phased plan.

## Development

```bash
pnpm install
pnpm dev
```

Requires a `.env` file with Discogs API credentials:

```bash
DISCOGS_CONSUMER_KEY=
DISCOGS_CONSUMER_SECRET=
SESSION_SECRET=
```
