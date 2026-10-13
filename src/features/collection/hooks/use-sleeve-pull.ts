import {
  centredAfterChange,
  nearestSlide,
  platterEase,
  pullDistance,
} from '#/features/collection/sleeve-pull.utils'
import { usePrefersReducedMotion } from '#/shared/hooks/use-prefers-reduced-motion'
import { COVER_OPEN_MS, PLATTER_EASING } from '#/shared/utils/cover-transition'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

// Timed moves (arrows, keys, a tapped neighbour, removal): the platter's 320ms
const GLIDE_MS = COVER_OPEN_MS
const FADE_MS = 160
const FADE_EASING = 'cubic-bezier(.2,0,0,1)'

const centreOf = (el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2

// The Sleeve pull strip, driven by its native scroll: every frame writes each
// slide's --pull-distance, so the pull follows the finger with no renders.
// `ids` are the strip's Copies in order; slides register with `slideRef`.
export const useSleevePull = (ids: number[]) => {
  const reducedMotion = usePrefersReducedMotion()
  const stripRef = useRef<HTMLDivElement>(null)
  const slidesRef = useRef(new Map<number, HTMLElement>())
  const [centred, setCentred] = useState(0)
  // Read by handlers and the removal layout effect, never rendered
  const centredRef = useRef({ id: ids.at(0) ?? 0, index: 0 })
  // Each slide's on-screen centre at the last frame, to slide from on removal
  const lastCentresRef = useRef(new Map<number, number>())
  const lastDistancesRef = useRef(new Map<number, string>())
  const idsRef = useRef(ids)
  const glideRef = useRef(0)

  const slidesInOrder = useCallback(
    () =>
      idsRef.current.flatMap((id) => {
        const el = slidesRef.current.get(id)
        return el ? [{ id, el }] : []
      }),
    [],
  )

  const measure = useCallback(() => {
    const strip = stripRef.current
    const slides = slidesInOrder()
    if (!strip || slides.length === 0) return
    const step =
      slides.length > 1
        ? slides[1].el.offsetLeft - slides[0].el.offsetLeft
        : slides[0].el.offsetWidth
    const stripCentre = strip.scrollLeft + strip.clientWidth / 2
    const centres = slides.map(({ id, el }) => {
      const slideCentre = centreOf(el)
      const distance = pullDistance({ slideCentre, stripCentre, step }).toFixed(
        4,
      )
      el.style.setProperty('--pull-distance', distance)
      lastDistancesRef.current.set(id, distance)
      const rect = el.getBoundingClientRect()
      lastCentresRef.current.set(id, rect.left + rect.width / 2)
      return slideCentre
    })
    const index = nearestSlide(centres, stripCentre)
    centredRef.current = { id: slides[index].id, index }
    setCentred(index)
  }, [slidesInOrder])

  // Scroll and resize: one measure per frame
  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    let frame = 0
    const schedule = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0
          measure()
        })
    }
    strip.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      strip.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
    }
  }, [measure])

  const stopGlide = useCallback(() => {
    cancelAnimationFrame(glideRef.current)
    glideRef.current = 0
    if (stripRef.current) stripRef.current.style.scrollSnapType = ''
  }, [])

  // A touch or wheel takes over from a glide
  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    strip.addEventListener('pointerdown', stopGlide, { passive: true })
    strip.addEventListener('wheel', stopGlide, { passive: true })
    return () => {
      strip.removeEventListener('pointerdown', stopGlide)
      strip.removeEventListener('wheel', stopGlide)
      stopGlide()
    }
  }, [stopGlide])

  const targetFor = (strip: HTMLElement, el: HTMLElement) =>
    centreOf(el) - strip.clientWidth / 2

  // Centres a slide over the platter's 320ms; reduced motion jumps. Snapping
  // is off meanwhile, or each frame's scroll would snap back.
  const glideTo = useCallback(
    (index: number, { focus = false } = {}) => {
      const strip = stripRef.current
      const target = slidesInOrder().at(
        Math.max(0, Math.min(idsRef.current.length - 1, index)),
      )
      if (!strip || !target) return
      stopGlide()
      // Keys move the focus along, so Enter opens the record centred
      if (focus) target.el.focus({ preventScroll: true })
      const to = targetFor(strip, target.el)
      if (reducedMotion) {
        strip.scrollLeft = to
        return
      }
      const from = strip.scrollLeft
      const start = performance.now()
      strip.style.scrollSnapType = 'none'
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / GLIDE_MS)
        strip.scrollLeft = from + (to - from) * platterEase(progress)
        if (progress < 1) glideRef.current = requestAnimationFrame(tick)
        else stopGlide()
      }
      glideRef.current = requestAnimationFrame(tick)
    },
    [reducedMotion, slidesInOrder, stopGlide],
  )

  // The Copies changed (a removal): centre the record that takes the centred
  // one's place, and slide every slide from where it was. Reduced motion:
  // the new centred record fades in.
  useLayoutEffect(() => {
    const previous = idsRef.current
    idsRef.current = ids
    const strip = stripRef.current
    if (!strip || previous.join() === ids.join()) return measure()

    const before = centredRef.current
    const index = centredAfterChange({
      ids,
      centredId: before.id,
      centredIndex: before.index,
    })
    const target = index === null ? undefined : slidesInOrder().at(index)
    if (!target) return
    stopGlide()
    strip.scrollLeft = targetFor(strip, target.el)
    const lastCentres = new Map(lastCentresRef.current)
    const lastDistances = new Map(lastDistancesRef.current)
    measure()

    if (reducedMotion) {
      if (target.id !== before.id)
        target.el.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: FADE_MS,
          easing: FADE_EASING,
        })
      return
    }
    for (const { id, el } of slidesInOrder()) {
      const from = lastCentres.get(id)
      if (from === undefined) continue
      const rect = el.getBoundingClientRect()
      const offset = from - (rect.left + rect.width / 2)
      if (Math.abs(offset) < 1) continue
      // The incoming record grows and brightens as it slides in
      el.animate(
        [
          {
            transform: `translateX(${offset}px)`,
            '--pull-distance': lastDistances.get(id) ?? '1',
          },
          {
            transform: 'none',
            '--pull-distance': el.style.getPropertyValue('--pull-distance'),
          },
        ],
        { duration: GLIDE_MS, easing: PLATTER_EASING },
      )
    }
  }, [ids, measure, reducedMotion, slidesInOrder, stopGlide])

  const slideRef = useCallback(
    (id: number) => (node: HTMLElement | null) => {
      if (node) slidesRef.current.set(id, node)
      else slidesRef.current.delete(id)
    },
    [],
  )

  return { stripRef, slideRef, centred, glideTo }
}
