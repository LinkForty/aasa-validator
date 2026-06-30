# @linkforty/aasa-react

A native React component for AASA Validator. SSR-safe (no custom elements), so it works in
Next.js (App Router and Pages Router) and any React app. It renders the form and results; a
[backend](../worker) does the actual cross-origin fetch.

```bash
npm install @linkforty/aasa-react
```

## Usage

```tsx
import { AasaValidator } from '@linkforty/aasa-react';

export default function Page() {
  return (
    <main>
      {/* your own page content / SEO copy goes here */}
      <AasaValidator endpoint="https://your-backend.example/validate" advanced />
    </main>
  );
}
```

> In the Next.js App Router the package is already marked `"use client"`, so you can drop it into
> a Server Component without adding the directive yourself.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `endpoint` | `string` | Backend `/validate` URL (default `/validate`). |
| `advanced` | `boolean` | Show optional App ID / Team ID / Bundle ID fields. |
| `onResult` | `(result: ValidationResult) => void` | Called after each successful validation. |
| `className`, `style` | — | Applied to the root element. |

## Theming

The component is styled inline using CSS custom properties, so set them on any ancestor:

```css
.my-wrapper {
  --aasa-color-accent: #6d28d9;
  --aasa-color-pass: #15803d;
  --aasa-font: 'Inter', sans-serif;
}
```

Variables: `--aasa-color-accent`, `--aasa-color-pass`, `--aasa-color-warn`, `--aasa-color-fail`,
`--aasa-color-skip`, `--aasa-color-border`, `--aasa-color-fg`, `--aasa-font`.

## License

MIT
