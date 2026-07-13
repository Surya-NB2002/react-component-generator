# 10. File Tree / Code Editor UI

The manual-editing counterpart to the AI tool loop — both paths share the same underlying `VirtualFileSystem` (see [[07-virtual-file-system]]).

## Components

- `src/components/editor/FileTree.tsx` — recursive `FileTreeNode` walking the `VirtualFileSystem`'s `FileNode` tree via `useFileSystem()`; sorts directories before files, then alphabetically; click toggles directory expand/collapse (local `isExpanded` state) or sets `selectedFile`; indentation is `level * 12px`; icons from `lucide-react` (`Folder`/`FolderOpen`/`FileCode`/chevrons); wrapped in a Radix `ScrollArea`.
- `src/components/editor/CodeEditor.tsx` — wraps `@monaco-editor/react`'s `<Editor>`; reads `selectedFile`/`getFileContent`/`updateFile` from `useFileSystem()`; `getLanguageFromPath` maps extensions (`js`/`jsx` → javascript, `ts`/`tsx` → typescript, plus `json`/`css`/`html`/`md`) to Monaco language ids. `handleEditorChange` writes edits directly back into the `VirtualFileSystem` via `updateFile` — **the same code path the AI tools use** (see [[08-api-route-and-ai-tools]]), so manual edits and AI edits share one file system and one refresh mechanism. Shows an empty state when no file is selected.

## Supporting UI primitives

`src/components/ui/scroll-area.tsx`, `resizable.tsx`, `tabs.tsx` (the preview/code tab switch wired up in `src/app/main-content.tsx`, see [[04-app-shell-and-routing]]).

## Test

`src/components/editor/__tests__/file-tree.test.tsx`.

## Key takeaway

There is exactly one mutation path into the file system (`VirtualFileSystem`'s methods, called either directly by these components or indirectly via `handleToolCall`) — never bypass it by reaching into the FS's internal `Map` from new code.
