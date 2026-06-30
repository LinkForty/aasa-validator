# @linkforty/aasa-widget

A framework-agnostic `<aasa-validator>` web component. Drop it into any page — plain HTML, React,
Vue, Svelte — with a single element. It renders the form and results; a [backend](../worker) does
the actual cross-origin fetch.

## Plain HTML (one script tag)

```html
<script type="module" src="https://unpkg.com/@linkforty/aasa-widget/dist/aasa-validator.global.js"></script>

<aasa-validator endpoint="https://your-backend.example/validate" advanced></aasa-validator>
```

## With a bundler

```bash
npm install @linkforty/aasa-widget
```

```ts
import '@linkforty/aasa-widget'; // registers <aasa-validator>
```

```html
<aasa-validator endpoint="/validate"></aasa-validator>
```

## Attributes

| Attribute | Description |
| --- | --- |
| `endpoint` | Backend `/validate` URL (default `/validate`). |
| `advanced` | Show optional App ID / Team ID / Bundle ID fields. |

## Events

Emits an `aasa-result` `CustomEvent` (detail = the `ValidationResult`) after each validation.

## Theming

The component uses Shadow DOM and is themeable via CSS custom properties on the element:

```css
aasa-validator {
  --aasa-color-accent: #6d28d9;
  --aasa-color-pass: #15803d;
  --aasa-font: 'Inter', sans-serif;
}
```

Available variables: `--aasa-color-accent`, `--aasa-color-pass`, `--aasa-color-warn`,
`--aasa-color-fail`, `--aasa-color-skip`, `--aasa-color-border`, `--aasa-color-bg`,
`--aasa-color-fg`, `--aasa-font`.

## License

MIT
