import { ConnectWithDiscogs } from './ConnectWithDiscogs'
import { HeroFilm } from './HeroFilm'

// The headline and "Connect with Discogs" first, on the first paint; the
// film under them, the page's full width. The Header carries the wordmark.
export const LandingHero = () => (
  <section aria-labelledby="hero-title" className="pt-10 sm:pt-16">
    <div className="flex flex-col items-start gap-6 pb-6 sm:pb-8">
      <h1
        id="hero-title"
        className="max-w-4xl type-display text-5xl text-balance text-foreground sm:text-7xl"
      >
        Your Discogs collection, cover first.
      </h1>
      <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
        Sillon keeps your collection and wantlist in step with Discogs, shows
        every record with an HD cover and fits in your pocket.
      </p>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Sillon</span> — French
        for the groove in a record.
      </p>
      <ConnectWithDiscogs />
    </div>

    {/* Out of the page's column, to the screen's edges */}
    <div className="mx-[calc(50%_-_50vw)] pb-10 sm:pb-14">
      <HeroFilm />
    </div>
  </section>
)
