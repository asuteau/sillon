# Sillon

Personal vinyl record collection app, connected to Discogs.

## Stack

- [TanStack Start](https://tanstack.com/start) — full-stack React framework
- [TanStack Query](https://tanstack.com/query) — server state & caching
- [TanStack Router](https://tanstack.com/router) — file-based routing
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion/) — animations
- Discogs OAuth 1.0a — authentication & collection data
- Deezer API — HD cover art

## Features

- Browse and search your Discogs collection
- Wantlist with seller cross-referencing
- Progressive cover art loading
- Animated vinyl record detail view
- Random pick — ephemeral full-screen experience to pick an album to listen to
- PWA — installable, works offline
- Dark / light / system theme

## Status

Active development. See [`docs/roadmap.md`](docs/roadmap.md) for the phased plan.

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
