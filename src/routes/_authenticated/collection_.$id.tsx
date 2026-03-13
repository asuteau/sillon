import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/collection_/$id')({
  component: RecordDetail,
})

function RecordDetail() {
  const { id } = Route.useParams()

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <Link
        to="/collection"
        className="island-kicker rise-in mb-8 inline-flex items-center gap-1.5 no-underline"
      >
        ← Collection
      </Link>

      <article className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14" style={{ animationDelay: '60ms' }}>
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />

        <p className="island-kicker mb-3">—</p>
        <h1 className="display-title mb-8 text-4xl font-bold tracking-tight text-(--sea-ink) sm:text-5xl">
          {id}
        </h1>
      </article>
    </main>
  )
}
