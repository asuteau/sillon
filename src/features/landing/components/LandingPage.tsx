import { CollectionLoop } from './CollectionLoop'
import { LandingChallenge } from './LandingChallenge'
import { LandingHeader } from './LandingHeader'
import { LandingKeyFacts } from './LandingKeyFacts'
import { LinerNotes } from './LinerNotes'
import { PortraitFilm } from './PortraitFilm'
import { FeatureSection } from './FeatureSection'
import { LandingCta } from './LandingCta'
import { LandingHero } from './LandingHero'
import { RandomPickFilm } from './RandomPickFilm'
import { ScanLoop } from './ScanLoop'
import { WantlistFilm } from './WantlistFilm'

// The signed-out `/`: show the product, then "Connect with Discogs"
// The hero film runs to the screen's edges: clipped here, so the page never
// scrolls sideways. A container, so the film's edges are the page's
// (`cqw`), not the viewport's, which counts a desktop scrollbar
export const LandingPage = () => (
  <div className="@container overflow-x-clip">
    <LandingHeader />
    <main id="top" className="mx-auto w-full max-w-270 scroll-mt-20 px-4 pb-8">
      <LandingHero />
      <LandingKeyFacts />
      <LandingChallenge />
      <div id="features" className="scroll-mt-20" />

      <FeatureSection
        id="collection"
        label="Collection"
        title="Your collection, in HD."
        still={<CollectionLoop />}
      >
        <p>
          Sillon reads your Discogs collection and finds an HD cover for every
          record. Sort by date added, artist, title or year.
        </p>
        <p>
          Pull a record from its sleeve and the disc comes out in its own vinyl
          colour, read from Discogs: seafoam, oxblood, clear with a splatter.
        </p>
        <p>
          No cover anywhere? The record gets a house sleeve, set in type with
          its artist and title.
        </p>
      </FeatureSection>

      <FeatureSection
        id="wantlist"
        label="Wantlist"
        title="Your wantlist, fulfilled."
        still={<WantlistFilm />}
      >
        <p>
          Your wantlist sits next to your collection. Add the exact release you
          were after and it becomes a fulfilled want: Sillon offers to take it
          off the wantlist.
        </p>
        <p>It never removes it on its own. You may still want a spare.</p>
      </FeatureSection>

      <FeatureSection
        id="scan"
        label="Barcode scanning"
        title="Scan the sleeve."
        still={<ScanLoop />}
        flip
      >
        <p>
          In the shop, point your phone at one sleeve's barcode. Sillon finds
          the release on Discogs, ready to add to your Collection or your
          Wantlist.
        </p>
        <p>
          Back home with a stack? Flip through it: every sleeve piles up in a
          Stack, and one tap adds them all.
        </p>
      </FeatureSection>

      <FeatureSection
        id="random-pick"
        label="Random pick"
        title="Nothing to spin?"
        still={<RandomPickFilm />}
      >
        <p>
          Random pick draws one record from your whole collection. Not the mood?
          Pick again.
        </p>
      </FeatureSection>

      <FeatureSection
        id="portrait"
        label="Portrait"
        title="Your collection, in numbers."
        still={<PortraitFilm />}
        flip
      >
        <p>
          Portrait reads every record you own: what the collection is worth on
          Discogs, the artists you keep coming back to, the decades your
          pressings come from.
        </p>
        <p>The leader of each chart is set in copper.</p>
      </FeatureSection>

      <LandingCta />
      <LinerNotes />
    </main>
  </div>
)
