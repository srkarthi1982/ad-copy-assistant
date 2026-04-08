# App Spec: ad-copy-assistant

## 1. App Overview

### App name
Ad Copy Assistant

### App key
`ad-copy-assistant`

### Category
Writing

### Product position
A focused workspace for creating, organizing, and refining ad copy variations for campaigns, products, and channels.

### V1 truth
Ad Copy Assistant V1 is a **manual drafting and organization workspace** for ad copy.
It helps a user:
- create ad copy records
- write multiple variants
- organize by campaign/channel/status
- favorite/archive strong versions
- review and reuse old copy

It is **not**:
- an AI ad generator
- an ad publishing platform
- an ad account manager
- a performance analytics tool
- a collaboration/review workflow system

### Audience
- solo founders
- marketers
- small business owners
- creators writing ad copy manually
- internal users preparing campaign draft text before publishing elsewhere

## 2. V1 Product Goal

Give one authenticated user a clean, dependable place to store and refine ad copy drafts without losing good variations across campaigns and channels.

The app should feel:
- fast
- structured
- reusable
- safe for revision
- honest about scope

## 3. Primary User Stories

### Core user stories
1. As a user, I can create an ad copy record for a campaign or product.
2. As a user, I can store multiple draft variants inside the record.
3. As a user, I can edit the copy later without losing the original structure.
4. As a user, I can mark strong records as favorites.
5. As a user, I can archive older records without deleting them.
6. As a user, I can search and filter my records.
7. As a user, I can open a detail page when I need the full copy, not just a list summary.
8. As a user, I can return to old drafts and reuse them as a starting point.

### Ownership user stories
9. As a user, I can only see my own ad copy records.
10. As a user, invalid or non-owned detail URLs should fail safely.

## 4. Core Workflow

### V1 workflow summary
Create → Draft variants → Review → Favorite / Archive → Revisit

### Human explanation
- The user opens the protected workspace.
- The user creates an ad copy record with campaign context.
- The user fills one or more ad copy variants manually.
- The user saves and later reopens the record.
- The user favorites the strongest records.
- The user archives older records when no longer active.
- The user searches and filters the library when they want to reuse earlier work.

## 5. Functional Behavior

### 5.1 Authentication / Access

#### Access model
Protected app.

#### Expected behavior
- Unauthenticated `/app` should redirect to parent login.
- After login, user should return to `/app`.
- All data is owner-scoped.
- Non-owned detail routes should fail safely.

#### Route expectation
- `/` = public landing page
- `/app` = authenticated workspace
- `/app/copies/[id]` = authenticated detail page

### 5.2 Workspace List Page (`/app`)

#### Purpose
Show the user’s personal ad copy library.

#### Must display
- page title / app bar
- create action
- search input
- filters
- record list
- empty state if no records exist

#### Suggested list item summary fields
Each record in the list should show enough context to decide whether to open it:
- title
- campaign or product name
- channel
- status
- favorite state
- archived state if viewing archived items
- updated date

#### Search behavior
Search should match user-owned records using key text fields such as:
- title
- campaign name
- channel
- headline copy
- primary copy text
- tags if implemented

#### Filters
V1 filters should be simple and useful:
- channel
- status
- favorites
- archived / active

No advanced analytics filter is needed in V1.

### 5.3 Create Record

#### Purpose
Create a new ad copy record.

#### Required fields
- title
- channel

#### Recommended V1 fields
- title
- campaignName
- channel
- audience
- offer
- callToAction
- headline
- primaryText
- secondaryText
- notes
- status

#### Allowed `channel` values
Keep this closed and explicit in V1:
- `google-search`
- `facebook`
- `instagram`
- `linkedin`
- `x`
- `email`
- `display`
- `general`

#### Allowed `status` values
- `draft`
- `active`
- `paused`

#### Validation rules
- title is required
- channel is required
- required text fields must be trimmed
- blank title should reject
- invalid enum values should reject
- user cannot create records for another user

#### Save result
On successful save:
- record persists
- record appears in workspace
- user can open detail page
- no page crash
- no duplicate phantom save

### 5.4 Detail Page (`/app/copies/[id]`)

#### Purpose
Show the full copy record for review and editing.

#### Must display
- all stored fields for the record
- favorite control
- archive / restore control
- edit/update form
- updated timestamp if available

#### Safe behavior
- non-numeric or malformed IDs should fail safely
- missing IDs should fail safely
- non-owned IDs should fail safely
- no server 500 for invalid access cases

#### Safe fallback choice
Use one consistent behavior only:
- either safe `404`
- or redirect back to `/app`

Choose one and keep it consistent across this repo.
Recommended: safe `404` if app pattern allows it, otherwise redirect to `/app`.

### 5.5 Update Record

#### Purpose
Let the user revise existing ad copy.

#### Editable fields
All V1 fields should be editable:
- title
- campaignName
- channel
- audience
- offer
- callToAction
- headline
- primaryText
- secondaryText
- notes
- status

#### Validation
- title still required
- channel still valid
- invalid values reject safely
- no partial corruption
- owner check required

#### Save behavior
- update persists
- detail page reflects changes immediately
- workspace list reflects updated summary
- refresh keeps the saved data

### 5.6 Favorite Toggle

#### Purpose
Mark strong copy records worth revisiting.

#### Behavior
- user can favorite / unfavorite a record
- favorite state persists
- favorites filter works
- owner check required

#### V1 meaning
Favorite is only a quick retrieval aid.
It is not scoring, ranking, or analytics.

