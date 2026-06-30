# @linkforty/aasa-core

Runtime-agnostic engine that validates **Apple App Site Association (AASA)** files for iOS
Universal Links. Zero dependencies; runs in Node 18+, Cloudflare Workers, Deno, and Bun.

```bash
npm install @linkforty/aasa-core
```

## Usage

### Fetch + validate (server-side)

```ts
import { fetchAndValidate } from '@linkforty/aasa-core';

const result = await fetchAndValidate('apple.com', {
  // all optional — supply to confirm your app is listed
  appID: 'ABCDE12345.com.example.app',
  // or: teamID: 'ABCDE12345', bundleID: 'com.example.app',
});

console.log(result.ok); // false if any check failed
for (const c of result.checks) {
  console.log(c.status, c.label, '—', c.message);
}
```

> Fetching another domain's AASA file is blocked by CORS in browsers, so `fetchAndValidate`
> must run server-side. The pure `validate()` function below has no such restriction.

### Validate an already-fetched file (pure, no network)

```ts
import { validate } from '@linkforty/aasa-core';

const result = validate({
  domain: 'example.com',
  fetched: {
    url: 'https://example.com/.well-known/apple-app-site-association',
    location: 'well-known',
    status: 200,
    redirected: false,
    finalUrl: 'https://example.com/.well-known/apple-app-site-association',
    contentType: 'application/json',
    body: '{ "applinks": { "details": [] } }',
    byteLength: 33,
  },
});
```

### Render-ready checklist

```ts
import { toChecklist } from '@linkforty/aasa-core';

const items = toChecklist(result); // [{ id, label, group, status, message, details }]
```

## What it checks

**Hosting** — domain reachable, found at `/.well-known/`, HTTPS, HTTP 200, no redirects.
**Format** — `Content-Type`, no file extension, reasonable size, no BOM, valid JSON.
**Structure** — recognized top-level keys, `applinks` shape (modern + legacy), app ID format,
component patterns.
**Identifier** — when you supply an app/team/bundle id, confirms a matching entry exists.

Each check has a `status` of `pass` | `warn` | `fail` | `skip`. `result.ok` is `true` when there
are no `fail` checks.

## License

MIT
