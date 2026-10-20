<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/brand/readme-banner-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/brand/readme-banner-light.png">
  <img src="docs/brand/readme-banner-light.png" alt="Sillon: a copper groove next to the sillon wordmark and the tagline “Your Discogs collection, cover first.”" width="1280">
</picture>

# Sillon

Your Discogs collection, cover first: a personal app for picking what to play.

## Features

- **Collection** — your Discogs Collection and its Estimated value
- **Recent additions** — a Sleeve pull on Home: flip through your latest records, each disc sliding out of its sleeve
- **Vinyl colour** — each disc in its own colour and effect, read from the Discogs format notes, with its Disc count
- **Record screen** — one screen for every record, opened from Home, Random pick, Collection, Wantlist, Search or a Stack
- **Portrait** — your Collection as a whole: Top artists, Top styles, Pressing decade, Additions by year
- **Random pick** — one record from the whole Collection
- **Search** — artists, Discographies, Masters and Releases
- **Scan a Stack** — scan barcodes one after another, choose the pressing when a barcode matches several, add them all in one tap; a WebAssembly reader where the browser has no native one
- **Wantlist** — with a Fulfilled want prompt when a new record was on it
- **Marketplace** — Listing count, Lowest price and Suggested prices for a Release
- **Covers** — HD Covers from Deezer; a House sleeve when a record has none
- **PWA** — installable, Covers cached, works offline
- Light and dark, following the system or set by hand

## Design

_Sillon_ is French for the groove in a record. One spiral line is the mark,
the loader and the launch screen. Black, white and grey, with colour from
Covers and copper lacquer on brand moments. Square like a sleeve, round like a
record. See [`docs/design-system.md`](docs/design-system.md).

## Stack

- [TanStack Start](https://tanstack.com/start), [Router](https://tanstack.com/router) and [Query](https://tanstack.com/query)
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- Familjen Grotesk + Martian Mono, self-hosted
- Motion in CSS and the Web Animations API
- Discogs OAuth 1.0a for sign-in and Collection data
- Deezer API for HD Covers

## Development

```bash
pnpm install
pnpm dev                    # http://localhost:3000
pnpm test                   # vitest
pnpm check                  # prettier + eslint fix
pnpm generate:pwa-assets    # re-render icons, launch screens and README banners from the mark
```

Requires a `.env` file with Discogs API credentials:

```bash
DISCOGS_CONSUMER_KEY=
DISCOGS_CONSUMER_SECRET=
SESSION_SECRET=
```

## Status

In active development, migrated from Remix to TanStack Start.
The phased plan is in [`docs/roadmap.md`](docs/roadmap.md).
