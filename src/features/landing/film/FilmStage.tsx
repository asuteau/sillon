import { useMemo } from 'react'
import type * as React from 'react'

import { cn } from '#/shared/utils/cn'

import { useFilmPlayer } from '../hooks/use-film-player'
import type { FilmPlayer } from '../hooks/use-film-player'
import type { Beats, Score, Shot } from './film.model'

// What a film's set renders: every tracked element's rest pose, and the
// scene (what changes on the beats)
export interface FilmFrame<TName extends string, TScene> {
  looks: Shot<TName>
  scene: TScene
}

interface FilmStageProps<TName extends string, TScene> {
  score: Score<TName>
  beats: Beats<TScene>
  // What the stage is, as `data-slot`
  slot: `${string}-film`
  className?: string
  style?: React.CSSProperties
  // The set, at its rest pose
  children: (frame: FilmFrame<TName, TScene>) => React.ReactNode
  // Beside the stage, outside it: what the visitor can use (the hero's
  // Replay)
  controls?: (player: FilmPlayer<TScene>) => React.ReactNode
}

// A landing film's stage: the score played on it (useFilmPlayer), its set
// rendered at the rest pose. Decorative, so inert and hidden from assistive
// tech; its stage units (`cqw`) are its width. While it waits off-screen or
// in a hidden tab, CSS animations inside it wait too (`data-paused`)
export const FilmStage = <TName extends string, TScene>({
  score,
  beats,
  slot,
  className,
  style,
  children,
  controls,
}: FilmStageProps<TName, TScene>) => {
  const player = useFilmPlayer(score, beats)
  const { at, scene, isPaused, stageRef } = player
  // Sampled once per rest pose: a set re-renders only when it moves to a
  // new one, or on a beat
  const looks = useMemo(() => score.sample(at), [score, at])

  return (
    <>
      <div
        ref={stageRef}
        data-slot={slot}
        data-paused={isPaused ? '' : undefined}
        inert
        aria-hidden
        className={cn('@container relative select-none', className)}
        style={style}
      >
        {children({ looks, scene })}
      </div>
      {controls?.(player)}
    </>
  )
}
