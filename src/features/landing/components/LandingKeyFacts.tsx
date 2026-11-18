const KEY_FACTS = [
  'Every record, an HD cover.',
  'Your Vinyl colour, read from Discogs.',
  'A whole Stack added in one tap.',
  'Nothing to import.',
] as const

// True product facts only: no metrics, no invented numbers
export const LandingKeyFacts = () => (
  <section
    aria-label="Key facts"
    className="flex flex-col gap-6 border-t border-border py-10 sm:py-12"
  >
    <ul className="m-0 grid list-none gap-4 p-0 text-base font-semibold text-foreground sm:grid-cols-2 md:grid-cols-4">
      {KEY_FACTS.map((fact) => (
        <li key={fact} className="text-balance">
          {fact}
        </li>
      ))}
    </ul>
    <p className="type-caps text-[11px] text-muted-foreground">
      Built on Discogs. HD covers from Deezer.
    </p>
  </section>
)
