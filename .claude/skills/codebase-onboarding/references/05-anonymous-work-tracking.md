# 5. Anonymous User Work Tracking

Lets unauthenticated users generate components on `/` without losing work if they later sign up/in.

## Key file

`src/lib/anon-work-tracker.ts` — sessionStorage-backed helpers:
- `setHasAnonWork(messages, fileSystemData)` — only persists if there's real content (not an empty chat/FS).
- `getHasAnonWork()` — cheap check for the migration prompt.
- `getAnonWorkData()` — retrieves the stored `{messages, data}`.
- `clearAnonWork()` — removes it after migration.

## Wiring

1. `src/lib/contexts/chat-context.tsx` — a `useEffect` calls `setHasAnonWork(messages, fileSystem.serialize())` whenever `messages` change **and there is no `projectId`** (i.e., an anonymous session on `/`). See [[06-chat-context-and-ui]].
2. `src/hooks/use-auth.ts` — after a successful sign-in/sign-up, `handlePostSignIn` calls `getAnonWorkData()`. If anonymous work exists, it creates a brand-new `Project` from it via `createProject` ([[03-data-model-and-persistence]]), clears the tracker, and routes to the new project. Otherwise it routes to the user's existing/newest project.

## Why it exists

This is the bridge between the anonymous playground experience and persisted, per-user projects — without it, a user who explores the tool before signing up would lose everything the moment they authenticate.

Test coverage: `src/hooks/__tests__/use-auth.test.ts` mocks `@/lib/anon-work-tracker` and the server actions to verify the migration branch in isolation.
