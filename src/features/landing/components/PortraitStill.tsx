import { PortraitFigures } from '#/features/portrait/components/PortraitFigures'
import { RankedList } from '#/features/portrait/components/RankedList'
import { TimeChart } from '#/features/portrait/components/TimeChart'
import { formatEstimatedValue } from '#/features/portrait/portrait.utils'

import { LANDING_PORTRAIT } from '../landing.content'
import { LandingStill } from './LandingStill'

const { currency, estimatedValue, topArtists, pressingDecades } =
  LANDING_PORTRAIT

const ESTIMATE = formatEstimatedValue(estimatedValue, currency, 'en-GB')
const RECORD_COUNT = pressingDecades.reduce(
  (sum, { copies }) => sum + copies,
  0,
)

// The Portrait, from its own figures and charts: Estimated value, Top
// artists, Pressing decade. Charts sit closer than in the app to fit a column.
export const PortraitStill = () => (
  <LandingStill className="flex flex-col gap-8 [&>section]:mt-0">
    <PortraitFigures
      recordCount={RECORD_COUNT.toLocaleString('en-GB')}
      estimatedValue={ESTIMATE?.median}
      valueRange={ESTIMATE?.range}
    />
    <RankedList
      title="Top artists"
      entries={topArtists.map(({ name, copies }) => ({
        key: name,
        label: name,
        count: copies,
      }))}
    />
    <TimeChart
      title="Pressing decade"
      entries={pressingDecades.map(({ decade, copies }) => ({
        key: decade,
        label: `${decade}s`,
        count: copies,
      }))}
    />
  </LandingStill>
)
