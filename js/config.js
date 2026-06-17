// ============================================================================
// OSRO Quest Helper - Configuration
// ============================================================================

const VERSION = 115;
const FLAVOR = 'Midrate';

// === DATA SOURCE CONFIGURATION ===

// Auto-import data on page load (disable if you want to manually import)
const AUTO_IMPORT_ON_FIRST_LOAD = true;

const REMOTE_PREFIX = "https://torrq.github.io/osro-quests-mr/data/";
const LOCAL_PREFIX  = `${window.location.origin}/data/`;

function isLocalLikeHost(hostname) {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '::1'
    || hostname.startsWith('10.')
    || /^192\.168\./.test(hostname)
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
}

const FILES = {
  items:           "osromr_items.json",
  newItems:        "osromr_items_new.json",
  values:          "osromr_item_values.json",
  pointLinks:      "osromr_point_links.json",
  quests:          "osromr_quests.json",
  shops:           "osromr_shops.json",
  icons:           "osromr_item_icons.json",
  searchIndexName: "osromr_search_index_name.json",
  searchIndexDesc: "osromr_search_index_desc.json",
  spriteMap:       "osromr_sprite_map.json",
  itemLists:       "osromr_item_lists.json",
};

const LOCAL_STORAGE = {
  "config": "osromr_config_v1",
  "theme": "osro-theme",
  "autoloot_data": "osro_autoloot_v1",
  "autoloot_names": "osro_autoloot_names_v1",
  "item_values":   "osro_item_values_v1",
  "lab_data":      "osromr_lab_data"
};

const USE_LOCAL_SERVER = isLocalLikeHost(window.location.hostname);
const prefix = USE_LOCAL_SERVER ? LOCAL_PREFIX : REMOTE_PREFIX;
const AUTO_IMPORT_URLS = Object.fromEntries(
  Object.entries(FILES).map(([k, f]) => [k, prefix + f])
);

// === VALUE DISPLAY CONSTANTS ===

// Zeny value of 1 Credit (used as fallback if not in item database)
const CREDIT_ZENY_VALUE = 10_000_000;

// In 'mixed' mode, show credits above this threshold (zeny)
const MIXED_CREDIT_THRESHOLD = 10_000_000;

// === SPECIAL ITEM IDS ===

// These items are used as currency in the game
const SPECIAL_ITEMS = {
  CREDIT: 40001,  // Credits
  GOLD: 969,      // Gold
};

const GUILD_CONTRIBUTION_ITEMS = [
  { id: 4147, amount: 1, name: 'Baphomet Card', group: 'Card (1x)' },
  { id: 4168, amount: 1, name: 'Dark Lord Card', group: 'Card (1x)' },
  { id: 4142, amount: 1, name: 'Doppelganger Card', group: 'Card (1x)' },
  { id: 4137, amount: 1, name: 'Drake Card', group: 'Card (1x)' },
  { id: 4123, amount: 1, name: 'Eddga Card', group: 'Card (1x)' },
  { id: 27025, amount: 1, name: 'Lord of The Dead Card', group: 'Card (1x)' },
  { id: 4146, amount: 1, name: 'Maya Card', group: 'Card (1x)' },
  { id: 4132, amount: 1, name: 'Mistress Card', group: 'Card (1x)' },
  { id: 4131, amount: 1, name: 'Moonlight Flower Card', group: 'Card (1x)' },
  { id: 4143, amount: 1, name: 'Orc Hero Card', group: 'Card (1x)' },
  { id: 4135, amount: 1, name: 'Orc Lord Card', group: 'Card (1x)' },
  { id: 4144, amount: 1, name: 'Osiris Card', group: 'Card (1x)' },
  { id: 4148, amount: 1, name: 'Pharaoh Card', group: 'Card (1x)' },
  { id: 4121, amount: 1, name: 'Phreeoni Card', group: 'Card (1x)' },
  { id: 4263, amount: 1, name: 'Incantation Samurai Card', group: 'Card (1x)' },
  { id: 4305, amount: 1, name: 'Turtle General Card', group: 'Card (1x)' },
  { id: 7035, amount: 10, name: 'Matchstick', group: 'Loot' },
  { id: 7289, amount: 10, name: 'Peridot', group: 'Loot' },
  { id: 7048, amount: 10, name: 'Talon of Griffon', group: 'Loot' },
  { id: 4004, amount: 25, name: 'Drops Card', group: 'Card (25x)' },
  { id: 4432, amount: 25, name: 'Magmaring Card', group: 'Card (25x)' },
  { id: 4196, amount: 25, name: 'Marin Card', group: 'Card (25x)' },
  { id: 4001, amount: 25, name: 'Poring Card', group: 'Card (25x)' },
  { id: 4424, amount: 25, name: 'Stapo Card', group: 'Card (25x)' },
  { id: 7291, amount: 5, name: 'Agate', group: 'Loot' },
  { id: 7297, amount: 5, name: 'Biotite', group: 'Loot' },
  { id: 7035, amount: 5, name: 'Matchstick', group: 'Loot' },
  { id: 7292, amount: 5, name: 'Muscovite', group: 'Loot' },
  { id: 7290, amount: 5, name: 'Phlogopite', group: 'Loot' },
  { id: 7296, amount: 5, name: 'Pyroxene', group: 'Loot' },
  { id: 7293, amount: 5, name: 'Rose Quartz', group: 'Loot' },
  { id: 12116, amount: 75, name: 'Elemental Converter [Earth]', group: 'Consumable' },
  { id: 12114, amount: 75, name: 'Elemental Converter [Fire]', group: 'Consumable' },
  { id: 12115, amount: 75, name: 'Elemental Converter [Water]', group: 'Consumable' },
  { id: 12117, amount: 75, name: 'Elemental Converter [Wind]', group: 'Consumable' },
];

