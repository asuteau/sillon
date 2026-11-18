import { Player } from '@remotion/player'

import { SHOT_FPS, SHOT_MS } from '../shot.timeline'
import { ShotComposition } from './ShotComposition'

// The same composition the Studio opens, played at runtime. The Player renders
// in the page's own DOM (no iframe), so the theme classes apply.
export const RemotionShot = () => (
  <Player
    component={ShotComposition}
    durationInFrames={Math.round((SHOT_MS / 1000) * SHOT_FPS)}
    fps={SHOT_FPS}
    compositionWidth={540}
    compositionHeight={675}
    controls
    loop
    autoPlay
    style={{ width: '100%' }}
  />
)
