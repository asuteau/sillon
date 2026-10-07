import type * as React from 'react'

import { FulfilledWantPromptView } from '#/features/wantlist/components/FulfilledWantPrompt'
import { GrooveMark } from '#/shared/components/brand/GrooveMark'
import { Wordmark } from '#/shared/components/brand/Wordmark'
import { CoverGlow } from '#/shared/components/CoverGlow'
import { HouseSleeve } from '#/shared/components/HouseSleeve'
import { RecordHeading } from '#/shared/components/RecordHeading'
import { RecordList } from '#/shared/components/RecordList'
import { ReleaseListButtons } from '#/shared/components/ReleaseListButtons'
import { cn } from '#/shared/utils/cn'

import { HERO_GRID_SIZE, isCoverLoaded } from '../landing.timeline'
import type { ScanStep } from '../landing.timeline'
import { useCoverGrowth } from '../hooks/use-cover-growth'
import { useHeroPlayback } from '../hooks/use-hero-playback'
import {
  HERO_DETAIL_TINT,
  LANDING_RECORDS,
  catalogueLines,
  landingRecords,
} from '../landing.content'
import { ScanViewfinder } from './ScanViewfinder'
import { StillRow } from './StillRow'

const GRID_RECORDS = LANDING_RECORDS.slice(0, HERO_GRID_SIZE)
// The centre cover grows into its detail page
const DETAIL_CELL = 4
const DETAIL_RECORD = GRID_RECORDS[DETAIL_CELL]
const [SCANNED_RECORD] = landingRecords(6)

const FADE = 'transition-opacity duration-160 ease-fade'

interface SceneLayerProps {
  isActive: boolean
  className?: string
  children: React.ReactNode
}

// One beat's frame. Beats cross-fade; all stay laid out, so nothing shifts.
const SceneLayer = ({ isActive, className, children }: SceneLayerProps) => (
  <div
    className={cn(
      'absolute inset-0',
      FADE,
      isActive ? 'opacity-100' : 'opacity-0',
      className,
    )}
  >
    {children}
  </div>
)

interface IntroSceneProps {
  isActive: boolean
  showsWordmark: boolean
}

// Beat 1: the groove draws in, then the wordmark appears
const IntroScene = ({ isActive, showsWordmark }: IntroSceneProps) => (
  <SceneLayer
    isActive={isActive}
    className="flex flex-col items-center justify-center gap-5 text-foreground"
  >
    <GrooveMark size={96} className="groove-draw-in" />
    <Wordmark
      className={cn(
        'text-5xl',
        FADE,
        showsWordmark ? 'opacity-100' : 'opacity-0',
      )}
    />
  </SceneLayer>
)

interface CollectionSceneProps {
  isActive: boolean
  loaded: number
  detailCoverRef: React.Ref<HTMLDivElement>
}

// Beat 2: House sleeves fill the grid, each over the flat grey loading state
const CollectionScene = ({
  isActive,
  loaded,
  detailCoverRef,
}: CollectionSceneProps) => (
  <SceneLayer isActive={isActive} className="p-4 sm:p-6">
    <p className="type-display mb-4 text-3xl text-foreground">Collection</p>
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {GRID_RECORDS.map((record, cell) => (
        <div
          key={record.title}
          ref={cell === DETAIL_CELL ? detailCoverRef : undefined}
          className="relative aspect-square overflow-hidden rounded-(--radius) bg-muted"
        >
          <HouseSleeve
            artist={record.artist}
            title={record.title}
            className={cn(
              'absolute inset-0 size-full',
              FADE,
              isCoverLoaded(cell, loaded) ? 'opacity-100' : 'opacity-0',
            )}
          />
        </div>
      ))}
    </div>
  </SceneLayer>
)

interface ScanSceneProps {
  isActive: boolean
  step: ScanStep | null
}

