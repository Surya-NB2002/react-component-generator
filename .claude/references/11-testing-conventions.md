# 11. Testing Conventions

## Runner

Vitest, configured in `vitest.config.mts`:
- `environment: 'jsdom'`
- `vite-tsconfig-paths` plugin — so the `@/` alias (see [[01-setup-and-config]]) resolves inside tests
- `@vitejs/plugin-react`

Run with `npm test`, or a single file with `npm test -- <path>`.

## Convention: co-located `__tests__` directories

Tests live directly beside the code they cover, not in a top-level `tests/` folder:

- `src/components/chat/__tests__/` — `ChatInterface.test.tsx`, `MessageList.test.tsx`, `MessageInput.test.tsx`, `MarkdownRenderer.test.tsx`, `ToolInvocationBadge.test.tsx` (see [[06-chat-context-and-ui]])
- `src/components/editor/__tests__/file-tree.test.tsx` (see [[10-file-tree-and-editor-ui]])
- `src/hooks/__tests__/use-auth.test.ts` (see [[02-auth-and-sessions]], [[05-anonymous-work-tracking]])
- `src/lib/__tests__/file-system.test.ts` (see [[07-virtual-file-system]])
- `src/lib/contexts/__tests__/chat-context.test.tsx`, `file-system-context.test.tsx`
- `src/lib/transform/__tests__/jsx-transformer.test.ts` (see [[09-live-preview-jsx-transform]])

## Libraries

`@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event` for component tests (RTL render + user-event); plain `vi.fn()` mocks for server actions and modules like `@/lib/anon-work-tracker` when testing branch logic in isolation (see `use-auth.test.ts`).

## Scope

No separate e2e test setup — testing is unit/component-level only, scoped per-module next to the source it verifies. There is no standalone typecheck script; TypeScript errors surface via `npm run build` or editor tooling.
