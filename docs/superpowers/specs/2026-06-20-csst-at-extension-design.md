# csst-at-extension — Design

_Date: 2026-06-20_

## What this is

A [Millennium](https://steambrew.app/) plugin that injects a **csst.at** profile button
into Steam community profile pages. The button links to
`https://csst.at/profile/{steamId64}`.

[csst.at](https://csst.at/) is a CS2 player-stats aggregator (compares Steam, Faceit,
Leetify, and csstats.gg stats on one page).

This is a near-identical clone of the existing `csstats-extension` (which targets
csstats.gg), retargeted at csst.at. The architecture is the established Millennium
CDP-injection pattern documented in the knowledge base
(`Skills/Millennium-Steam-Plugin`).

## Architecture (5 working files)

- **`frontend/index.tsx`** — entrypoint via `definePlugin` from `@steambrew/client`.
  Sets up CDP: `Target.setDiscoverTargets` → listen `Target.targetCreated` /
  `targetInfoChanged` → match profile URL → 200ms debounce per `targetId` →
  `Target.attachToTarget` (flatten) → `Runtime.evaluate` with the injection code.
  Sweeps existing targets via `Target.getTargets` on startup. Plugin icon = crosshair SVG.
- **`frontend/inject.ts`** — self-contained `csstatInjectMain()`, serialized via
  `.toString()` into `INJECTION_CODE`. Zero imports, vanilla DOM only (no React in the
  community browser). Idempotency + URL guards, SteamID resolution
  (`g_rgProfileData` → `data-miniprofile` → XML), inserts the button into
  `.profile_rightcol` (MutationObserver fallback, 15s timeout).
- **`webkit/index.tsx`** — empty stub.
- **`backend/main.lua`** — minimal Lua backend, `millennium.ready()`.
- **`plugin.json`** + **`package.json`** — metadata; `webkitApiVersion: "2.0.0"`;
  versions kept in sync by `scripts/sync-version.ts`.

## Button & branding

- Full-width dark button (`#21242f` — csst.at's dark background) in `.profile_rightcol`.
- Crosshair logo rendered as a crisp **SVG** in the brand purple (`#a99cf5`), matching the
  csst.at favicon (a purple aiming reticle on a dark rounded square).
- Label text: **CSST.AT**, purple accent on hover. Same visual family as the
  csstats/leetify buttons.

## Logo note

csst.at is behind Cloudflare; the HTML and manifest 403 to automated fetches, so the SVG
could not be pulled directly. The logo was identified from the favicon (via Google's
favicon service) as a purple crosshair and is reproduced as hand-written SVG.

## Build / release

- bun + `millennium-ttc` (`bun run dev` / `watch` / `build`).
- Type-check separately: `npx tsc -p frontend/tsconfig.json --noEmit` (build does no
  type checking).
- Releases driven by semantic-release from conventional commits — do **not** hand-edit
  the version. `feat:` → minor, `fix:` → patch, `chore:` → no release.

## What is NOT copied from csstats-extension

`.git`, `node_modules`, `dist`, `.millennium`, `bun.lock` (regenerated), old
`CHANGELOG.md` (reset), `example.png` / `example.gif`. README and CLAUDE.md rewritten for
csst.at.
