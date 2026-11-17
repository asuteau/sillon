# Coding standards

For reviewers. ESLint, Prettier and `tsc` already cover the mechanical rules (`pnpm lint`, `pnpm format`, `npx tsc --noEmit`, all run in CI). Review the judgement calls below, and check every one against the diff.

- **React**: every rule in `docs/react-best-practices.md`.
- **File placement and suffixes**: `docs/conventions.md`.
- **UI, motion and copy**: `docs/design-system.md` (tokens over raw values, motion durations and easings, reduced motion, both themes, voice).
- **Domain terms**: names in code and copy match `CONTEXT.md`; a new concept gets a glossary entry.
- **Decisions**: the change respects `docs/adr/`; overturning one needs a new ADR.
- **Lint suppressions**: `eslint-suppressions.json` only shrinks. A diff that adds an entry, or an `eslint-disable` comment, is a finding.
