import type * as React from 'react'

import { lookStyle } from './film-css.utils'
import type { Shot } from './film.model'

interface TrackedProps<TName extends string> {
  name: NoInfer<TName>
  looks: Shot<TName>
  // A track that moves descendants of a shared component, by selector (see
  // useFilmPlayer). React can't rest those, so the element keeps no look
  target?: string
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

// One element a film moves (`data-track`), resting at its look until the
// browser takes over
export const Tracked = <TName extends string>({
  name,
  looks,
  target,
  className,
  style,
  children,
}: TrackedProps<TName>) => (
  <div
    data-track={name}
    data-track-target={target}
    className={className}
    style={target ? style : { ...style, ...lookStyle(looks[name] ?? {}) }}
  >
    {children}
  </div>
)
