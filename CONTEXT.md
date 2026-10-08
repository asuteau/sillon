# Sillon

Personal vinyl record app mirroring a user's Discogs collection and wantlist.

## Language

### Lists

**Collection**:
The records the user owns, as recorded in their Discogs collection.
_Avoid_: Library, shelf

**Copy**:
One physical record the user owns. The Collection holds copies, not releases: the same release can be owned several times, and removing from the Collection removes one specific copy.
_Avoid_: Instance, item

**Recent additions**:
The 10 Copies most recently added to the Collection. A live window, not a log: removing one lets the next most recent Copy slide in, so it always shows ten records unless the Collection holds fewer.
_Avoid_: Recently added list, latest

**Wantlist**:
The records the user wants to acquire, as recorded in their Discogs wantlist.
_Avoid_: Wishlist, wants

**Fulfilled want**:
A Wantlist entry whose exact Release now has a Copy in the Collection. Another Release of the same Master does not fulfil it. When adding to the Collection fulfils a want, Sillon suggests removing it from the Wantlist but never removes it on its own — the user may still want it (spare, trade, sealed copy).
_Avoid_: Owned want, completed want

**Random pick**:
One Copy drawn at random from the whole Collection, to answer "what do I play now?". Picking again draws a new one, never the same Copy twice in a row (unless the Collection holds only one). Shown whole or not at all: the record appears only once its Cover and the colour drawn from it are ready, never piecemeal.
_Avoid_: Shuffle, surprise me

### Records

**Master**:
The abstract work — an album as labels and Discogs define it — grouping every pressing of it.
_Avoid_: Album group

**Release**:
One specific pressing of a Master (label, country, year, format). The Collection and Wantlist hold Releases. A Release may have no Master.
_Avoid_: Version, pressing, edition

**Main release**:
The Release Discogs designates as the canonical one for a Master. It decides what kind of record the Master is (compilation, live…); other Releases only fill in a missing album tag.
_Avoid_: Primary release, original pressing

**Discography**:
The Masters an artist is credited on as main artist, newest first, including splits and collaborations whatever the credit order. Excludes guest appearances, remixes and production credits. Best-effort for very prolific artists: it may be truncated.
_Avoid_: Releases, albums list

**Studio album**:
A Master in a Discography whose Main release is tagged as an album by Discogs, and isn't a compilation, live recording, box set or unofficial release. Soundtracks and scores count. An approximation: Discogs has no reliable "studio" flag, so an occasional wrong inclusion or exclusion is accepted.
_Avoid_: LP, full-length, official album

**EP**:
A Master in a Discography whose Main release is tagged as an EP by Discogs, and isn't an Unofficial release. Only the Main release's tags count, so a Master is never both a Studio album and an EP.
_Avoid_: Mini-album

**Compilation**:
A Master in a Discography whose Main release is tagged as a compilation by Discogs, and isn't an Unofficial release.
_Avoid_: Best-of, anthology

**Unofficial release**:
A record not sanctioned by the artist or their label (bootlegs, unlicensed pressings), as tagged by Discogs. Excluded from Studio albums, EPs and Compilations; only the full Discography shows them.
_Avoid_: Bootleg, pirate

**Cover**:
The HD artwork shown for a record, always from Deezer. Discogs images are never shown: they are community-uploaded, uneven in quality and per-Release. It belongs to the Master: every Release of a Master shows the same Cover, on every screen. A Release without a Master has its own Cover.
_Avoid_: Artwork, image, thumb

**House sleeve**:
A Cover Sillon generates when Deezer has no artwork for a record, typeset with the artist and title. A record that gets one shows it everywhere, lists and record screen alike. Like any Cover it belongs to the Master, so it is always the same for the same Master, and never shows Release details such as the catalogue number. Not shown while artwork is still loading.
_Avoid_: Placeholder, fallback cover, default art

### Artists

**Artist picture**:
The photo shown for an artist in search results, from Discogs. The one Discogs image Sillon shows: an artist appears in one place only, so there is no other source to clash with.
_Avoid_: Avatar, artist thumb, artist cover

**Monogram**:
The artist's initials typeset in Sillon's style, shown when there is no Artist picture. At most two letters, from the first two words, skipping a leading article (The, Les, Die) and a Discogs disambiguator such as "(2)"; a name that starts with a digit, symbol or non-Latin script keeps its first character as written. Records get House sleeves, artists get Monograms — never the other way round.
_Avoid_: Initials, avatar placeholder

### Sorting

**Sort key**:
The attribute a list is ordered by: `added`, `artist`, `title` or `year`.
_Avoid_: Sort field, sort by

**Sort order**:
The direction of a sort: ascending or descending.
_Avoid_: Direction

**Default order**:
The sort order a sort key starts with when chosen: descending for `added` and `year` (most recent first), ascending for `artist` and `title` (A→Z).

### Metrics

**Estimated value**:
Discogs' marketplace-based estimate of what the Collection is worth, in the user's Discogs currency. Headline is the median; the minimum–maximum range is shown alongside to signal uncertainty. Not what the user paid.
_Avoid_: Collection value, worth, price

**Record count**:
The number of copies in a list — each owned copy counts once, even when the same release or album is owned several times. Matches the figure Discogs shows.
_Avoid_: Item count, size, total

**Discogs currency**:
The currency set on the user's Discogs account. Every money figure in Sillon is expressed in it; changing it in Sillon changes it on Discogs too. Sillon never converts between currencies.
_Avoid_: Display currency, preferred currency

### Marketplace

**Listing**:
One record offered for sale by a seller on the Discogs marketplace. Not a Copy: a Copy is owned by the user, a Listing belongs to someone else.
_Avoid_: Copy for sale, offer, stock

**Lowest price**:
The item price of the cheapest current Listing for a Release, in the Discogs currency. Excludes shipping, so it can understate what the record really costs.
_Avoid_: Starting price, from-price, cheapest

**Suggested price**:
Discogs' fair-price estimate for a Release in a given condition (Mint to Poor), in the Discogs currency. Unrelated to current Listings.
_Avoid_: Market value, estimate
