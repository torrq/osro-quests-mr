# AGENTS.md — Context for LLM-assisted development

This document is for AI coding assistants working on this repo. Read it before touching anything.

---

## What this is

A static single-page app (GitHub Pages, no build step) for OSRO Midrate — a Ragnarok Online private server. It helps players manage quests, shops, materials, autoloot, item deposits/unlocks, and account cooldown timers. User state lives in `localStorage` (with optional Cloud Sync via Cloudflare Worker + D1); quest/shop/item data auto-imports from JSON files in `data/`.

**Live URL:** `https://torrq.github.io/osro-quests-mr/`  
**No framework. No bundler. No npm.** Vanilla JS, HTML, CSS only.

---

## File map

```
index.html                  — single HTML shell; loads all scripts and CSS
css/
  style.css                 — base styles, layout, component styles & CSS variables
  style_dark.css            — dark theme variable overrides
  style_light.css           — light theme variable overrides
js/
  config.js                 — VERSION, FLAVOR, FILES, LOCAL_STORAGE, SYNC_KEYS, constants (load first)
  store.js                  — centralized storage wrapper with dirty/timestamp tracking (window.osroStore)
  sync.js                   — cloud sync engine, conflict resolution, QR/Sync Code & Google linking
  svg.js                    — inline SVG icon registry (window.SVG_ICONS & window.applySvgIcons)
  main.js                   — app state, routing, URL sync, custom theme engine, push notification helpers
  search-worker.js          — Web Worker using MiniSearch for off-main-thread item/quest/shop search
  items.js                  — item catalog, detail view, and Values Manager pane
  quests.js                 — quest viewer/editor and recursive material breakdown tree
  shops.js                  — shop viewer/editor
  groups.js                 — group/subgroup ordering and management
  autoloot.js               — Autoloot v2 builder (sets, folders, slots 1–10, @alootid2 / @alootload)
  bookmarks.js              — pinned quests, shops, and items view
  lab.js                    — lab experiment registry (loadLabData, saveLabData, registerLabExperiment)
  lab-gc.js                 — Guild Contribution timer (6h, single timer)
  lab-credit.js             — Credit Agent timer (24h, per-account)
  lab-gem.js                — Gem Quest timer (24h, per-account)
  lab-effect-parser.js      — parses item deposit/unlock effect strings into structured stat bonuses
  lab-tracker.js            — Deposit & Unlock Tracker (Summary dashboard, Deposit List, Unlock List)
  lib/
    minisearch.min.js       — MiniSearch library (loaded inside search-worker.js)
    qrcode.min.js           — QR code generator for Sync Code modal
data/
  osromr_items.json        — item dictionary (name, desc, slot)
  osromr_items_new.json    — newly added items merged on load
  osromr_item_values.json  — default item Zeny values
  osromr_item_icons.json   — item icon metadata
  osromr_sprite_map.json   — sprite sheet coordinate map for item icons
  osromr_point_links.json  — maps point currency names to shop/quest references
  osromr_quests.json       — quest definitions and material trees
  osromr_shops.json        — NPC shop definitions
  osromr_item_lists.json   — Deposit List, Unlock List, Gem Quest, Break the Seal, etc.
sw.js                       — service worker: handles push events and notificationclick
image/
  favicon.png               — 16×16, used as notification icon and badge
  osro_quests_logo_mr_v3.png — header and notification preview image
```

**`osro-push-worker`** is a separate Cloudflare Worker repo (not here). It handles `/schedule`, `/cancel`, `/webhook`, `/auth/*`, `/sync`, and `/devices` routes with Cloudflare D1 persistence.

---

## localStorage keys & Cloud Sync

Defined in `config.js` as `LOCAL_STORAGE`:

