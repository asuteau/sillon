import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

const stack = [
  {
    name: 'TanStack Start',
    description: 'Full-stack React framework',
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
    name: 'Framer Motion',
    description: 'Animations',
    href: 'https://www.framer.com/motion',
  },
  {
    name: 'Discogs API',
    description: 'Collection data & authentication',
    href: 'https://www.discogs.com/developers',
  },
  {
    name: 'Deezer API',
    description: 'HD cover art',
    href: 'https://developers.deezer.com',
  },
]

function About() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">The project</p>
        <h1 className="display-title mb-5 text-4xl font-bold tracking-tight text-(--sea-ink) sm:text-5xl">
          About Sillon
        </h1>
        <p className="mb-3 max-w-2xl text-base leading-relaxed text-(--sea-ink-soft)">
          A personal app to browse and rediscover my vinyl record collection.
          Built because no existing app felt right — too cluttered, too slow,
          not designed for the moment of standing in front of your records and
          picking something to play.
        </p>
        <p className="max-w-2xl text-base leading-relaxed text-(--sea-ink-soft)">
          The name comes from the groove cut into a vinyl record.
        </p>
      </section>

      <section
        className="island-shell rise-in mt-4 rounded-2xl p-6"
        style={{ animationDelay: '80ms' }}
      >
        <p className="island-kicker mb-4">Built with</p>
        <ul className="flex flex-col">
          {stack.map(({ name, description, href }) => (
            <li key={name}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-(--line) py-3 no-underline last:border-0 hover:-translate-y-px"
              >
                <span className="font-semibold text-(--sea-ink)">{name}</span>
                <span className="text-sm text-(--sea-ink-soft)">
                  {description}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p
        className="rise-in mt-6 font-mono text-xs text-(--sea-ink-soft)"
        style={{ animationDelay: '160ms' }}
      >
        v0.1.0 — active development
      </p>
    </main>
  )
}
