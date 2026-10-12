# Collection cache persisted on device, 6 hours at most

The Portrait needs every Copy, which Discogs only gives 100 at a time under a 60 requests/minute limit: a 4,000-Copy Collection takes 40 requests. Rescanning on every app launch would make the Portrait slow and starve the rest of the app of requests, so the Collection list cache — and only it — is persisted on the user's device. It expires 6 hours after it was fetched from Discogs (not after it was saved), and is wiped on logout. This stays within the Discogs API terms: no Content shown more than 6 hours older than discogs.com, nothing kept longer than needed, and nothing leaves the user's device.

## Considered Options

- **Memory only**: rejected. Every cold launch (frequent for a PWA) rescans the whole Collection.
- **Persist every query**: rejected. Only the Collection is expensive to rebuild; keeping more Restricted Data than needed goes against the terms.
- **Server-side cache**: rejected. Holds every user's Restricted Data on our side, with no benefit over the user's own device.

## Consequences

- Freshness is measured from the Discogs fetch time, so a restored cache can expire mid-session and trigger a rescan.
- Mutations must patch the persisted cache (removals already do; additions read the newest Copy back) rather than invalidate it, or every add rescans the Collection.
