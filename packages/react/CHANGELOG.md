# @linkforty/aasa-react

## 0.3.0

### Minor Changes

- 18a4ac0: Add stable `aasa-*` class names to every element, and optional props for laying the component out with your own CSS: `unstyled`, `showSource`, `showRaw` with `renderRaw`, and `collapseAdvanced` with `advancedSummary`. Without the new props the component renders as before.

## 0.2.0

### Minor Changes

- 8dd25d2: Initial release: validate Apple App Site Association (AASA) files for iOS Universal Links.

  - `core`: runtime-agnostic validation engine (hosting, format, structure, and identifier checks).
  - `worker` / `node`: reference backends exposing `GET /validate`.
  - `widget` / `react`: embeddable web component and React component.

### Patch Changes

- Updated dependencies [8dd25d2]
  - @linkforty/aasa-core@0.2.0
