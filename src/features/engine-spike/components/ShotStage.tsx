import { GeneratedCover } from '#/features/landing/components/GeneratedCover'
import {
  HERO_CAST,
  LANDING_RECORDS,
  heroTint,
  landingPressing,
  pressingSurface,
} from '#/features/landing/content/landing.content'
import { Disc } from '#/shared/components/brand/Disc'

import { SHOT_CAST } from '../shot.timeline'

const { index, tintHue } = HERO_CAST[SHOT_CAST]
const record = LANDING_RECORDS[index]
const pressing = landingPressing(index)
const surface = pressingSurface(pressing)

// The shot's set: a Cover, the disc behind it in its Vinyl colour, a light
// band over the Cover. Motion moves the `data-shot` parts. Sized in cqw of
// its own 4:5 box, so it fits any column.
export const ShotStage = () => (
  <div className="@container relative aspect-4/5 w-full overflow-hidden bg-background select-none">
    <div data-shot="pan" className="absolute inset-0 will-change-transform">
      <div
        data-shot="camera"
        className="absolute inset-0 will-change-transform"
      >
        <div
          className="absolute"
          style={{
            '--cover-tint': heroTint(tintHue),
            left: '27cqw',
            top: 'calc(62.5cqw - 23cqw)',
            width: '46cqw',
            height: '46cqw',
          }}
        >
          <div
            data-shot="disc"
            className="absolute inset-[3%] will-change-transform"
          >
            <div
              data-shot="spin"
              className="absolute inset-0 [&_.disc]:inset-0"
            >
              <Disc
                surface={surface.background}
                seeThrough={surface.seeThrough}
              />
            </div>
          </div>
          <div
            data-shot="sleeve"
            className="absolute inset-0 will-change-transform"
            style={{ boxShadow: '0 10px 30px var(--pull-shadow)' }}
          >
            <GeneratedCover
              artist={record.artist}
              title={record.title}
              seed={pressing.id}
              className="size-full"
            />
            <div className="absolute inset-0 overflow-hidden rounded-(--radius)">
              <div
                data-shot="sweep"
                className="absolute inset-y-[-10%] left-0 w-[60%] opacity-0 will-change-transform"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 20%, oklch(1 0 0 / 0.5) 50%, transparent 80%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)
