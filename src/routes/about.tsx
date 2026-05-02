import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

const stack = [
  {
    name: 'TanStack Start',
    description: 'Over Remix and Next — cleanest DX I found',
    href: 'https://tanstack.com/start',
  },
  {
    name: 'TanStack Query',
    description: 'Server state & caching',
    href: 'https://tanstack.com/query',
  },
  {
    name: 'TanStack Router',
    description: 'File-based routing',
    href: 'https://tanstack.com/router',
  },
  {
    name: 'Tailwind CSS v4',
    description: 'Styling',
    href: 'https://tailwindcss.com',
  },
  {
    name: 'shadcn/ui',
    description: 'No custom design system, LLM-friendly',
    href: 'https://ui.shadcn.com',
  },
  {
    name: 'Framer Motion',
    description: 'Animations',
    href: 'https://www.framer.com/motion',
  },
  {
    name: 'Discogs API',
    description: 'Collection data, OAuth 1.0a',
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
        <h1 className="display-title mb-5 text-4xl font-bold tracking-tight text-(--sea-ink) sm:text-5xl">
          About Sillon
        </h1>
        <p className="mb-3 max-w-2xl text-base leading-relaxed text-(--sea-ink-soft)">
          A personal app to browse and rediscover my vinyl record collection.
          Built because existing apps felt cluttered or slow — none designed for
          the actual moment of crate-digging.
        </p>
        <p className="mb-3 max-w-2xl text-base leading-relaxed text-(--sea-ink-soft)">
          The name comes from the groove cut into a vinyl record.
        </p>
        <p className="max-w-2xl text-base leading-relaxed text-(--sea-ink-soft)">
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
        <h2 className="display-title mb-4 text-2xl font-bold tracking-tight text-(--sea-ink) sm:text-3xl">
          Solo, AI-augmented
        </h2>
        <div className="max-w-2xl space-y-3 text-base leading-relaxed text-(--sea-ink-soft)">
          <p>
            Sillon is built end-to-end by one person with an agentic workflow —
            from ticket spec to PR with generated tests and QA plans.
          </p>
          <p>
            The goal: spend less time typing code, more time on what actually
            matters — UX, performance, accessibility, edge cases.
          </p>
          <p>
            <em>A blog post is in the works.</em>
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
                className="flex flex-col items-start justify-between border-b border-(--line) py-3 no-underline last:border-0 hover:-translate-y-px sm:flex-row sm:items-center"
              >
                <span className="font-semibold text-(--sea-ink)">{name}</span>
                <span className="text-sm text-(--sea-ink-soft)">
                  {description}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-(--line) pt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-(--sea-ink-soft)">
            Why these choices
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-(--sea-ink-soft)">
            Shipped Remix in production at a previous client and hit friction
            with the actions/loaders model — sometimes you contort a real need
            to fit the framework's shape. Next's layered abstractions didn't
            appeal either. TanStack Start's composition (Start + Router + Query)
            felt right for this kind of app. shadcn was a no-brainer: didn't
            want to rebuild a design system, and it plays well with the AI
            workflow.
          </p>
        </div>
      </section>

      {/* Section 4 — About me */}
      <section
        className="island-shell rise-in mt-4 rounded-2xl p-6 sm:px-10 sm:py-8"
        style={{ animationDelay: '240ms' }}
      >
        <p className="island-kicker mb-3">About me</p>
        <p className="mb-4 max-w-2xl text-base leading-relaxed text-(--sea-ink-soft)">
          Aymeric Suteau — Frontend Software Engineer, 10 years in product-first
          SaaS B2B and e-commerce.
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          <a
            href="https://www.linkedin.com/in/aymeric-suteau"
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--lagoon-deep) no-underline hover:underline"
          >
            LinkedIn
          </a>
          <span className="text-(--sea-ink-soft)">·</span>
          <a
            href="https://github.com/asuteau"
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--lagoon-deep) no-underline hover:underline"
          >
            GitHub
          </a>
          <span className="text-(--sea-ink-soft)">·</span>
          <a
            href="mailto:aymeric.suteau.work@gmail.com"
            className="text-(--lagoon-deep) no-underline hover:underline"
          >
            Email
          </a>
        </div>
      </section>

      <div className="mt-6 flex flex-col items-center gap-2 sm:items-start">
        <p
          className="rise-in font-mono text-xs text-(--sea-ink-soft)"
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
