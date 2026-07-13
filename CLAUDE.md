# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup       # install deps + prisma generate + migrate dev (first-time setup)
npm run dev          # start dev server (Next.js + Turbopack) on localhost:3000
npm run build        # production build
npm run lint         # next lint
npm test             # run all tests (vitest)
npm test -- <path>   # run a single test file, e.g. npm test -- src/lib/__tests__/file-system.test.ts
npm run db:reset      # reset the SQLite dev database (prisma migrate reset --force)
```

There is no separate typecheck script; TypeScript errors surface via `npm run build` or editor tooling.

**Never run `npm audit fix`** — dependencies are pinned to versions known to work together, and audit fix can bump packages past compatible versions. Address known vulnerabilities by updating the pinned version directly instead.

The app works without an `ANTHROPIC_API_KEY` in `.env` — `src/lib/provider.ts` falls back to a `MockLanguageModel` that returns canned tool calls/components (see `src/lib/provider.ts`) so the chat flow can be exercised without real API calls.

## Architecture

UIGen is an AI chat app that generates React components into a **virtual, in-memory file system** — nothing is written to disk. The three core pieces to understand before making changes:

### 1. Virtual file system (`src/lib/file-system.ts`)

`VirtualFileSystem` is a plain class (not React state) that models files/directories in a `Map`, keyed by normalized absolute path. It exposes both a friendly API (`createFile`, `updateFile`, `deleteFile`, `rename`) and Anthropic text-editor-style commands (`viewFile`, `createFileWithParents`, `replaceInFile`, `insertInFile`) used directly by the AI tools. It can be serialized to/from plain objects (`serialize`/`deserializeFromNodes`) for persistence and for passing across the client/server boundary.

`FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`) wraps one `VirtualFileSystem` instance in React context, exposes CRUD callbacks that trigger re-renders via a `refreshTrigger` counter, and — critically — `handleToolCall`, which maps AI SDK tool-call events (`str_replace_editor`, `file_manager`) onto file system mutations. This is how the AI's tool calls made *inside the API route* end up reflected in the client-side editor/preview.

### 2. Chat + AI tool loop (`src/app/api/chat/route.ts`, `src/lib/tools/*`, `src/lib/provider.ts`)

The client (`ChatProvider` in `src/lib/contexts/chat-context.tsx`, using `@ai-sdk/react`'s `useChat`) POSTs the full chat history plus the *serialized* virtual file system to `/api/chat`. The route:

1. Reconstructs a server-side `VirtualFileSystem` from the serialized files.
2. Prepends the system prompt (`src/lib/prompts/generation.tsx`) with ephemeral prompt caching.
3. Runs `streamText` from the `ai` SDK with two tools bound to that file system instance: `str_replace_editor` (`src/lib/tools/str-replace.ts` — view/create/str_replace/insert, no undo support) and `file_manager` (`src/lib/tools/file-manager.ts` — rename/delete).
4. On finish, if `projectId` is present and the user is authenticated, persists `messages` and the serialized file system (`fileSystem.serialize()`) to the `Project.data`/`Project.messages` JSON columns.

The client's `onToolCall` handler in `chat-context.tsx` forwards every tool call back into `FileSystemProvider.handleToolCall`, which is how server-side edits become visible in the client's file tree/editor/preview without the client re-fetching files.

`getLanguageModel()` in `provider.ts` picks between the real Anthropic model (`claude-haiku-4-5`) and `MockLanguageModel` based on whether `ANTHROPIC_API_KEY` is set/non-placeholder. `maxSteps` is capped lower for the mock provider to avoid infinite canned-response loops.

Generation conventions enforced by the system prompt: every project must have a root `/App.jsx` default export, styling must use Tailwind (no inline styles/CSS files), and cross-file imports must use the `@/` alias (e.g. `@/components/Foo`).

### 3. Live preview (`src/lib/transform/jsx-transformer.ts`, `src/components/preview/PreviewFrame.tsx`)

There's no bundler. `createImportMap` walks all virtual files, transpiles each JS/JSX/TS/TSX file with Babel standalone (`transformJSX`), wraps the compiled code in a `Blob` URL, and builds a browser-native `<script type="importmap">` mapping every possible import specifier variant (`@/x`, `/x`, `x`, with/without extension) to its blob URL. React/ReactDOM come from `esm.sh`. Missing local imports get an auto-generated placeholder module so the preview doesn't hard-crash; missing third-party packages are resolved live via `esm.sh`. `createPreviewHTML` assembles the final iframe document (Tailwind via CDN script, an error boundary, and pretty-printed syntax error panels if any file failed to transform).

### Persistence & auth

- SQLite via Prisma (`prisma/schema.prisma`); client generated to `src/generated/prisma` (non-default output path — import from there, not `@prisma/client`, if generated code is referenced directly).
- `Project.messages` and `Project.data` are JSON stored as strings (chat history and serialized file system respectively) — no separate file-storage tables.
- Auth is a custom JWT-in-httpOnly-cookie session (`src/lib/auth.ts`, using `jose`), not NextAuth. `src/middleware.ts` protects `/api/projects` and `/api/filesystem` paths only.
- Anonymous (unauthenticated) users can still generate components; their in-progress chat + file system are cached in `sessionStorage` via `src/lib/anon-work-tracker.ts` so work isn't lost if they sign up/in mid-session.
- Server actions live in `src/actions/` (`"use server"`), e.g. `signUp`/`signIn`/`signOut`/`getUser` in `src/actions/index.ts`, and project CRUD in `create-project.ts`/`get-project.ts`/`get-projects.ts`.

## Testing

Tests use Vitest with `jsdom` + `@testing-library/react` (see `vitest.config.mts`); path aliases from `tsconfig.json` are honored via `vite-tsconfig-paths`. Test files live alongside their subject in `__tests__` directories (e.g. `src/lib/__tests__/file-system.test.ts`, `src/lib/transform/__tests__/jsx-transformer.test.ts`, `src/lib/contexts/__tests__/*`, `src/components/**/__tests__/*`).
