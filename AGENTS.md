⚠️ Mandatory: AI agents must read this file before writing or modifying any code.

# AGENTS.md

This file complements the workspace-level Ansiversa-workspace/AGENTS.md (source of truth). Read workspace first.

MANDATORY: After completing each task, update this repo’s AGENTS.md Task Log (newest-first) before marking the task done.

## Scope
- Mini-app repository for 'ad-copy-assistant' within Ansiversa.
- Follow the parent-app contract from workspace AGENTS; do not invent architecture.

## Phase Status
- Freeze phase active: no new features unless explicitly approved.
- Allowed: verification, bug fixes, cleanup, behavior locking, and documentation/process hardening.

## Architecture & Workflow Reminders
- Prefer consistency over speed; match existing naming, spacing, and patterns.
- Keep Astro/Alpine patterns aligned with ecosystem standards (one global store pattern per app, actions via astro:actions, SSR-first behavior).
- Do not refactor or change established patterns without explicit approval.
- If unclear, stop and ask Karthikeyan/Astra before proceeding.

## Where To Look First
- Start with src/, src/actions/, src/stores/, and local docs/ if present.
- Review this repo's existing AGENTS.md Task Log history before making changes.

## Task Log (Recent)
- 2026-04-08 Added V1 multi-variant support: introduced `AdCopyVariants` as the child table under `AdCopies`, moved active copy drafting to parent/variant separation, added create/update/favorite variant flows on the detail page, preserved old parent copy fields as deprecated compatibility columns, and verified lazy migration from legacy parent copy fields into default `Variant 1` rows without destructive reset.
- 2026-04-08 Completed spec-driven verification for Ad Copy Assistant V1 against `docs/app-spec.md`: verified landing/auth/workspace/detail/update/favorite/archive/search/filter behavior against the live dev server with signed session cookies, confirmed `db:push` and `build`, added repo-local `@astrojs/check` + `typescript` devDependencies so `npm run typecheck` runs non-interactively, and recorded one remaining spec mismatch around storing multiple draft variants inside a single record.
- 2026-04-08 Bootstrapped Ad Copy Assistant from the approved app-starter baseline and implemented the V1 foundation: added the `AdCopies` Astro DB schema, owner-safe create/list/detail/update/favorite/archive/restore helpers, protected workspace and detail routes, truthful landing page, and saved product spec alignment for future freeze verification.
- 2026-04-08 Added `docs/app-spec.md` from Astra’s V1 product definition for Ad Copy Assistant and documented the intended protected DB-backed manual drafting scope for future implementation alignment.
- Keep newest first; include date and short summary.
- 2026-03-24 Validation run for Ad Copy Assistant V1: npm install and npm run build passed; npm run typecheck blocked by @astrojs/check package install policy (403).
- 2026-03-24 Implemented Ad Copy Assistant V1 scope with campaign basics, tone/platform controls, 3-variant workflow, live preview, copy actions, and reset confirmation.
- 2026-03-24 Added local draft persistence via Alpine store + localStorage for /app workflow continuity.
- 2026-03-24 Ad-copy-assistant V1 implementation started and completed in active development cycle.
- 2026-02-09 Added repo-level AGENTS.md enforcement contract (workspace reference + mandatory task-log update rule).
- 2026-02-09 Initialized repo AGENTS baseline for single-repo Codex/AI safety.
