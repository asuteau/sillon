// The problem Sillon solves; echoes the hero film's opening beat
export const LandingChallenge = () => (
  <section
    aria-labelledby="challenge-title"
    className="scroll-mt-20 border-t border-border py-14 sm:py-20"
  >
    <div className="flex max-w-2xl flex-col gap-4">
      <p className="type-caps text-[11px] text-muted-foreground">The problem</p>
      <h2
        id="challenge-title"
        className="type-display text-4xl text-balance text-foreground sm:text-5xl"
      >
        Discogs is a database, not a shelf.
      </h2>
      <div className="flex max-w-md flex-col gap-3 text-base text-muted-foreground">
        <p>
          Text rows, small thumbnails, a slow page on your phone in a shop. It
          knows every record, but nothing looks like yours.
        </p>
        <p>Sillon keeps Discogs as the source and puts the Cover first.</p>
      </div>
    </div>
  </section>
)
