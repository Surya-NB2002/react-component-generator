---
name: pr-review-react-doctor
description: Use this skill when the user asks to "review this PR", "review my changes", "check this branch for best practices", "run react-doctor", or wants a best-practices review of frontend code in this repo (React/Next.js components, JS/TS, Tailwind usage) before merging. Scoped to the UIGen codebase — diffs the current branch against latest remote main and runs react-doctor over the changed files.
---

# UIGen PR Review (react-doctor)

Reviews frontend changes on the current working branch against UIGen's React/Next.js, JavaScript/TypeScript, and Tailwind conventions by running the `react-doctor` CLI over the diff against latest `origin/main`.

## When this applies

Use this skill when asked to review a PR or the current branch's changes for frontend best practices in this repo — component structure, hooks usage, Tailwind styling, TS typing — not for backend/Prisma/API-route-only changes unless they include `.tsx`/`.jsx`/`.ts` UI code.

## Steps

1. **Fetch latest remote main** so the diff is against up-to-date main, not a stale local copy:
   ```bash
   git fetch origin main
   ```

2. **Compute the diff** between `origin/main` and the current working branch:
   ```bash
   git diff origin/main...HEAD
   ```
   Also capture the list of changed files so `react-doctor` can be scoped to them:
   ```bash
   git diff --name-only origin/main...HEAD
   ```
   Only consider frontend files: `src/app/**`, `src/components/**`, `src/lib/**` `.ts`/`.tsx`/`.jsx`/`.js` files. Skip Prisma schema, migrations, and non-frontend config unless they affect UI code.

3. **Run react-doctor** against the changed files/diff:
   ```bash
   react-doctor --diff origin/main...HEAD
   ```
   If `react-doctor` supports scoping to specific files, pass the changed-file list from step 2 instead of scanning the whole repo. If the `react-doctor` command is not installed or not found, tell the user it needs to be installed (do not silently skip the review or fall back to a purely manual read-through without saying so).

4. **Apply UIGen-specific conventions** on top of react-doctor's generic findings — these are project rules from `CLAUDE.md` that a generic linter won't know:
   - Every generated project component tree must have a root `/App.jsx` default export (only relevant to `src/lib/prompts/generation.tsx` and virtual-fs-related code, not this repo's own app shell).
   - Styling must use Tailwind utility classes only — flag inline `style={{}}` props or new `.css` files.
   - Cross-file imports must use the `@/` alias (e.g. `@/components/Foo`), not relative paths like `../../components/Foo`.
   - Client/server boundaries: code in `src/app/api/**` and `src/lib/tools/**` runs server-side; flag any accidental use of browser-only APIs there, and flag any `"use client"` component that imports server-only modules.
   - `VirtualFileSystem` mutations should go through its public API (`createFile`, `updateFile`, `replaceInFile`, etc.), not by reaching into its internal `Map`.
   - New tests should live in `__tests__` directories alongside the code under test, per the existing pattern.

5. **Score the change from 0–100** (0 = worst, 100 = great), weighing:
   - Correctness / bugs introduced
   - Adherence to the conventions above
   - React/Next.js best practices (hooks rules, key props, unnecessary re-renders, server/client boundary misuse)
   - TypeScript type safety (avoid `any`, unsafe casts)
   - Tailwind usage (no inline styles, no arbitrary magic values where a design-system class exists)
   - Test coverage for the change

6. **Report the results** in this exact format:

   ```
   ## PR Review Score: <0-100>/100

   ### Flagged Issues

   1. **<file path>:<line number>** — <short issue description>
      - Suggested fix: <concrete fix or improvement>

   2. **<file path>:<line number>** — <short issue description>
      - Suggested fix: <concrete fix or improvement>

   ...
   ```

   If no issues are found, state the score and explicitly say "No issues flagged."

## Notes

- Do not modify any files as part of this review — it is read-only/reporting only. If the user wants fixes applied, ask first or hand off to `/code-review --fix`.
- If `origin/main` fetch fails (no network, no remote configured), tell the user and fall back to diffing against local `main` if it exists, noting that the comparison may be stale.
