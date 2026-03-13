import { records } from '#/mocks/records'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

const recordQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['collection', id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 150))
      const record = records.find((r) => r.id === id)
      if (!record) throw new Error('Record not found')
      return record
    },
  })

export const Route = createFileRoute('/collection_/$id')({
  loader: ({ context: { queryClient }, params: { id } }) =>
    queryClient.ensureQueryData(recordQueryOptions(id)),
  component: RecordDetail,
})

function RecordDetail() {
  const { id } = Route.useParams()
  const { data: record } = useSuspenseQuery(recordQueryOptions(id))

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

        <p className="island-kicker mb-3">{record.artist}</p>
        <h1 className="display-title mb-8 text-4xl font-bold tracking-tight text-(--sea-ink) sm:text-5xl">
          {record.title}
        </h1>

        <div className="flex flex-col gap-3">
          <Row label="Année" value={String(record.year)} />
          <Row label="Label" value={record.label} />
          <Row label="ID" value={record.id} mono />
        </div>
      </article>
    </main>
  )
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between border-b border-(--line) py-2 last:border-0">
      <span className="text-sm text-(--sea-ink-soft)">{label}</span>
      <span className={`text-sm text-(--sea-ink) ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}
