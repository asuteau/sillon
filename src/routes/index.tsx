import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: '/collection' })
  },
  component: App,
})

function App() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-16 sm:px-10 sm:py-24">
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-4">Your vinyl collection</p>
        <h1 className="display-title mb-6 max-w-2xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Every record you own, beautifully organized.
        </h1>
        <p className="mb-10 max-w-xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Sillon syncs your Discogs collection and pairs it with high-definition
          artwork from Deezer — all in one quiet, distraction-free place.
        </p>
        <a
          href="/auth/login"
          className="inline-block rounded-full border border-[rgba(50,143,151,0.4)] bg-[rgba(79,184,178,0.18)] px-7 py-3 text-base font-semibold text-(--lagoon-deep) no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.3)]"
        >
          Connect with Discogs
        </a>
      </section>
    </main>
  )
}
