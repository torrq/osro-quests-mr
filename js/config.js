// ============================================================================
// OSRO Quest Helper - Configuration
// ============================================================================

const VERSION = 115;
const FLAVOR = 'Midrate';

// === DATA SOURCE CONFIGURATION ===

// Toggle between local development server and production GitHub URLs
const USE_LOCAL_SERVER = false; 

// Auto-import data on page load (disable if you want to manually import)
const AUTO_IMPORT_ON_FIRST_LOAD = true;

const REMOTE_PREFIX = "https://torrq.github.io/osro-quests-mr/data/";
const LOCAL_PREFIX  = "http://10.0.0.20:8298/data/";

const FILES = {
  items:           "osromr_items.json",
  newItems:        "osromr_items_new.json",
  values:          "osromr_item_values.json",
  quests:          "osromr_quests.json",
  shops:           "osromr_shops.json",
  icons:           "osromr_item_icons.json",
  searchIndexName: "osromr_search_index_name.json",
  searchIndexDesc: "osromr_search_index_desc.json",
  spriteMap:       "osromr_sprite_map.json",
};

const LOCAL_STORAGE = {
  "config": "osromr_config_v1",
  "theme": "osro-theme",
  "autoloot_data": "osro_autoloot_v1",
  "autoloot_names": "osro_autoloot_names_v1",
  "item_values":   "osro_item_values_v1"
};

const prefix = USE_LOCAL_SERVER ? LOCAL_PREFIX : REMOTE_PREFIX;
const AUTO_IMPORT_URLS = Object.fromEntries(
  Object.entries(FILES).map(([k, f]) => [k, prefix + f])
);

// === SPECIAL ITEM IDS ===

// These items are used as currency in the game
const SPECIAL_ITEMS = {
  CREDIT: 40001,  // Credits
  GOLD: 969,      // Gold
};

// === HELPER FUNCTIONS ===

/**
 * Get the current zeny value of Credits from the items database
 * @returns {number} Zeny value per Credit
 */
function getCreditValue() {
  return DATA.items[SPECIAL_ITEMS.CREDIT]?.value || 0;
}

/**
 * Get the current zeny value of Gold from the items database
 * @returns {number} Zeny value per Gold
 */
function getGoldValue() {
  return DATA.items[SPECIAL_ITEMS.GOLD]?.value || 0;
}

// === DEVELOPMENT MODE ===

// Log configuration on load (useful for debugging)
if (typeof console !== 'undefined') {
  console.log('[Config] Data source:', USE_LOCAL_SERVER ? 'LOCAL' : 'REMOTE');
  console.log('[Config] Auto-import:', AUTO_IMPORT_ON_FIRST_LOAD ? 'ENABLED' : 'DISABLED');
}