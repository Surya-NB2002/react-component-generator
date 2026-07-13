# 8. API Route & AI Tool Loop

This is where a chat message actually becomes file system mutations.

## The route

`src/app/api/chat/route.ts` — `POST` handler:
1. Reads `{ messages, files, projectId }` from the request body.
2. Prepends a system message built from `generationPrompt` (see below), with `providerOptions.anthropic.cacheControl: ephemeral` for prompt caching.
3. Reconstructs a server-side `VirtualFileSystem` via `deserializeFromNodes(files)` — mirrors the client's FS so tool calls have something to mutate (see [[07-virtual-file-system]]).
4. Picks a model via `getLanguageModel()` (below).
5. Calls `streamText` with `tools: { str_replace_editor, file_manager }`, built by `buildStrReplaceTool(fileSystem)` / `buildFileManagerTool(fileSystem)`.
6. `maxSteps` is capped at 4 for the mock provider (vs 40 for real Anthropic) to prevent infinite canned-response loops.
7. `onFinish` — if `projectId` is present and the session is authenticated, merges response messages via `appendResponseMessages` and persists `messages`/`data` (re-`serialize()`d FS) back to the `Project` row (see [[03-data-model-and-persistence]]).
8. Returns `result.toDataStreamResponse()`. `maxDuration = 120`.

## Model selection

`src/lib/provider.ts` — `getLanguageModel()`:
- If `ANTHROPIC_API_KEY` is unset or a placeholder, returns a `MockLanguageModel` — a scripted multi-step generator implementing the full `LanguageModelV1` interface (`doGenerate`/`doStream`) so it's a drop-in for `streamText`. It creates a component file, "enhances" it via `str_replace`, creates `/App.jsx`, then returns a text summary — branching on prompt keywords like "form"/"card" vs. a default counter component. This lets the whole chat flow be exercised in tests/dev without a real API key.
- Otherwise returns `anthropic("claude-haiku-4-5")` from `@ai-sdk/anthropic`.

## System prompt

`src/lib/prompts/generation.tsx` — exports `generationPrompt`: always create a root `/App.jsx` default export, style with Tailwind only (no inline styles/CSS files), no HTML files, use the `@/` import alias for local files, keep responses brief.

## The two tools

- `src/lib/tools/str-replace.ts` — `buildStrReplaceTool(fileSystem)`: Anthropic text-editor-style tool (`view`/`create`/`str_replace`/`insert`/`undo_edit`) with a Zod schema. Delegates each command to the matching `VirtualFileSystem` method (`viewFile`, `createFileWithParents`, `replaceInFile`, `insertInFile`). `undo_edit` explicitly returns a "not supported" error — there is no undo.
- `src/lib/tools/file-manager.ts` — `buildFileManagerTool(fileSystem)`: handles `rename`/`delete`, calling `fileSystem.rename`/`deleteFile` and returning `{success, message|error}`.

## Full loop, end to end

`ChatProvider` (client, [[06-chat-context-and-ui]]) → POST `/api/chat` → reconstruct server FS → `streamText` calls a tool → tool mutates server FS → tool-call event streams back to client → `onToolCall` in `ChatProvider` forwards it to `handleToolCall` in `FileSystemProvider` ([[07-virtual-file-system]]) → client FS mutates identically → `refreshTrigger` fires → `PreviewFrame`/`FileTree`/`CodeEditor` re-render.
