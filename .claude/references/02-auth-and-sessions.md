# 2. Auth & Sessions

A custom JWT-in-httpOnly-cookie session system — not NextAuth.

## Key files

- `src/lib/auth.ts` — JWT logic using `jose`.
  - `createSession(userId, email)` — signs a 7-day HS256 JWT (secret from `JWT_SECRET` env, dev fallback exists) and sets it as an httpOnly `auth-token` cookie.
  - `getSession()` — reads/verifies the cookie from Server Components/Actions.
  - `verifySession(request)` — same, but from a `NextRequest` (used in middleware).
  - `deleteSession()` — clears the cookie.
- `src/middleware.ts` — calls `verifySession` and returns `401` for unauthenticated requests to `/api/projects` and `/api/filesystem` path prefixes. Note: `/api/chat` is deliberately **not** in this protected list — anonymous users can generate components without signing in (see [[05-anonymous-work-tracking]]).
- `src/actions/index.ts` — server actions (`"use server"`):
  - `signUp` — validates email/password (min length 8), checks uniqueness, `bcrypt.hash`, creates `User`, calls `createSession`.
  - `signIn` — `bcrypt.compare` against stored hash, calls `createSession`.
  - `signOut` — `deleteSession` + redirect to `/`.
  - `getUser` — reads session, fetches safe (non-password) user fields via Prisma.
  - All mutating actions `revalidate '/'` on success.
- `src/hooks/use-auth.ts` — client hook wrapping sign-in/up actions with `isLoading` state, plus `handlePostSignIn`, which migrates any anonymous work into a real project after a successful auth (see [[05-anonymous-work-tracking]]) and then routes to the user's project.
- `src/components/auth/SignInForm.tsx`, `SignUpForm.tsx`, `AuthDialog.tsx` — UI built on top of `useAuth`.
- Test: `src/hooks/__tests__/use-auth.test.ts` — covers the anon-work migration branch by mocking `@/lib/anon-work-tracker` and the server actions.

## Flow summary

Client form → `useAuth` hook → server action (`signIn`/`signUp`) → `bcrypt` check/hash → `createSession` sets cookie → middleware/`getSession` gate subsequent requests → `handlePostSignIn` migrates anonymous work if present.
