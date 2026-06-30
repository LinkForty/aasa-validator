# Contributing

Thanks for your interest in improving AASA Validator!

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

This is a [pnpm](https://pnpm.io) monorepo. Source lives in `packages/*`; runnable demos in
`examples/*`.

## Where things live

- **All validation logic** belongs in [`packages/core`](packages/core). The backends and UIs are
  intentionally thin — if you're adding or changing a rule, add it under `packages/core/src/rules`
  and cover it with a fixture-backed test in `packages/core/test`.
- The backends (`worker`, `node`) only fetch and serve; the UIs (`widget`, `react`) only render.

## Before opening a PR

```bash
pnpm check       # biome lint + format (auto-fix)
pnpm typecheck
pnpm test
pnpm build
```

Add a changeset describing your change so it lands in the changelog on the next release:

```bash
pnpm changeset
```

## Reporting AASA edge cases

If you found an AASA file the validator handles incorrectly, a failing test with a minimal
fixture (added to `packages/core/test/fixtures`) is the most useful kind of bug report.
