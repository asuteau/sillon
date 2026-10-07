import { GrooveMark } from '#/shared/components/brand/GrooveMark'
import { Wordmark } from '#/shared/components/brand/Wordmark'
import { HouseSleeve } from '#/shared/components/HouseSleeve'

import { LANDING_RECORDS } from '../landing.content'
import { ConnectWithDiscogs } from './ConnectWithDiscogs'

// Sized to its content, not the viewport. The grid is the still frame the hero
// animation (#17) will start from: House sleeves filling a Collection.
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

    <div
      data-slot="hero-still"
      inert
      className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3"
    >
      {LANDING_RECORDS.map((record) => (
        <HouseSleeve
          key={record.title}
          artist={record.artist}
          title={record.title}
          className="w-full shadow-[0_8px_24px_rgb(0_0_0/0.12)]"
        />
      ))}
    </div>
  </section>
)