// Beat 3: the scan matches a Release, it's added, the want is fulfilled.
// The buttons and the prompt are the Release sheet's own views.
const ScanScene = ({ isActive, step }: ScanSceneProps) => {
  const isMatched = step !== null && step !== 'aim'
  const isAdded = step === 'added' || step === 'fulfilled'

  return (
    <SceneLayer isActive={isActive}>
      <ScanViewfinder className="absolute inset-0 justify-start rounded-none pt-[16%]" />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex flex-col gap-4 rounded-t-[14px] border-t border-border bg-background p-4 sm:p-5',
          FADE,
          isMatched ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div>
          <p className="type-caps mb-1 text-[11px] text-muted-foreground">
            Found on Discogs
          </p>
          <RecordList>
            <li>
              <StillRow
                record={SCANNED_RECORD}
                meta={String(SCANNED_RECORD.year)}
              />
            </li>
          </RecordList>
        </div>
        {step === 'fulfilled' ? (
          <div className="animate-in duration-160 ease-fade fade-in-0">
            <FulfilledWantPromptView onRemove={() => {}} onKeep={() => {}} />
          </div>
        ) : (
          <ReleaseListButtons inCollection={isAdded} inWantlist />
        )}
      </div>
    </SceneLayer>
  )
}

interface DetailSceneProps {
  isOpen: boolean
  coverRef: React.Ref<HTMLDivElement>
}

// Beat 4: the cover grows into its detail page; the page and its cover tint
// fade in behind it
const DetailScene = ({ isOpen, coverRef }: DetailSceneProps) => (
  <div
    className="absolute inset-0"
    style={{ '--cover-tint': HERO_DETAIL_TINT }}
  >
    <div
      className={cn(
        'absolute inset-0 bg-background',
        FADE,
        isOpen ? 'opacity-100' : 'opacity-0',
      )}
    >
      <CoverGlow tint={HERO_DETAIL_TINT} />
    </div>
    <div className="relative flex flex-col items-center gap-5 p-6 sm:p-8">
      {/* Shows at once to grow from the grid; fades out with the page */}
      <div
        ref={coverRef}
        className={cn('w-3/5', isOpen ? 'opacity-100' : `opacity-0 ${FADE}`)}
      >
        <HouseSleeve
          artist={DETAIL_RECORD.artist}
          title={DETAIL_RECORD.title}
          className="w-full rounded-(--radius)"
        />
      </div>
      <div className={cn(FADE, isOpen ? 'opacity-100' : 'opacity-0')}>
        <RecordHeading
          artist={DETAIL_RECORD.artist}
          title={DETAIL_RECORD.title}
          catalogue={catalogueLines(DETAIL_RECORD)}
        />
      </div>
    </div>
  </div>
)

// The landing hero: ~12s of the app, built from its own components and House
// sleeves. Decorative and inert; pauses off-screen or in a hidden tab, and
// holds one still frame with reduced motion.
export const HeroAnimation = () => {
  const { stageRef, scene, isPlaying } = useHeroPlayback()
  const isDetailOpen = scene.beat === 'detail' && scene.open
  const { fromRef, toRef } = useCoverGrowth(isDetailOpen)

  return (
    <div
      ref={stageRef}
      data-slot="hero-animation"
      data-paused={isPlaying ? undefined : ''}
      inert
      aria-hidden
      className="relative aspect-4/5 w-full min-w-0 overflow-hidden rounded-(--radius) border border-border bg-background select-none"
    >
      <IntroScene
        isActive={scene.beat === 'intro'}
        showsWordmark={scene.beat === 'intro' && scene.wordmark}
      />
      <CollectionScene
        isActive={scene.beat === 'collection' || scene.beat === 'detail'}
        loaded={scene.beat === 'collection' ? scene.loaded : HERO_GRID_SIZE}
        detailCoverRef={fromRef}
      />
      <ScanScene
        isActive={scene.beat === 'scan'}
        step={scene.beat === 'scan' ? scene.step : null}
      />
      <DetailScene isOpen={isDetailOpen} coverRef={toRef} />
    </div>
  )
}
