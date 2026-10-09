import { GrooveMark } from '#/shared/components/brand/GrooveMark'
import { useGrooveEntrance } from '../hooks/use-groove-entrance'
import { ConnectWithDiscogs } from './ConnectWithDiscogs'

export const LandingCta = () => {
  const { ref, entrance } = useGrooveEntrance()

  return (
    <section
      ref={ref}
      aria-labelledby="cta-title"
      className="flex flex-col items-center gap-6 border-t border-border py-16 text-center sm:py-24"
    >
      <GrooveMark size={96} tone="lacquer" className={entrance} />
      <h2
        id="cta-title"
        className="type-display text-4xl text-balance text-foreground sm:text-6xl"
      >
        Bring your crates.
      </h2>
      <p className="max-w-md text-base text-muted-foreground">
        Sign in with your Discogs account. Your collection and wantlist come
        with you; nothing to import.
      </p>
      <ConnectWithDiscogs />
    </section>
  )
}