const GUILD_CONTRIBUTION_CARD_ART_IDS = [
  4147, 4168, 4142, 4137, 4123, 27025, 4146, 4132, 4131, 4143, 4135, 4144, 4148, 4121, 4263, 4305, 4004, 4432, 4196, 4001, 4424,
];


// === CURRENCY NAMES ===
// Shared lookup for all requirement types → display labels
const CURRENCY_NAMES = {
  zeny:                    'Zeny',
  credit:                  'Credit',
  gold:                    'Gold',
  vote_points:             'Vote Points',
  activity_points:         'Activity Points',
  instance_points:         'Instance Points',
  hourly_points:           'Hourly Points',
  donate_points:           'Donate Points',
  koe_points:              'KoE Points',
  woe_points:              'WoE Points',
  headgear_points:         'Headgear Points',
  aura_points:             'Aura Points',
  monster_arena_points:    'Monster Arena Points',
  otherworld_points:       'Otherworld Points',
  hall_of_heritage_points: 'Hall of Heritage Points',
  token_points:            'Token Points',
  card_points:             'Card Points',
  cardo_points:            'Cardo Points',
  event_points:            'Event Points',
};

// === REQUIREMENT / CURRENCY TYPE OPTIONS ===

// Used by both Quests and Shops editors.
const REQ_TYPE_OPTIONS = [
  { value: 'item', label: 'Item' },
  { value: 'zeny', label: 'Zeny' },
  { value: 'gold', label: 'Gold' },
  { value: 'credit', label: 'Credit' },

  { value: 'vote_points', label: 'Vote Points' },
  { value: 'hourly_points', label: 'Hourly Points' },
  { value: 'activity_points', label: 'Activity Points' },
  { value: 'instance_points', label: 'Instance Points' },
  { value: 'donate_points', label: 'Donate Points' },
  { value: 'koe_points', label: 'KoE Points' },
  { value: 'woe_points', label: 'WoE Points' },
  { value: 'headgear_points', label: 'Headgear Points' },
  { value: 'aura_points', label: 'Aura Points' },

  { value: 'monster_arena_points', label: 'Arena Points' },
  { value: 'otherworld_points', label: 'Otherworld Points' },
  { value: 'hall_of_heritage_points', label: 'HoH Points' },
  { value: 'token_points', label: 'Token Points' },
  { value: 'card_points', label: 'Card Points' },
  { value: 'cardo_points', label: 'Cardo Points' },
];

// === HELPER FUNCTIONS ===

/**
 * Get the current zeny value of Credits from the items database
 * @returns {number} Zeny value per Credit
 */
function getCreditValue() {
  return DATA.items[SPECIAL_ITEMS.CREDIT]?.value || CREDIT_ZENY_VALUE;
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