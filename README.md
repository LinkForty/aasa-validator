# AASA Validator

Validate **Apple App Site Association (AASA)** files for iOS Universal Links - from the browser,
a server, or your own backend.

This is the open-source **tool** only. It ships the validation engine, an embeddable UI, and a
deployable backend. It deliberately contains no marketing/page content - drop it into your own
site and supply your own surrounding copy.

## Why a backend is needed

Browsers cannot fetch another domain's AASA file (cross-origin requests are blocked by CORS), so
the actual fetch has to happen server-side. The embeddable UI calls a small backend that fetches
the file, runs validation, and returns structured results. This repo ships that backend for both
**Cloudflare Workers** and **Node**.

## Packages

| Package                                     | What it is                                             |
|---------------------------------------------|--------------------------------------------------------|
| [`@linkforty/aasa-core`](packages/core)     | Runtime-agnostic validation engine + types (zero deps) |
| [`@linkforty/aasa-worker`](packages/worker) | Cloudflare Worker reference backend                    |
| [`@linkforty/aasa-node`](packages/node)     | Node/Express reference backend                         |
| [`@linkforty/aasa-widget`](packages/widget) | `<aasa-validator>` web component (any site)            |
| [`@linkforty/aasa-react`](packages/react)   | Native React component (Next/SSR-safe)                 |

## Quick start

Pick how you want to consume it:

- **Embed in plain HTML** → deploy a backend, then drop the [web component](packages/widget).
- **Embed in React/Next** → deploy a backend, then use the [React component](packages/react).
- **Just call the API** → deploy the [Worker](packages/worker) or [Node](packages/node) backend
  and `GET /validate?domain=example.com`.
- **Use the engine directly in your own server** → install
  [`@linkforty/aasa-core`](packages/core) and call `fetchAndValidate(domain)`.

See each package's README for copy-paste snippets, and [`examples/`](examples) for runnable demos.

## Development

```bash
pnpm install
pnpm test        # run the test suite (heaviest coverage in core)
pnpm typecheck
pnpm lint
pnpm build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Licensed under [MIT](LICENSE).
