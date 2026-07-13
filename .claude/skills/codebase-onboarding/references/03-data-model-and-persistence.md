# 3. Data Model & Persistence

## Schema

`prisma/schema.prisma`:
- `User` — `id`, `email`, `password` (bcrypt hash), timestamps, has many `Project`.
- `Project` — `id`, `name`, `userId?`, `messages` (JSON string — chat history), `data` (JSON string — serialized virtual file system from [[07-virtual-file-system]]), timestamps.

There are no separate file-storage tables — the entire virtual file system for a project is a single JSON blob in `Project.data`.

## Generated client

`src/generated/prisma/` is the Prisma client output (non-default path, configured in `schema.prisma`). Always import from `@/generated/prisma`, not `@prisma/client`. `src/lib/prisma.ts` wraps it in a singleton.

## Server actions (CRUD)

- `src/actions/create-project.ts` — `createProject({name, messages, data})`: requires an authenticated session, `JSON.stringify`s `messages`/`data` before writing.
- `src/actions/get-project.ts` — `getProject(projectId)`: requires session, scopes the query to `userId`, throws if not found/unauthorized, `JSON.parse`s `messages`/`data` back into objects.
- `src/actions/get-projects.ts` — `getProjects()`: lists the current user's projects (id/name/timestamps only, no payload) ordered by `updatedAt desc` — used for project-switcher UI.

## Where persistence actually happens mid-session

Beyond explicit `createProject` calls, `src/app/api/chat/route.ts`'s `onFinish` callback re-`serialize()`s the live `VirtualFileSystem` and writes `messages`/`data` back to the `Project` row after every AI turn — but only if `projectId` is present and the user is authenticated. Anonymous sessions never hit the database; see [[05-anonymous-work-tracking]] for how that work is preserved anyway.
