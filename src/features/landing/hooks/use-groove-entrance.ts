import { useInView } from '#/shared/hooks/use-in-view'
import { usePrefersReducedMotion } from '#/shared/hooks/use-prefers-reduced-motion'

// The closing groove draws in once, the first time its section scrolls into
// view (no margin, so it plays where it's seen); with reduced motion the full
// groove fades in
export const useGrooveEntrance = () => {
  const { ref, isInView } = useInView<HTMLElement>('0px')
  const reducedMotion = usePrefersReducedMotion()

  if (!isInView) return { ref, entrance: 'groove-undrawn' }
  if (reducedMotion) return { ref, entrance: 'groove-fade-in' }
  return { ref, entrance: 'groove-draw-in' }
}
