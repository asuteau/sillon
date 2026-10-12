import { Page } from '#/shared/components/Page'
import { DISCOGS_NOTICE } from '#/shared/utils/legal'

const LAST_UPDATED = '12 October 2026'
const CONTACT_EMAIL = 'aymeric.suteau.work@gmail.com'

const LINK_CLASSES = 'text-foreground underline hover:no-underline'

interface SectionProps {
  id: string
  title: string
  children: React.ReactNode
}

const Section = ({ id, title, children }: SectionProps) => (
  <section id={id} className="scroll-mt-24 border-t border-border pt-8">
    <h2 className="type-title mb-4 text-2xl text-foreground">{title}</h2>
    <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
      {children}
    </div>
  </section>
)

const ContactLink = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className={LINK_CLASSES}>
    {CONTACT_EMAIL}
  </a>
)

// Terms, privacy, notices and mentions légales, for visitors and collectors alike
export const LegalPage = () => (
  <Page className="max-w-[72ch]">
    <h1 className="type-display mb-2 text-4xl text-foreground">Legal</h1>
    <p className="type-catalogue mb-10 text-[11px] text-muted-foreground">
      Last updated {LAST_UPDATED}
    </p>

    <div className="flex flex-col gap-10">
      <Section id="terms" title="Terms of use">
        <p>
          Sillon is a free, personal and non-commercial companion to your
          Discogs account. It isn't affiliated with Discogs or Deezer. It has no
          ads, no paid tier, and asks for nothing in return.
        </p>
        <p>
          <strong>Your Discogs account.</strong> You sign in through Discogs, so
          the{' '}
          <a
            href="https://support.discogs.com/hc/en-us/articles/360009334593"
            target="_blank"
            rel="noopener"
            className={LINK_CLASSES}
          >
            Discogs terms
          </a>{' '}
          apply too. Adding or removing a record in Sillon changes your real
          Discogs Collection and Wantlist. You're responsible for what you do
          with it.
        </p>
        <p>
          <strong>As is.</strong> Sillon is provided as is, without warranty. It
          can stop working or change at any time, including when Discogs or
          Deezer change or close their services. Data can lag Discogs by up to 6
          hours. Covers come from Deezer and can be missing or wrong; a record
          without one gets a house sleeve.
        </p>
        <p>
          <strong>Liability.</strong> As far as French law allows, Sillon's
          publisher isn't liable for any loss or change to your Discogs data, or
          for any other harm from using Sillon.
        </p>
        <p>
          <strong>Changes.</strong> These terms can change. The date at the top
          of this page says when they last did. Using Sillon after a change
          means you accept the new terms.
        </p>
        <p>
          <strong>Law.</strong> These terms are governed by French law.
          Questions: <ContactLink />.
        </p>
      </Section>

      <Section id="privacy" title="Privacy">
        <p>
          Sillon keeps as little as it can, and nothing on a server of its own.
        </p>
        <p>
          <strong>In your browser.</strong> One encrypted session cookie, kept
          30 days, holds your Discogs sign-in token, username, currency and
          location, so Sillon can read and edit your Discogs account for you.
          Local storage remembers which Cover goes with which record, and your
          theme.
        </p>
        <p>
          <strong>No tracking.</strong> No analytics, no ads, no third-party
          trackers. Because everything stored is needed for Sillon to work,
          there's no cookie banner.
        </p>
        <p>
          <strong>Other services.</strong> Your browser loads images directly
          from Discogs and Deezer, so they see your IP address. Cover searches
          go through Sillon's server, so Deezer never sees who asked. Sillon is
          hosted by Vercel, which keeps request logs.
        </p>
        <p>
          <strong>Your rights.</strong> Sillon uses this data only to provide
          the service you asked for. Logging out deletes the session cookie;
          clearing site data removes the rest. For any question or request under
          the GDPR, write to <ContactLink />.
        </p>
      </Section>

      <Section id="notices" title="Notices">
        <p>{DISCOGS_NOTICE}</p>
        <p>Covers from Deezer.</p>
        <p>
          Familjen Grotesk and Martian Mono are used under the{' '}
          <a
            href="https://openfontlicense.org"
            target="_blank"
            rel="noopener"
            className={LINK_CLASSES}
          >
            SIL Open Font License
          </a>
          .
        </p>
      </Section>

      <Section id="mentions" title="Mentions légales">
        <p>
          <strong>Publisher.</strong> Aymeric Suteau, individual,
          non-professional. <ContactLink />.
        </p>
        <p>
          <strong>Host.</strong> Vercel Inc., 440 N Barranca Avenue #4133,
          Covina, CA 91723, United States.{' '}
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener"
            className={LINK_CLASSES}
          >
            vercel.com
          </a>
        </p>
      </Section>
    </div>
  </Page>
)
