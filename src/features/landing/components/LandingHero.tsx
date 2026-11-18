import { ConnectWithDiscogs } from './ConnectWithDiscogs'
import { HeroFilm } from './HeroFilm'

// The headline and "Connect with Discogs" first, on the first paint; the
// film under them, the page's full width. From tablet widths up the whole
// hero fits above the fold: the film takes the height left under the
// header (4rem and its border) and the headline, at most 16:9 of the page.
// The Header carries the wordmark.
export const LandingHero = () => (
  <section aria-labelledby="hero-title" className="pb-10 sm:pb-14">
    <div className="flex flex-col md:max-h-[calc(100svh-4rem-1px)]">
      <div className="flex shrink-0 flex-col items-start gap-6 pt-10 pb-6 sm:pt-16 sm:pb-8 lg:grid lg:grid-cols-[minmax(0,38.75rem)_minmax(0,1fr)] lg:items-end lg:gap-x-12 lg:pt-8 lg:pb-6">
        <h1
          id="hero-title"
          className="max-w-4xl type-display text-5xl text-balance text-foreground sm:text-7xl"
        >
          Your Discogs collection, cover first.
        </h1>
        <div className="flex flex-col items-start gap-6 lg:gap-4">
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Sillon keeps your collection and wantlist in step with Discogs,
            shows every record with an HD cover and fits in your pocket.
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Sillon</span> —
            French for the groove in a record.
          </p>
          <ConnectWithDiscogs />
        </div>
      </div>

      {/* Out of the page's column, to the screen's edges */}
      <div className="mx-[calc(50%-50cqw)] flex md:min-h-80 md:flex-[0_1_min(56.25cqw,810px)]">
        <HeroFilm />
      </div>
    </div>
  </section>
)
