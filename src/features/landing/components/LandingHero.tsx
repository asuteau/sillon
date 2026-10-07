import { GrooveMark } from '#/shared/components/brand/GrooveMark'
import { Wordmark } from '#/shared/components/brand/Wordmark'

import { ConnectWithDiscogs } from './ConnectWithDiscogs'
import { HeroAnimation } from './HeroAnimation'

// Sized to its content, not the viewport
export const LandingHero = () => (
  <section
    aria-labelledby="hero-title"
    className="grid items-center gap-10 pt-10 pb-14 sm:pt-16 sm:pb-20 md:grid-cols-[1.15fr_1fr] md:gap-14"
  >
    <div className="flex flex-col items-start gap-6">
      <div className="flex items-center gap-3 text-foreground">
        <GrooveMark size={44} />
        <Wordmark className="text-5xl" />
      </div>
      <h1
        id="hero-title"
        className="type-display text-5xl text-balance text-foreground sm:text-7xl"
      >
        Your Discogs collection, cover first.
      </h1>
      <p className="max-w-md text-base text-muted-foreground sm:text-lg">
        Sillon keeps your collection and wantlist in step with Discogs, shows
        every record with an HD cover and fits in your pocket.
      </p>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Sillon</span> — French
        for the groove in a record.
      </p>
      <ConnectWithDiscogs />
    </div>

    <HeroAnimation />
  </section>
)
