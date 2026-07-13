# 4. App Shell & Routing

## Routes

- `src/app/layout.tsx` — root layout. Loads fonts (Geist/Geist Mono/Fraunces), sets metadata, wraps `{children}`. No providers live here.
- `src/app/page.tsx` — `/` route (Server Component). If a session exists, redirects to the user's most recent project (auto-creating one if none exists); otherwise renders `<MainContent user={user} />` in anonymous mode (no project).
- `src/app/[projectId]/page.tsx` — dynamic project route. Requires a signed-in user (redirects home if not); loads the project via `getProject` from [[03-data-model-and-persistence]] (redirects home on error/not-found); renders `<MainContent user project />`.
- `src/app/globals.css` — Tailwind v4 theme tokens.

## The shell

`src/app/main-content.tsx` (client component) is where the actual app is assembled:
- Wraps everything in `FileSystemProvider` (outer, see [[07-virtual-file-system]]) then `ChatProvider` (inner — needs the file system context, see [[06-chat-context-and-ui]]).
- Lays out a resizable two-pane UI (`react-resizable-panels`): left pane = `ChatInterface`; right pane = `Tabs` toggling between `PreviewFrame` ([[09-live-preview-jsx-transform]]) and `FileTree` + `CodeEditor` ([[10-file-tree-and-editor-ui]]).
- Top bar renders `HeaderActions`.

`src/components/HeaderActions.tsx` — project-switcher popover (`getProjects`), "new project" button (`createProject`), sign-out (`signOut`), and opens `AuthDialog` for anonymous users wanting to save their work.

## Provider order matters

`FileSystemProvider` must wrap `ChatProvider` because the chat context reads file system state (to serialize it into API requests) and writes to it (via tool-call forwarding). Get this order backwards and `useFileSystem()` inside `ChatProvider` will throw.
