import { CollectionStill } from './CollectionStill'
import { LinerNotes } from './LinerNotes'
import { PortraitStill } from './PortraitStill'
import { FeatureSection } from './FeatureSection'
import { LandingCta } from './LandingCta'
import { LandingHero } from './LandingHero'
import { RandomPickStill } from './RandomPickStill'
import { ScanStill } from './ScanStill'
import { WantlistStill } from './WantlistStill'

// The signed-out `/`: show the product, then "Connect with Discogs"
export const LandingPage = () => (
  <main className="mx-auto w-full max-w-270 px-4 pb-8">
    <LandingHero />

    <FeatureSection
      id="collection"
      label="Collection"
      title="Your collection, in HD."
      still={<CollectionStill />}
    >
      <p>
        Sillon reads your Discogs collection and finds an HD cover for every
        record. Sort by date added, artist, title or year.
      </p>
      <p>
        No cover anywhere? The record gets a house sleeve, set in type with its
        artist and title.
      </p>
    </FeatureSection>

    <FeatureSection
      id="portrait"
      label="Portrait"
      title="Your collection, in numbers."
      still={<PortraitStill />}
      flip
    >
      <p>
        Portrait reads every record you own: what the collection is worth on
        Discogs, the artists you keep coming back to, the decades your pressings
        come from.
      </p>
      <p>The leader of each chart is set in copper.</p>
    </FeatureSection>

    <FeatureSection
      id="wantlist"
      label="Wantlist"
      title="Your wantlist, fulfilled."
      still={<WantlistStill />}
    >
      <p>
        Your wantlist sits next to your collection. Add the exact release you
        were after and it becomes a fulfilled want: Sillon offers to take it off
        the wantlist.
      </p>
      <p>It never removes it on its own. You may still want a spare.</p>
    </FeatureSection>

    <FeatureSection
      id="scan"
      label="Barcode scanning"
      title="Scan the sleeve."
      still={<ScanStill />}
      flip
    >
      <p>
        In the shop, point your phone at the barcode on the back. Sillon finds
        the release on Discogs, ready to add to your collection or your
        wantlist.
      </p>
      <p>
        Back home with a stack? Flip through it: every sleeve piles up, and one
        tap adds them all.
      </p>
    </FeatureSection>

    <FeatureSection
      id="random-pick"
      label="Random pick"
      title="Nothing to spin?"
      still={<RandomPickStill />}
    >
      <p>
        Random pick draws one record from your whole collection. Not the mood?
        Pick again.
      </p>
    </FeatureSection>

    <LandingCta />
    <LinerNotes />
  </main>
)