### 5.7 Archive / Restore

#### Purpose
Move older copy out of the active set without deleting it.

#### Behavior
- archive hides record from active default view
- archived records can still be found in archived view/filter
- restore returns record to active set
- owner check required

#### V1 rule
Archive is soft state only.
No hard delete in V1.

### 5.8 Delete Behavior

#### V1 decision
No hard-delete flow exposed in V1.

#### Reason
This keeps state safer, reduces destructive mistakes, and matches the archive-first pattern used across the ecosystem.

## 6. Data Model (V1)

### 6.1 Main table
Recommended main table:
`AdCopies`

#### Fields
- `id`
- `userId`
- `title`
- `campaignName`
- `channel`
- `audience`
- `offer`
- `callToAction`
- `headline`
- `primaryText`
- `secondaryText`
- `notes`
- `status`
- `isFavorite`
- `isArchived`
- `createdAt`
- `updatedAt`

#### Notes
- `userId` is canonical ownership field
- `isFavorite` default false
- `isArchived` default false
- `status` default `draft`

### 6.2 Optional future table
Do **not** add unless needed in V1:
- `AdCopyVersions`
- `AdCopyTags`
- `AdCopyPerformance`

These are out of scope for V1 unless there is a proven immediate product need.

## 7. Storage / Persistence

### V1 storage model
Authenticated DB-backed personal workspace.

### Persistence expectation
- records survive refresh
- records survive new session after sign-in
- records remain owner-scoped
- archived and favorite states persist

## 8. UX / Interaction Guidance

### Workspace tone
- calm
- structured
- copy-focused
- no marketing fluff inside the app UI

### Create/edit UX
A drawer or detail-first form is acceptable if it follows Ansiversa standards.

### List behavior
The list should help quick recognition, not overwhelm the user.

### Empty state message guidance
Should explain:
- this is a personal ad copy workspace
- start by creating one record
- no fake promise about AI generation

## 9. Edge Cases / Error Handling

### Must handle safely
1. Unauthenticated `/app`
2. Unauthenticated mutation attempt
3. Invalid record ID
4. Missing record ID
5. Non-owned record access
6. Blank title save attempt
7. Invalid channel/status enum value
8. Archive on already archived record
9. Restore on already active record
10. Favorite toggle on missing record

### Error behavior rules
- no 500 for normal user mistakes
- validation should surface clearly
- owner failures should not leak data
- invalid IDs should fail safely
- no silent corruption

## 10. API / Actions Expectations

V1 can use either:
- Astro actions
- protected API routes
- or a repo-consistent hybrid

### Rule
Use the repo’s standard pattern consistently.

### Owner protection
Every mutation and protected read must enforce:
- valid session
- owner-scoped access

### Public route rule
Landing page is public.
Workspace/data routes are protected.

## 11. Search / Filter Rules

### Search fields
Recommended:
- title
- campaignName
- headline
- primaryText
- notes

### Filter fields
Recommended:
- channel
- status
- favorite
- archived

### V1 rule
Keep filters simple.
No advanced segmentation or analytics in V1.

## 12. Tester Verification Guide

### 12.1 Landing page
Verify:
- `/` loads
- copy is truthful
- CTA points correctly to protected flow
- no fake AI/ad-platform claims

### 12.2 Auth behavior
Verify:
- unauthenticated `/app` redirects correctly
- after login, return path works
- protected data is not visible without auth

### 12.3 Workspace behavior
Verify:
- create record works
- list updates correctly
- search works
- filters work
- favorite works
- archive works
- restore works

### 12.4 Detail behavior
Verify:
- detail page loads for owned record
- update persists
- invalid ID fails safely
- non-owned ID fails safely

### 12.5 Persistence
Verify:
- refresh keeps data
- favorite/archive state survives refresh
- updated fields remain saved

### 12.6 Validation
Verify:
- blank title rejected
- invalid enum rejected
- no server crash on bad payload

## 13. Out of Scope (V1)

The following are explicitly out of scope unless later frozen into V2+:

- AI-generated ad copy
- automatic variant generation
- ad performance tracking
- publish-to-platform integrations
- campaign analytics
- collaboration / comments / approvals
- team roles
- tagging system beyond simple fields
- version-history engine
- hard delete
- export integrations beyond normal copy/reuse

## 14. Freeze Notes

### V1 freeze statement
Ad Copy Assistant V1 is a protected, DB-backed personal ad copy workspace for storing and revisiting structured copy drafts.
It is intentionally narrow:
- manual drafting
- structured records
- search/filter
- favorite/archive
- detail review

### Product truth guardrail
The landing, UI, and docs must never imply:
- AI writing
- ad account publishing
- campaign optimization
- team collaboration

unless those features are actually implemented later.

## 15. Codex Implementation Notes

### Codex must not miss these
- canonical ownership field = `userId`
- protected routes required
- title required
- channel enum enforced
- favorite/archive/restore included
- no hard delete
- safe invalid-detail handling
- landing copy must stay truthful
- V1 is manual drafting + organization only

### Recommended commit scope
- schema
- protected read/write helpers
- workspace page
- detail page
- create/update/favorite/archive/restore actions
- landing page aligned with product truth
- `docs/app-spec.md`
- `AGENTS.md`

## 16. Final One-Line Product Definition

**Ad Copy Assistant V1 is a protected personal workspace for drafting, organizing, and reusing structured ad copy records — not an AI generator or ad publishing platform.**
