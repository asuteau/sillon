import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

const stack = [
  {
    name: 'TanStack Start',
    description:
      'Over Remix and Next — cleanest DX I found (Router + server fns)',
    href: 'https://tanstack.com/start',
  },
  {
    name: 'TanStack Query',
    description: 'Server state, caching, optimistic updates',
    href: 'https://tanstack.com/query',
  },
  {
    name: 'Tailwind CSS v4',
    description: 'Styling, CSS-first tokens',
    href: 'https://tailwindcss.com',
  },
  {
    name: 'shadcn/ui + Base UI',
    description: 'No custom design system, LLM-friendly',
    href: 'https://ui.shadcn.com',
  },
  {
    name: 'vaul',
    description: 'Native-feeling mobile drawers',
    href: 'https://vaul.emilkowal.ski',
  },
  {
    name: 'Zod',
    description: 'Validation at API boundaries',
    href: 'https://zod.dev',
  },
  {
    name: 'PWA (vite-plugin-pwa)',
    description: 'Installable, offline fallback',
    href: 'https://vite-pwa-org.netlify.app',
  },
  {
    name: 'BarcodeDetector API',
    description: "Scan a sleeve's barcode, no library",
    href: 'https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector',
  },
  {
    name: 'Discogs API',
    description: 'Collection, wantlist, value — OAuth 1.0a',
    href: 'https://www.discogs.com/developers',
  },
  {
    name: 'Deezer API',
    description: 'HD cover art (Discogs covers too low-res)',
    href: 'https://developers.deezer.com',
  },
]

function About() {
  return (
    <main className="page-wrap px-4 pb-24 pt-14 sm:pb-8">
      {/* Section 1 — About Sillon */}
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">The project</p>
        <h1 className="display-title mb-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          About Sillon
        </h1>
        <p className="mb-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          A personal app to browse and rediscover my vinyl record collection.
          Built because existing apps felt cluttered or slow — none designed for
          the actual moment of crate-digging.
        </p>
        <p className="mb-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          The name comes from the groove cut into a vinyl record.
        </p>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          <em>
            It's also a personal lab — a place to push a modern stack and an
            AI-augmented build process without client constraints.
          </em>
        </p>
      </section>

      {/* Section 2 — How it's built */}
      <section
        className="island-shell rise-in mt-4 rounded-2xl p-6 sm:px-10 sm:py-8"
        style={{ animationDelay: '80ms' }}
      >
        <p className="island-kicker mb-3">How it's built</p>
        <h2 className="display-title mb-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Solo, AI-augmented
        </h2>
        <div className="max-w-2xl space-y-3 text-base leading-relaxed text-muted-foreground">
          <p>
            Sillon is built end-to-end by one person with an agentic workflow —
            from ticket spec to PR with generated tests and QA plans.
          </p>
          <p>
            The goal: spend less time typing code, more time on what actually
            matters — UX, performance, accessibility, edge cases.
          </p>
        </div>
      </section>

      {/* Section 3 — Stack notes */}
      <section
        className="island-shell rise-in mt-4 rounded-2xl p-6"
        style={{ animationDelay: '160ms' }}
      >
        <p className="island-kicker mb-4">Stack notes</p>
        <ul className="flex flex-col">
          {stack.map(({ name, description, href }) => (
            <li key={name}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-start justify-between border-b border-border py-3 no-underline last:border-0 hover:-translate-y-px sm:flex-row sm:items-center"
              >
                <span className="font-semibold text-foreground">{name}</span>
                <span className="text-sm text-muted-foreground">
                  {description}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Why these choices
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Shipped Remix in production at a previous client and hit friction
            with the actions/loaders model — sometimes you contort a real need
            to fit the framework's shape. Next's layered abstractions didn't
            appeal either. TanStack Start's composition (Start + Router + Query)
            felt right for this kind of app. shadcn was a no-brainer: didn't
            want to rebuild a design system, and it plays well with the AI
            workflow. Went PWA rather than native: one codebase, installable on
            my phone, good enough for a personal tool. Where the platform has an
            API (barcode scanning), I use it rather than pull a library.
          </p>
        </div>
      </section>

      {/* Section 4 — About me */}
      <section
        className="island-shell rise-in mt-4 rounded-2xl p-6 sm:px-10 sm:py-8"
        style={{ animationDelay: '240ms' }}
      >
        <p className="island-kicker mb-3">About me</p>
        <p className="mb-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Aymeric Suteau — Frontend Software Engineer, 10 years in software
          engineering, including 5 in product-first SaaS B2B and e-commerce.
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          <a
            href="https://www.linkedin.com/in/aymeric-suteau"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground no-underline hover:underline"
          >
            LinkedIn
          </a>
          <span className="text-muted-foreground">·</span>
          <a
            href="https://github.com/asuteau"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground no-underline hover:underline"
          >
            GitHub
          </a>
          <span className="text-muted-foreground">·</span>
          <a
            href="mailto:aymeric.suteau.work@gmail.com"
            className="text-foreground no-underline hover:underline"
          >
            Email
          </a>
        </div>
      </section>

      <div className="mt-6 flex flex-col items-center gap-2 sm:items-start">
        <p
          className="rise-in font-mono text-xs text-muted-foreground"
          style={{ animationDelay: '320ms' }}
        >
          v0.1.0 — active development
        </p>
        <p
          className="island-kicker rise-in"
          style={{ animationDelay: '360ms' }}
        >
          Built with ♥ for vinyl
        </p>
      </div>
    </main>
  )
}
