import { Composition } from 'remotion'

import { ShotComposition } from '../components/ShotComposition'
import { SHOT_FPS, SHOT_MS } from '../shot.timeline'

// Remotion Studio's list of compositions: `pnpm spike:remotion`
export const RemotionRoot = () => (
  <Composition
    id="HeroShot"
    component={ShotComposition}
    durationInFrames={Math.round((SHOT_MS / 1000) * SHOT_FPS)}
    fps={SHOT_FPS}
    width={540}
    height={675}
  />
)