| Key constant | Storage key | Contents | Synced to Cloud? |
|---|---|---|---|
| `config` | `osromr_config_v1` | user settings & custom theme palettes | Yes |
| `theme` | `osro-theme` | `'dark'` or `'light'` | **No** (per-device) |
| `autoloot_v2` | `osromr_autoloot_v2` | Autoloot v2 sets, folders & slot assignments | Yes |
| `autoloot_data` | `osro_autoloot_v1` | legacy autoloot item sets (migrated to v2) | No |
| `autoloot_names` | `osro_autoloot_names_v1` | legacy set name map | No |
| `item_values` | `osro_item_values_v1` | item zeny value overrides | Yes |
| `bookmarks` | `osromr_bookmarks` | pinned quest/shop/item IDs | Yes |
| `lab_data` | `osromr_lab_data` | shared lab timer state (`lab-gc`, etc.) | Yes |
| `lab_gem` | `osromr_lab_gem_v1` | Gem Quest timers & deleted tombstones | Yes (item-merged) |
| `lab_credit` | `osromr_lab_credit_v1` | Credit Agent timers & deleted tombstones | Yes (item-merged) |
| `lab_tracker` | `osromr_lab_tracker_v1` | Deposits & unlocks with `updatedAt` timestamps | Yes (item-merged) |
| `sync_meta` | `osromr_sync_meta` | internal dirty flags & `updatedAt` timestamps | **No** (device-local) |

`SYNC_KEYS` (in `config.js`) defines the allowlist of keys synchronized with Cloudflare D1.

### Storage wrapper (`js/store.js`)

All storage mutations for synced keys must route through `window.osroStore`:
```js
osroStore.getItem(key)
osroStore.setItem(key, value, options)    // updates localStorage and marks dirty
osroStore.removeItem(key, options)        // marks deleted: true and dirty
osroStore.getJson(key, fallback)
osroStore.markDirty(key, updatedAt)       // flags for upload without modifying value
osroStore.clearDirty(keys)                // clears dirty flags after successful push
osroStore.applyRemoteUpdate(key, val, ts) // writes remote data and marks clean
osroStore.onRemoteChange(callback)        // notifies UI when a cloud pull applies updates
```

---

## Cloud Sync & Multi-Device Push

1. **Authentication:**
   - **Sync Code:** 16-character alphanumeric code (`XXXX-XXXX-XXXX-XXXX`), shareable via text or QR code (`qrcode.min.js`). Visually ambiguous characters (`O`, `I`, `L`) normalize to `0` and `1`.
   - **Google Sign-In:** Optional GIS sign-in, linkable to an existing Sync Code profile.
2. **Synchronization:**
   - **Pull:** Runs on page load, when switching online, or when clicking "Sync Now".
   - **Push:** Debounced 3 seconds after local changes, with `keepalive` flush on `visibilitychange -> hidden`.
   - **Granular Merges:** Timers (`lab_gem`, `lab_credit`) and tracker entries (`lab_tracker`) merge per-item by `updatedAt` timestamp and tombstone IDs.
3. **Multi-Device Push:**
   - When linked, `/schedule` passes the session token and `deviceId`.
   - When a timer fires, `/webhook` fans out Web Push notifications to **all** registered devices for that account and prunes expired subscriptions (404/410).

---

## Deposit & Unlock Tracker (`js/lab-tracker.js` & `js/lab-effect-parser.js`)

Registered under `lab-tracker` with three views:
- `lab-tracker` (**Summary**): Aggregates stats from checked items in `Deposit List` and `Unlock List` using `parseEffect()` from `js/lab-effect-parser.js`. Clicking a stat card expands the contributing items.
- `lab-tracker-deposits` (**Deposit List**): Tracks equipment, costume, and card deposits.
- `lab-tracker-unlocks` (**Unlock List**): Tracks card unlocks.

