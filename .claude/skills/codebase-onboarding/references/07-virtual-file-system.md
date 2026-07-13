# 7. Virtual File System

The core abstraction of the whole app: nothing is ever written to disk. Understanding this file is the single highest-leverage thing a new contributor can do.

## The class

`src/lib/file-system.ts` — `VirtualFileSystem`. A plain class (not React state): an in-memory `Map<string, FileNode>` keyed by normalized absolute path, plus a `root` node whose `children` is itself a `Map`.

Public API:
- CRUD: `createFile`, `createDirectory`, `readFile`, `updateFile`, `deleteFile` (recursive for directories), `rename` (recursively fixes descendant paths), `exists`, `getNode`, `listDirectory`, `getAllFiles()` (flat `Map<path, content>` — what the preview/editor iterate over).
- Persistence: `serialize()` → `Record<string, FileNode>` (drops the `children` `Map` so it's JSON-safe — this is exactly what gets written to `Project.data`, see [[03-data-model-and-persistence]], and sent over the wire to `/api/chat`). `deserialize(Record<string,string>)` and `deserializeFromNodes(Record<string,FileNode>)` rebuild an instance from serialized form (sorting paths so parents are created before children).
- AI text-editor–style helpers (mirror Anthropic's text-editor tool spec), used directly by the AI tools in [[08-api-route-and-ai-tools]]: `viewFile` (line-numbered view or directory listing), `createFileWithParents`, `replaceInFile`, `insertInFile`.
- `reset()`.
- A default singleton `fileSystem` is exported but largely unused — nearly all real code instantiates its own `VirtualFileSystem`.

## The React wrapper

`src/lib/contexts/file-system-context.tsx` — `FileSystemProvider`/`useFileSystem`:
- Instantiates one `VirtualFileSystem` per provider, optionally seeded from `initialData` (a loaded project's `data`) via `deserializeFromNodes`.
- Tracks `selectedFile` (auto-selects `/App.jsx` or the first root file) and a `refreshTrigger` counter — needed because the underlying `VirtualFileSystem` mutates in place rather than through immutable state, so consumers (`PreviewFrame`, `FileTree`) need an explicit signal to re-render.
- Exposes CRUD wrappers (`createFile`/`updateFile`/`deleteFile`/`renameFile`/`getFileContent`/`getAllFiles`/`reset`).
- Exposes `handleToolCall(toolCall)` — the other half of the bridge described in [[06-chat-context-and-ui]]: translates AI tool-call payloads (`str_replace_editor`'s `create`/`str_replace`/`insert`, `file_manager`'s `rename`/`delete`) into calls on the `VirtualFileSystem` instance, then the React wrappers, so the UI updates.

## Tests

`src/lib/__tests__/file-system.test.ts` (the class itself), `src/lib/contexts/__tests__/file-system-context.test.tsx` (the React wrapper).

## Two instances, one shape

There are always **two** `VirtualFileSystem` instances involved in a single AI turn: one on the client (inside `FileSystemProvider`) and one reconstructed server-side inside the `/api/chat` route handler from the same serialized data. They never share memory — they're kept in sync only because the client mirrors every tool call the server already applied. See [[08-api-route-and-ai-tools]].
