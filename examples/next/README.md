# Next.js example (reference)

A minimal Next.js App Router page that embeds the React component. This directory is **reference
code** — it is not part of the monorepo install. Copy it into your own Next.js project.

```bash
npm install @linkforty/aasa-react
```

```tsx
// app/page.tsx — a Server Component
import { AasaValidator } from '@linkforty/aasa-react';

export default function Page() {
  return (
    <main>
      {/* your own SEO copy / headings here */}
      <AasaValidator endpoint="https://your-backend.example/validate" advanced />
    </main>
  );
}
```

`@linkforty/aasa-react` is already marked `"use client"`, so it works inside a Server Component
without extra directives.

## Backend

The component needs a backend to perform the cross-origin AASA fetch. Either:

- Deploy [`@linkforty/aasa-worker`](../../packages/worker) and set `endpoint` to its URL, or
- Add a route in your own app that calls `fetchAndValidate` from
  [`@linkforty/aasa-core`](../../packages/core) and point `endpoint` at it (e.g. `/api/validate`).

Set `NEXT_PUBLIC_AASA_ENDPOINT` to configure the endpoint in this example.
