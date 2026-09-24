# Currency is owned by Discogs

Every money figure in Sillon (starting with the Estimated value) is shown in the user's Discogs currency (`curr_abbr`), read fresh from the Discogs profile. The future currency setting writes `curr_abbr` back to Discogs instead of storing a Sillon-only preference, so it also changes the currency on discogs.com. We chose this because Sillon mirrors Discogs: the numbers stay exactly what Discogs computes, and we avoid depending on an exchange-rate API whose conversions would drift from Discogs' own figures.

## Considered Options

- **Sillon-only display currency with FX conversion**: rejected. It needs a new external dependency, and the converted figures would no longer match discogs.com.
- **No setting (user changes it on discogs.com)**: rejected because it's less convenient. It stays compatible with this decision.
