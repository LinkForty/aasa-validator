# Plain HTML example

Embeds the `<aasa-validator>` web component in a static page with no build step.

## Run it locally

1. Build the widget and start a backend (from the repo root):

   ```bash
   pnpm --filter @linkforty/aasa-widget build
   pnpm --filter @linkforty/aasa-node build
   PORT=8787 pnpm --filter @linkforty/aasa-node start
   ```

2. Open `index.html` in your browser and validate a domain (e.g. `apple.com`).

## Using it on your own site

Load the published build from a CDN and point `endpoint` at your deployed backend:

```html
<script type="module"
  src="https://unpkg.com/@linkforty/aasa-widget/dist/aasa-validator.global.js"></script>

<aasa-validator endpoint="https://your-backend.example/validate" advanced></aasa-validator>
```

Everything around the element — headings, copy, styling — is yours to provide.
