# Dependencies are pinned, never `latest`

Every dependency in `package.json` uses an explicit caret range (`^x.y.z`), never `"latest"`. Nitro stays on `nitro-nightly` (no stable v3 yet) but is pinned to one exact build. TanStack Router/Start packages are bumped together, with `@tanstack/react-router` matching the exact version `@tanstack/react-start` depends on. Vulnerable transitive deps that parents haven't fixed are forced with same-major `pnpm.overrides` only. We chose this because `"latest"` left the real version decided by whenever the lockfile was last refreshed: a vulnerable `@tanstack/react-start@1.166.8` sat unnoticed until Vercel blocked the deploy.

## Considered Options

- **Keep `"latest"`, refresh lockfile periodically**: rejected. Builds aren't reproducible from `package.json`, and the Router/Start family can drift out of sync.
- **Cross-major overrides**: rejected. They silently break parent packages; a major bump is its own task.
