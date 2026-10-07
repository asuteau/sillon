import { buttonVariants } from '#/shared/components/ui/button'

// Lacquer: the landing CTA is a brand moment
export const ConnectWithDiscogs = () => (
  <a
    href="/auth/login"
    className={buttonVariants({ variant: 'lacquer', size: 'lg' })}
  >
    Connect with Discogs
  </a>
)
