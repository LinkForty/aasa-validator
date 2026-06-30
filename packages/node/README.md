# @linkforty/aasa-node

Node/Express reference backend for AASA Validator, for adopters not on Cloudflare. It fetches a
domain's AASA file server-side (avoiding the browser's CORS restriction) and returns structured
validation results for the [widget](../widget) / [React component](../react) — or any HTTP client.

It implements the same contract as [`@linkforty/aasa-worker`](../worker).

## Run

```bash
npm install @linkforty/aasa-node
npx aasa-validator-server          # listens on :8787 (override with PORT)
curl 'http://localhost:8787/validate?domain=apple.com'
```

## Embed in your own server

```ts
import { createApp } from '@linkforty/aasa-node';

const app = createApp();
app.listen(3000);
// or mount the route into an existing Express app of your own
```

## API

```
GET /validate?domain=example.com
            [&appID=ABCDE12345.com.example.app]
            [&teamID=ABCDE12345] [&bundleID=com.example.app]
```

Returns `200 application/json` with a `ValidationResult` (see
[`@linkforty/aasa-core`](../core)). CORS is enabled so the browser UI can call it directly.

## License

MIT
