# 1. Project Setup & Config

Where to start: the files that define how the project is built, run, and configured before any app code runs.

## Key files

- `package.json` — scripts: `npm run setup` (install + `prisma generate` + `prisma migrate dev`, first-time only), `npm run dev` (Next.js + Turbopack), `npm run build`, `npm run lint`, `npm test` (vitest), `npm run db:reset` (`prisma migrate reset --force`). Notable deps: `ai` + `@ai-sdk/anthropic` (LLM streaming SDK), `@babel/standalone` (in-browser JSX transform, see [[09-live-preview-jsx-transform]]), `@monaco-editor/react` (code editor, see [[10-file-tree-and-editor-ui]]), `@prisma/client`, `bcrypt` + `jose` (auth, see [[02-auth-and-sessions]]), `react-resizable-panels`.
- `next.config.ts` — imports `./node-compat.cjs` first (a Node 25+ Web Storage shim needed for Windows compatibility), disables `devIndicators`, pins `turbopack.root`.
- `node-compat.cjs` — the shim referenced above.
- `tsconfig.json` — path alias `@/* -> ./src/*`, used everywhere (imports, tests, and the import map built in [[09-live-preview-jsx-transform]]).
- `vitest.config.mts` — `environment: 'jsdom'`, `vite-tsconfig-paths` plugin (so `@/` resolves in tests), `@vitejs/plugin-react`. See [[11-testing-conventions]].
- `prisma/schema.prisma` — SQLite datasource (`file:./dev.db`), client output redirected to `src/generated/prisma` (non-default path — import from there, not `@prisma/client`). Models: `User` (has many `Project`), `Project` (`messages`/`data` stored as JSON strings). Full detail in [[03-data-model-and-persistence]].
- `src/generated/prisma/` — generated client code, not hand-edited.
- `src/lib/prisma.ts` — singleton `PrismaClient` (`globalForPrisma` pattern avoids connection leaks on dev hot-reload). Imported by every file in `src/actions/*` and by the chat API route.
- `.env` — holds `ANTHROPIC_API_KEY`. Absent or placeholder → the app falls back to a `MockLanguageModel` instead of calling real Anthropic (see [[08-api-route-and-ai-tools]]). Never run `npm audit fix` in this repo — dependencies are pinned to known-compatible versions.

## Why this matters first

Every other area depends on these fundamentals: the `@/` alias appears in nearly every import; the Prisma client location affects any code touching the database; and whether `ANTHROPIC_API_KEY` is set changes the actual runtime behavior of the whole chat flow.
