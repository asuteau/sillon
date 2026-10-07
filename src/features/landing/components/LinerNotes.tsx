import { LINER_NOTES_STACK } from '../landing.content'

const LABEL_CLASSES = 'type-caps mb-3 text-[11px] text-muted-foreground'
const BODY_CLASSES =
  'flex max-w-2xl flex-col gap-3 text-sm text-muted-foreground'
const LINK_CLASSES = 'text-foreground no-underline hover:underline'

// Who made Sillon and how. /about redirects here.
export const LinerNotes = () => (
  <section
    id="liner-notes"
    aria-labelledby="liner-notes-title"
    className="scroll-mt-20 border-t border-border py-14 sm:py-20"
  >
    <h2
      id="liner-notes-title"
      className="type-display mb-10 text-4xl text-foreground"
    >
      Liner notes
    </h2>

    <div className="grid gap-x-14 gap-y-10 md:grid-cols-2">
      <div className="flex flex-col gap-10">
        <div>
          <p className={LABEL_CLASSES}>The project</p>
          <div className={BODY_CLASSES}>
            <p>
              I built Sillon to browse and rediscover my own records. Other apps
              felt cluttered or slow, and none were made for the moment of
              digging through a crate.
            </p>
            <p>
              It's also a lab: a place to push a modern stack and an
              AI-augmented build process without client constraints.
            </p>
          </div>
        </div>

        <div>
          <p className={LABEL_CLASSES}>How it's built</p>
          <div className={BODY_CLASSES}>
            <p>
              Solo and AI-augmented. One person, an agentic workflow, from
              ticket spec to pull request with generated tests and QA plans.
            </p>
            <p>
              The point is to spend less time typing code and more on what
              matters: UX, performance, accessibility, edge cases.
            </p>
          </div>
        </div>

        <div>
          <p className={LABEL_CLASSES}>Why these choices</p>
          <p className={BODY_CLASSES}>
            I shipped Remix in production for a previous client and hit friction
            with the actions and loaders model: sometimes you bend a real need
            to fit the framework. Next's layered abstractions didn't appeal
            either. TanStack Start, Router and Query compose the way this kind
            of app needs. shadcn gives behaviour and accessibility without a
            component kit to fight, and works well with the AI workflow. A PWA
            rather than a native app: one codebase, installable on a phone.
            Where the platform has an API, as for barcode scanning, Sillon uses
            it.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <div>
          <p className={LABEL_CLASSES}>Stack</p>
          <ul className="divide-y divide-border border-y border-border">
            {LINER_NOTES_STACK.map(({ name, description, href }) => (
              <li key={name}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-0.5 py-3 no-underline transition-colors duration-160 ease-fade hover:bg-muted sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <span className="text-sm font-semibold text-foreground">
                    {name}
                  </span>
                  <span className="text-xs text-muted-foreground sm:text-right">
                    {description}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={LABEL_CLASSES}>Made by</p>
          <p className={`${BODY_CLASSES} mb-3`}>
            Aymeric Suteau, frontend software engineer. Ten years in software,
            five of them in product-first B2B SaaS and e-commerce.
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            <a
              href="https://www.linkedin.com/in/aymeric-suteau"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASSES}
            >
              LinkedIn
            </a>
            <span className="text-muted-foreground">·</span>
            <a
              href="https://github.com/asuteau"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASSES}
            >
              GitHub
            </a>
            <span className="text-muted-foreground">·</span>
            <a
              href="mailto:aymeric.suteau.work@gmail.com"
              className={LINK_CLASSES}
            >
              Email
            </a>
          </div>
        </div>
      </div>
    </div>

    <p className="type-catalogue mt-14 text-[11px] text-muted-foreground">
      v0.1.0 · active development · built with ♥ for vinyl
    </p>
  </section>
)
