---
name: codebase-onboarding
description: Use this skill when a new team member is setting up the UIGen repo for the first time and asks for a walkthrough, wants to understand "how this codebase works", asks "where do I start", or requests onboarding/orientation to the project. Gives a chronological, referenced tour of the app from project setup through auth, data model, chat flow, the virtual file system, AI tools, live preview, and testing.
model: sonnet
allowed-tools: Read, Glob, Grep, WebFetch
---

# UIGen Codebase Onboarding

A guided, chronological walkthrough of the UIGen codebase for engineers setting up the repo for the first time. UIGen is an AI chat app that generates React components into a virtual, in-memory file system — nothing is written to disk during generation.

This skill is **read-only**: it explains the codebase, it does not modify it. Do not create, edit, or write any files while running this skill — only `Read`, `Glob`, `Grep`, and `WebFetch` are permitted. If the user asks you to change code as part of onboarding (e.g. "fix this while you're explaining it"), say that's outside this skill and needs a normal editing turn.

Run at **medium effort/depth by default** — enough to explain each area correctly and show the connecting file paths, without exhaustively re-deriving every implementation detail. Go deeper only when the user asks for it (see "Adjusting depth" below).

## Reference material

Detailed, pre-indexed notes for each area live in this skill's own `references/` folder, numbered in the recommended learning order. Read the relevant file(s) before explaining that area to the user, and cite concrete file paths from them (not vague summaries) — these references already link related areas together with `[[name]]`-style cross-references:

1. `references/01-setup-and-config.md` — package.json scripts, Next/TS/Vitest config, Prisma schema, env handling
2. `references/02-auth-and-sessions.md` — JWT session auth, middleware, server actions, `useAuth`
3. `references/03-data-model-and-persistence.md` — Prisma models, project CRUD server actions
4. `references/04-app-shell-and-routing.md` — `src/app` routes, layout, `main-content.tsx` provider composition
5. `references/05-anonymous-work-tracking.md` — sessionStorage work tracker, post-sign-in migration
6. `references/06-chat-context-and-ui.md` — `ChatProvider`, chat UI components
7. `references/07-virtual-file-system.md` — `VirtualFileSystem` class and its React context wrapper (the core abstraction)
8. `references/08-api-route-and-ai-tools.md` — `/api/chat` route, mock vs. real model provider, the two AI tools
9. `references/09-live-preview-jsx-transform.md` — Babel-in-browser transform, import map, iframe preview
10. `references/10-file-tree-and-editor-ui.md` — file tree and Monaco editor components
11. `references/11-testing-conventions.md` — Vitest setup and co-located `__tests__` convention

This order is intentional: each area builds on the previous one (e.g. you can't understand the chat tool loop in area 8 without first understanding the virtual file system in area 7). Preserve this order when giving a full walkthrough; only skip ahead if the user specifically asks about one area.

## How to run the walkthrough

1. **Ask (briefly) what the user wants**, if it isn't already clear from their request:
   - A full end-to-end walkthrough (all 11 areas), or
   - A specific area or flow (e.g. "how does the live preview work", "explain auth")
   - High-level overview vs. deep-dive detail (see below)
   Don't over-ask — if the request is already specific ("explain the chat flow"), just answer it.

2. **Walk through areas in order** (1 → 11) for a full onboarding request. For each area:
   - State what it's responsible for and why it comes at this point in the flow.
   - Name the concrete files involved (from the reference doc), with a one-line role for each.
   - Describe how it connects to the *next* area, so the user builds one continuous mental model rather than 11 disconnected facts.
   - Use `Read`/`Grep`/`Glob` to open the actual source files when the user wants specifics beyond what the reference doc already states, or when confirming a reference doc's claim still matches current code (references can drift out of date — trust the live source over the reference doc if they conflict, and mention the discrepancy).

3. **Adjusting depth:**
   - If the user wants a **simpler/high-level explanation**: summarize each area in 2-4 sentences, name only the one or two most important files per area, and skip internal implementation details (e.g. for area 7, say "a big in-memory class that models files as a Map, with a client copy and a server copy kept in sync via AI tool calls" rather than enumerating every method).
   - If the user asks to **go deeper** on an area: open the actual files with `Read`, quote the relevant function/class signatures, and explain the mechanics (e.g. how `serialize()`/`deserializeFromNodes()` round-trip, or exactly how `createImportMap` resolves an import specifier).
   - If the user asks about **one flow end-to-end** (e.g. "what happens when I type a message and hit send") rather than one area, trace it across areas 6 → 8 → 7 → 9 in sequence, pulling from all four reference docs.

4. **Point to hands-on next steps** at the end of a full walkthrough: running `npm run setup` then `npm run dev` (area 1), trying a chat prompt with no `ANTHROPIC_API_KEY` set to see the mock provider in action (area 8), and running `npm test` (area 11).

## Keeping references current

If, while reading live source to answer a question, you notice a reference doc is meaningfully stale (a file was renamed/removed/restructured), tell the user directly rather than silently trusting the stale doc. Updating the reference files themselves is out of scope for this skill (it's read-only) — suggest a follow-up task instead.
