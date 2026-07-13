---
name: audit
description: Use this skill when the user asks to "audit dependencies", "check for vulnerable packages", "run npm audit", or wants to update vulnerable dependencies in this repo. Finds vulnerable installed packages and updates them to safe, compatible pinned versions, then verifies nothing broke.
---

# Dependency Audit

Goal: find and update vulnerable dependencies in this repo, without breaking the pinned-version compatibility the project relies on.

## Important constraint for this repo

Per `CLAUDE.md`: **never run `npm audit fix`** (or `npm audit fix --force`) here. Dependencies in this repo are pinned to specific versions known to work together, and `audit fix` can bump packages past compatible versions, silently breaking the build (Next.js/Prisma/AI SDK version coupling in particular). Address vulnerabilities by manually updating the specific pinned version in `package.json` instead.

## Steps

1. Run `npm audit` to find vulnerable installed packages and see the severity/advisory for each.
2. For each vulnerable package, determine the minimum safe version from the advisory (`npm audit` output includes a "fixed in" / patched version range).
3. Manually edit `package.json` to bump only the affected package(s) to that safe version — do not run `npm audit fix`/`--force`, and do not let a manual bump cascade into unrelated major-version upgrades of Next.js, Prisma, or the AI SDK packages without flagging that to the user first.
4. Run `npm install` to apply the manual version change and update the lockfile.
5. Run `npm test` to verify the updates didn't break anything.
6. Run `npm run build` if the affected package touches build tooling (e.g. Next.js, TypeScript, Tailwind) to catch build-time breakage tests wouldn't.
7. Report: which packages were vulnerable, what they were bumped to, and the test/build result. If a vulnerability has no safe version compatible with the rest of the pinned dependency set, say so explicitly rather than forcing an upgrade — this needs a human decision.
