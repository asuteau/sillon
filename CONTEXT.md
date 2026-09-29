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

### Records

**Master**:
The abstract work — an album as labels and Discogs define it — grouping every pressing of it.
_Avoid_: Album group

**Release**:
One specific pressing of a Master (label, country, year, format). The Collection and Wantlist hold Releases. A Release may have no Master.
_Avoid_: Version, pressing, edition

**Cover**:
The HD artwork shown for a record. It belongs to the Master: every Release of a Master shows the same Cover. A Release without a Master has its own Cover.
_Avoid_: Artwork, image, thumb

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
