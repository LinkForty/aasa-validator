# @linkforty/aasa-worker

Cloudflare Worker reference backend for AASA Validator. It exposes one endpoint that fetches a
domain's AASA file server-side (avoiding the browser's CORS restriction) and returns structured
validation results for the [widget](../widget) / [React component](../react) — or any HTTP client.

## API

```
GET /validate?domain=example.com
            [&appID=ABCDE12345.com.example.app]
            [&teamID=ABCDE12345] [&bundleID=com.example.app]
```

Returns `200 application/json` with a `ValidationResult` (see
[`@linkforty/aasa-core`](../core)). CORS is enabled (`Access-Control-Allow-Origin: *`) so the
browser UI can call it directly.

## Deploy

```bash
# from the repo root
pnpm --filter @linkforty/aasa-worker deploy
```

This deploys to your own Cloudflare account (run `wrangler login` first). Edit `name` in
`wrangler.jsonc` to change the Worker name / route. Point the widget's `endpoint` at the deployed
URL, e.g. `https://aasa-validator.<your-subdomain>.workers.dev/validate`.

## Develop

```bash
pnpm --filter @linkforty/aasa-core build   # build the dependency first
pnpm --filter @linkforty/aasa-worker dev
curl 'http://localhost:8787/validate?domain=apple.com'
```

## License

MIT
