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
| `unstyled` | `boolean` | Render without the built-in inline styles, so your own CSS lays it out (see [Styling with your own CSS](#styling-with-your-own-css)). Default `false`. |
| `showSource` | `boolean` | Show the URL the file was read from under the summary. Default `false`. |
| `showRaw` | `boolean` | Show the raw file in a collapsible `<details>` under the checks. Default `false`. |
| `renderRaw` | `(raw: string) => ReactNode` | Custom rendering of the raw file inside its `<pre>`, e.g. syntax highlighting. |
| `collapseAdvanced` | `boolean` | Put the `advanced` fields inside a collapsed `<details>`. Default `false`. |
| `advancedSummary` | `string` | Summary text of the collapsed `advanced` fields. Default `Optional: check your app`. |

All of these are optional. Without them the component renders exactly as before.

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

## Styling with your own CSS

Every element carries a stable class name, whether or not the component is styled:

| Class | Element |
| --- | --- |
| `aasa` | Root (your `className` is added next to it) |
| `aasa-form`, `aasa-field`, `aasa-field-domain` / `-appid` / `-team` / `-bundle`, `aasa-label`, `aasa-input`, `aasa-button` | The form |
| `aasa-advanced`, `aasa-advanced-toggle` | The optional fields, and their `<details>` when `collapseAdvanced` is set |
| `aasa-error` | Request error |
| `aasa-result` | Everything below the form once a result is in |
| `aasa-summary`, `aasa-badge` + `aasa-badge-valid` / `aasa-badge-issues`, `aasa-counts`, `aasa-source` | The summary line |
| `aasa-group` + `aasa-group-hosting` / `-format` / `-structure` / `-identifier`, `aasa-group-title`, `aasa-list` | A group of checks |
| `aasa-item` + `aasa-item-pass` / `-warn` / `-fail` / `-skip`, `aasa-icon`, `aasa-item-body`, `aasa-check-label`, `aasa-check-message`, `aasa-details` | One check |
| `aasa-raw` | The raw file `<details>` (`showRaw`) |

Inline styles win over stylesheet rules, so to lay the component out yourself pass `unstyled` and
style these classes. For example, a two-column grid of check groups:

```css
.aasa-result { display: grid; grid-template-columns: 1fr 1fr; gap: 0 2rem; }
.aasa-summary, .aasa-raw { grid-column: 1 / -1; }
```

## License

MIT
