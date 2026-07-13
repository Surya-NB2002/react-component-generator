# 6. Chat Context & UI

## Context

`src/lib/contexts/chat-context.tsx` — `ChatProvider`/`useChat`. Wraps `@ai-sdk/react`'s `useChat`, pointed at `/api/chat`. On each request it sends `{ files: fileSystem.serialize(), projectId }`, pulling the current file system from `useFileSystem()` (see [[07-virtual-file-system]]). Its `onToolCall` handler forwards every AI tool call directly to `handleToolCall` on the file system context — **this is the bridge that turns server-side AI tool calls into client-side file system mutations**, so the editor/preview update without any extra fetch. It also fires the anonymous-work-tracking effect (see [[05-anonymous-work-tracking]]). Exposes `messages`, `input`, `handleInputChange`, `handleSubmit`, `status`.

## Components

- `src/components/chat/ChatInterface.tsx` — top-level chat panel; auto-scrolls a `ScrollArea` on new messages; renders `MessageList` + `MessageInput`; derives `isLoading` from the AI SDK's `status`.
- `src/components/chat/MessageList.tsx` — renders the message array (user/assistant turns), delegating markdown and tool-call rendering to the components below.
- `src/components/chat/MessageInput.tsx` — textarea + submit button bound to `input`/`handleInputChange`/`handleSubmit`.
- `src/components/chat/MarkdownRenderer.tsx` — renders assistant text via `react-markdown`.
- `src/components/chat/ToolInvocationBadge.tsx` — visual badge for in-flight/finished tool calls (`str_replace_editor`, `file_manager`) shown inline in the message stream.

## Tests

`src/components/chat/__tests__/{ChatInterface,MessageList,MessageInput,MarkdownRenderer,ToolInvocationBadge}.test.tsx`, `src/lib/contexts/__tests__/chat-context.test.tsx`.

## Where this connects next

Every message the user sends round-trips through `src/app/api/chat/route.ts` — see [[08-api-route-and-ai-tools]] for what happens server-side, including the tools that `onToolCall` above is reacting to.
