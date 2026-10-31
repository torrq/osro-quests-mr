<p align="center"><img width="400" height="160" alt="osro_quests_logo_400" src="https://github.com/user-attachments/assets/c4f844d5-b2f8-439a-84cf-293d97cba0c6" /></p>

# OSRO Quests (MR)

A web-based quest, shop, material, autoloot, timer, and collection tracker tool for [OSRO Midrate](https://osro.mr). Organize crafting chains, browse shops, build `@alootid2` / `@alootload` configurations, track equipment deposits & card unlocks, and receive multi-device push notifications for cooldown timers.

<h1 align="center">
   Try it now! 🔗 <a href="https://torrq.github.io/osro-quests-mr">OSRO Quests: Midrate</a>
</h1>
<p>&nbsp;</p>
<p align="center">
  <img width="1311" height="578" alt="OSRO Quests Midrate" src="https://github.com/user-attachments/assets/07a6e8ab-7610-470e-8bb0-62fb0e7f5ad6" />
</p>

## ✨ Features

- **Quest & Material Breakdown Tree**: Visualize full crafting chains, nested sub-quest requirements, success rate multipliers, and total currency/material costs.
- **Shop Viewer**: Browse custom NPC shops (Quest, Headgear Points, KOE, WOE, etc.) with point and item cost breakdowns.
- **Item Catalog & Value Manager**: Search all server items off-main-thread via a Web Worker (`MiniSearch`), inspect item descriptions and usages, and customize item Zeny/Credit values.
- **Autoloot Builder (v2)**: Organize item sets across slots `1`–`10`, generate `@alootid2` and `@alootload` commands, and manage sets with drag-and-drop and import/export.
- **Bookmarks**: Pin frequently used quests, shops, and items into a dedicated view with grid/list modes and expandable item descriptions.
- **Deposit & Unlock Tracker**: Track Equipment & Costume Deposits and Card Unlocks with live aggregated stat bonuses, advanced search (phrases & `-exclude` terms), normalized **Source** and **Location** filters, URL-persisted filter states, and CSV import/export.
- **Lab Cooldown Timers**: Persistent timers for **Guild Contribution** (6h), **Gem Quest** (24h, multi-account), and **Credit Agent** (24h, multi-account) backed by Web Push notifications.
- **Cloud Sync & Multi-Device Push**: Link devices via a 16-character Sync Code (or QR code / Google Sign-In) to synchronize settings, autoloot sets, item values, bookmarks, timers, and tracker progress across devices—and fan out timer push notifications to all linked devices.
- **Custom Themes**: Switch between Dark and Light modes or customize your own palette (Accent, Background, Panel, Text) with auto-tint and built-in presets.
- **Mobile-Friendly**: Responsive layout with collapsible sidebar, touch-friendly controls, and native mobile filter pickers.

## 🧪 Lab (Timers & Collection Tracker)

The **Lab** tab hosts persistent background timers and the **Deposit & Unlock Tracker**:

| Module | Tab ID | Description |
|--------|--------|-------------|
| **Deposit & Unlock Tracker** | `lab-tracker` / `lab-tracker-deposits` / `lab-tracker-unlocks` | Summary dashboard of active stat bonuses + filterable Deposit & Card Unlock checklists |
| **Guild Contribution** | `lab-gc` | 6-hour rotation timer & required item reference |
| **Gem Quest** | `lab-gem` | 24-hour per-account cooldown timer |
| **Credit Agent** | `lab-credit` | 24-hour per-account cooldown timer |

### Deposit & Unlock Tracker
- **Summary Dashboard (`lab-tracker`)**: Parses checked item effects (`js/lab-effect-parser.js`) into aggregated character stats and special effects, with expandable per-stat item breakdowns.
- **Deposit List (`lab-tracker-deposits`)**: Filter by status (`All` / `Need` / `Want` / `Done`), class (`All` / `Cards` / `Equip/Costume`), normalized **Source** (e.g. `Halloween Event`, `Donate`, `Quest`, `Christmas Event`), and normalized **Location** (`Upper`, `Mid`, `Lower`, `Garment`, `Costume Weapon`).
- **Unlock List (`lab-tracker-unlocks`)**: Track card unlock progress and wanted cards.
- **Search & Shareable URLs**: Supports multi-word queries, `"exact phrases"`, `-excluded` terms, optional description search (`Desc`), and persists active filters in URL query parameters (`ts`, `td`, `tf`, `tc`, `tsrc`, `tloc`).

### Push Notification & Cloud Sync Architecture

```
Browser → Cloudflare Worker (osro-push-worker + D1) → Upstash QStash → Web Push → sw.js
```

- **`sw.js`** (repo root): Service worker handling `push` events and `notificationclick` routing to `?tab=lab-*`.
- **`js/store.js` & `js/sync.js`**: Centralized `osroStore` wrapper tracking per-key dirty flags and timestamps, plus debounced cloud sync and granular item-level merge resolution for timers and tracker state.
- **`js/main.js`**: Exposes `osroScheduleCloudPush(timerId, delaySeconds, payload)`, `osroCancelCloudPush(messageId)`, `osroEnsureNotifyPermission()`, and `osroNotifyTitle(section)`.
- **Cloudflare Worker (`osro-push-worker`)**: Separate repo providing `/schedule`, `/cancel`, `/webhook`, `/auth/*`, `/sync`, and `/devices` routes backed by Cloudflare D1 and Upstash QStash.

## 🛠️ Development

### Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/torrq/osro-quests-mr.git
   cd osro-quests-mr
   ```

2. Serve the directory with any static HTTP server (no build step or npm install required):
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```

3. Open `http://localhost:8000` in your browser.

### Adding a New Lab Module

1. Create `js/lab-mymodule.js` and register it:
   ```js
   window.registerLabExperiment?.('lab-mymodule', {
     tabId:        'lab-mymodule',
     title:        'My Module',
     sidebarLabel: 'My Module',
     sidebarIcon:  '🔧',
     renderMain:   myModuleRenderMain,
   });
   ```
2. Include `<script src="js/lab-mymodule.js"></script>` in `index.html` after `js/lab.js`.
3. Persist state via `loadLabData()` / `saveLabData(patch)` (or a dedicated `LOCAL_STORAGE` key routed through `window.osroStore`).

## 🔧 Technologies

- **HTML5 & CSS3**: Responsive Grid/Flexbox layout with CSS custom properties and dynamic theme variables
- **Vanilla JavaScript**: Zero build step, no framework dependencies
- **Web Workers & MiniSearch**: Off-main-thread full-text indexing and search (`js/search-worker.js`)
- **Cloudflare Workers + D1**: Serverless cloud sync & multi-device push fan-out (`osro-push-worker`)
- **Upstash QStash & Web Push API**: Delayed message scheduling and Service Worker notifications

## 📝 License

Provided as-is for the OSRO community. See `LICENSE` for details.
