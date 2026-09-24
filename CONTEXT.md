# Sillon

Personal vinyl record app mirroring a user's Discogs collection and wantlist.

## Language

### Lists

**Collection**:
The records the user owns, as recorded in their Discogs collection.
_Avoid_: Library, shelf

**Wantlist**:
The records the user wants to acquire, as recorded in their Discogs wantlist.
_Avoid_: Wishlist, wants

### Sorting

**Sort key**:
The attribute a list is ordered by: `added`, `artist`, `title` or `year`.
_Avoid_: Sort field, sort by

**Sort order**:
The direction of a sort: ascending or descending.
_Avoid_: Direction

**Default order**:
The sort order a sort key starts with when chosen: descending for `added` and `year` (most recent first), ascending for `artist` and `title` (A→Z).
