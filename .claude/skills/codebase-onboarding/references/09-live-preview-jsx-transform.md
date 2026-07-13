# 9. Live Preview / JSX Transform

There is no bundler. The preview is a fully client-side, in-browser module system built on Babel standalone and blob URLs.

## Transform pipeline

`src/lib/transform/jsx-transformer.ts`:
- `transformJSX(code, filename, existingFiles)` — regex-scans `import ... from '...'` statements to collect `missingImports`, separately detects/strips `.css` imports (`cssImports`); runs Babel (`@babel/standalone`) with `preset-react` (automatic runtime) + `preset-typescript` for `.ts`/`.tsx`; returns compiled `code` or an `error` string per file.
- `createBlobURL(code, mimeType)` — wraps compiled code in a `Blob`, returns an object URL used as the module's resolvable URL.
- `createImportMap(files: Map<path, content>)` — the core step. Seeds esm.sh CDN URLs for `react`/`react-dom`/jsx-runtime; for every JS/JSX/TS/TSX file, transforms it, creates a blob URL, and registers many path-variant keys (`@/x`, `/x`, `x`, with/without extension) in the browser-native `importmap` so any import style resolves; unresolved local imports get an auto-generated placeholder module (`createPlaceholderModule`) so a missing file doesn't hard-crash the whole preview; unresolved third-party packages resolve live via `https://esm.sh/<pkg>`; `.css` contents are concatenated into `styles`. Collects per-file `errors`.
- `createPreviewHTML(entryPoint, importMap, styles, errors)` — assembles the final iframe `srcdoc`: Tailwind CDN script, injected `<style>` for CSS + error-panel styling, the `<script type="importmap">`, and (if no errors) a `<script type="module">` that dynamically imports the entry point's blob URL, wraps the rendered app in an `ErrorBoundary` class, and mounts to `#root`. If there are transform errors, it renders a pretty-printed error panel instead of attempting to mount.

## The React side

`src/components/preview/PreviewFrame.tsx` — on every `refreshTrigger`/file change from `useFileSystem()` (see [[07-virtual-file-system]]): calls `getAllFiles()`, resolves an entry point by checking, in order, `/App.jsx`, `/App.tsx`, `/index.jsx`, `/index.tsx`, `/src/App.jsx`, `/src/App.tsx`, or the first `.jsx`/`.tsx` file found; calls `createImportMap` + `createPreviewHTML`; assigns the result to `iframe.srcdoc` (sandboxed with `allow-scripts allow-same-origin allow-forms`). Shows a "welcome" empty state before any files exist and a "no preview" state otherwise.

## Test

`src/lib/transform/__tests__/jsx-transformer.test.ts`.

## Why it matters

Every AI-generated component is only ever validated by this transform pipeline at preview time — there's no build step, no type-checking of generated code, and no server round-trip for rendering. Bugs here surface as broken previews, not build failures.