### Filtering & Normalization (`Deposit List`)
- **Status filter (`tf`):** `all` | `need` | `want` | `done`
- **Category filter (`tc`):** `all` | `card` | `equip/costume`
- **Source filter (`tsrc`) & Location filter (`tloc`):** Extracted from item descriptions (`DATA.items[id].desc`) after stripping RO color codes (`/\^[0-9A-Fa-f]{6}/g`) and merged into normalized groups:
- **MR Normalized `Source` Groups:** `Donate` (`Donation Exclusive`, `Donation Shop`, `Donate`), `Halloween Event`, `Quest` (`Quest`, `Quest Shop`), `Lotti Girl`, `Christmas Event` (`2024 Christmas`, `2025 Christmas`), `Valentine Event`, `Quest/Donate` (`Quest/Donate`, `Quest, Donate`), `Monster Arena`, `Gacha Machine`, `Socket Enchantment`, `Bonus Point Shop`.
- **MR Normalized `Location` Groups (Non-Cards only):** `Upper` (`Location: Upper`, `Position: Upper`, `Location: Top`), `Mid` (`Location: Mid`, `Location: Middle`, `Position: Middle`), `Lower` (`Location: Lower`, `Location: Low`, `Position: Lower`), `Garment` (`Equipped on: Garment`), `Costume Weapon` (`Location: Shadow Weapon`).
- **URL State:** Search query (`ts`), description search toggle (`td=1`), and filters (`tf`, `tc`, `tsrc`, `tloc`) sync with URL query parameters via `syncTrackerStateFromURL()` and `applyTrackerURLParams()`.
- **Footer Actions:** Rare bulk/CSV actions (`Import CSV`, `Export CSV`, `Select All`, `Clear All`) live in `.dt-footer-actions` below the table so the header title is never squished on mobile.

---

## Lab timer system (`lab-gc.js`, `lab-gem.js`, `lab-credit.js`)

### Timer state shape (per-account modules: gem, credit)
```js
{
  id: string,                          // unique ID
  name: string,                        // display name e.g. "Account 1"
  startedAt: number|null,              // Date.now() when started
  finishedAt: number|null,             // set when timer completes
  notifyOnDone: boolean,
  notifiedForFinishedAt: number|null,  // prevents double-notify
  cloudMessageId: string|null,         // QStash message ID for cancellation
  updatedAt: number,                   // timestamp for granular cloud merge
}
```

### Timer durations
- `GC_REFRESH_MS` = 6h (`lab-gc.js`)
- `GEM_TIMER_MS` = 24h (`lab-gem.js`)
- `CA_TIMER_MS` = 24h (`lab-credit.js`)

### Push notification helpers (on `window`, defined in `main.js`)

```js
osroNotifyTitle(section: string) => `OSRO Quests (MR) - ${section}`
osroEnsureNotifyPermission() => Promise<boolean>
osroScheduleCloudPush(timerId, delayInSeconds, payload) => Promise<string|null> // returns messageId
osroCancelCloudPush(messageId) => void
osroFireNotification({ section, body, tag, url }) => void
osroNotifyReady({ section, body, tag, url }) => void
```

### Rules when touching lab timers

- **Always cancel** `cloudMessageId` before starting, stopping, resetting, or slider-adjusting a timer. Null it out afterward.
- **Start functions must be `async`** when calling `osroScheduleCloudPush`.
- **Slider commits**: cancel unconditionally at top, reschedule (fire-and-forget `.then()`) only if `remaining > 0`. Re-read from storage inside the `.then()` to avoid clobbering concurrent saves.
- **Notify toggle**: if enabling with a currently-running timer, compute `remaining = DURATION - (Date.now() - startedAt)` and schedule for that remaining time. If disabling, cancel.
- `osroScheduleCloudPush` always fetches the live push subscription from `navigator.serviceWorker.ready` + `pushManager.getSubscription()` — do not cache the subscription object in `localStorage`.

---

## Things to be careful about

- **No build step** — changes to JS/CSS are live immediately after push. Don't introduce ES module `import`/`export` syntax in main-thread scripts.
- **`Upstash-Delay` is in seconds** — passing milliseconds silently schedules 1000+ days in the future.
- **Stale subscriptions** — always use `pushManager.getSubscription()` live, never cache in `localStorage`.
- **`registerLabExperiment` title** — plain string for the UI label. Only push payload `title` fields should use `osroNotifyTitle()`.
- **CRLF line endings** — existing files use CRLF (`\r\n`). Preserve CRLF when editing on Windows.
