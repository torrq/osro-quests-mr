// main.js - Globals, Init, and Helpers

// ===== GLOBAL DATA & STATE =====

window.DATA = {
  items: {},
  groups: [],
  shopGroups: [],
  itemIcons: [],
  newItemIds: new Set(),
  spriteMap: null
};

window.state = {
  currentTab: "quests",
  selectedQuest: null,
  selectedItem: null,
  selectedGroupForEdit: null,
  selectedGroup: null,
  selectedSubgroup: null,
  expandedGroups: new Set(),
  expandedSubgroups: new Set(),
  draggedQuest: null,
  draggedFrom: null,
  itemSearchFilter: "",
  selectedItemList: -1, // -1 = All, 0+ = index into DATA.itemLists
  questSearchFilter: "",
  editorMode: false,
  showLocation: true,
  sections: {
    desc:       true,
    notes:      true,
    reqs:       true,
    value:      true,
    requiredby: true,
    producedby: true,
  },
  expandedTreeItems: new Set(),
  showFullTotals: false,
  autolootData: JSON.parse(localStorage.getItem(LOCAL_STORAGE.autoloot_data)) || {},
  autolootNames: JSON.parse(localStorage.getItem(LOCAL_STORAGE.autoloot_names)) || {},
  selectedAutolootSlot: 1,
  selectedItemId: null,
  showValuesOnly: false,
  searchDescriptions: false,
  showAllItems: false,
  showNewItemsOnly: false,
  selectedShop: null,
  selectedShopGroup: null,
  selectedShopSubgroup: null,
  selectedGroupForShopEdit: null,
  shopSearchFilter: "",
  expandedShopGroups: new Set(),
  expandedShopSubgroups: new Set(),
  discount: 0,        // 0 = off, 0.24 = merchant, 0.25 = stalker
  valueMode: 'mixed', // 'zeny' | 'credit' | 'mixed'
  valueSource: 'default', // 'default' | 'custom'
  forceMobileView: false,
  activeLabExperiment: null,   // last active lab sub-tab (e.g. 'lab-credit')
};

// Ensure all 10 autoloot slots exist
for (let i = 1; i <= 10; i++) {
  if (!state.autolootData[i]) state.autolootData[i] = [];
}

document.body.classList.add("viewer-mode");

// ===== ICON CACHE =====

/**
 * Cache for rendered item icons
 * Key format: "{itemId}_{size}" (e.g., "12345_24" or "12345_48")
 */
window.iconCache = {
  cache: new Map(),
  
  get(id, size) {
    const key = `${id}_${size}`;
    return this.cache.get(key) || null;
  },
  
  set(id, size, html) {
    const key = `${id}_${size}`;
    this.cache.set(key, html);
    return html;
  },
  
  clear() {
    this.cache.clear();
    console.log('[IconCache] Cache cleared');
  },
  
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
};

// Secret editor mode activation
const SECRET_TOGGLE_CONFIG = {
  taps: 4,           // Number of taps required
  windowMs: 2000,    // Time window in milliseconds
};

let secretTapTimestamps = [];

function initSecretEditorToggle() {
  const versionTag = document.getElementById('header-version-tag');
  if (!versionTag) return;
  
  versionTag.style.cursor = 'default';
  versionTag.style.userSelect = 'none';
  
  versionTag.addEventListener('click', () => {
    const now = Date.now();
    secretTapTimestamps.push(now);
    
    // Remove taps outside the time window
    secretTapTimestamps = secretTapTimestamps.filter(
      time => now - time < SECRET_TOGGLE_CONFIG.windowMs
    );
    
    // Check if we have enough taps
    if (secretTapTimestamps.length >= SECRET_TOGGLE_CONFIG.taps) {
      toggleEditorMode(!state.editorMode);
      secretTapTimestamps = []; // Reset
      
      // Visual feedback (optional)
      versionTag.style.opacity = '0.5';
      setTimeout(() => versionTag.style.opacity = '1', 100);
    }
  });
}



// ===== VALUE / DISCOUNT HELPERS =====

function getDiscountMult() {
  return 1 - (state.discount || 0);
}

function applyDiscount(zeny) {
  if (!state.discount) return zeny;
  return Math.floor(zeny * getDiscountMult());
}

// Format a zeny total according to current value display mode
function formatValue(zeny) {
  const v = state.valueMode;
  if (v === 'credit' || (v === 'mixed' && zeny >= MIXED_CREDIT_THRESHOLD)) {
    const credits = zeny / getCreditValue();
    const fmt = formatZenyCompact(credits);
    return fmt + (credits === 1 ? ' credit' : ' credits');
  }
  return formatZenyCompact(zeny) + ' zeny';
}

window.applyDiscount = applyDiscount;
window.formatValue   = formatValue;

// ===== SETTINGS =====

function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE.config)) || {};
  } catch { return {}; }
}

function saveConfig(patch) {
  const current = loadConfig();
  localStorage.setItem(LOCAL_STORAGE.config, JSON.stringify({ ...current, ...patch }));
}

const SECTION_KEYS = ['desc', 'notes', 'reqs', 'value', 'requiredby', 'producedby'];

function initSettings() {
  const cfg = loadConfig();
  if (cfg.showLocation !== undefined) {
    state.showLocation = cfg.showLocation;
  }
  if (cfg.sections) {
    SECTION_KEYS.forEach(k => {
      if (cfg.sections[k] !== undefined) state.sections[k] = cfg.sections[k];
    });
  }
  if (cfg.discount !== undefined)    state.discount    = cfg.discount;
  if (cfg.valueMode !== undefined)   state.valueMode   = cfg.valueMode;
  if (cfg.valueSource !== undefined) state.valueSource = cfg.valueSource;
  if (cfg.forceMobileView !== undefined) state.forceMobileView = !!cfg.forceMobileView;
  const sl = document.getElementById('settingShowLocation');
  if (sl) sl.checked = state.showLocation;
  const fmv = document.getElementById('settingForceMobileView');
  if (fmv) fmv.checked = state.forceMobileView;
  applyMobileLayoutPreference();
  syncSectionButtons();
  syncValueButtons();
}

function syncValueButtons() {
  ['off','24','25'].forEach(v => {
    const btn = document.getElementById(`discBtn_${v}`);
    const active = v === 'off' ? !state.discount : state.discount === parseFloat('0.' + v);
    if (btn) btn.classList.toggle('sec-btn--off', !active);
  });
  ['zeny','credit','mixed'].forEach(v => {
    const btn = document.getElementById(`vmBtn_${v}`);
    if (btn) btn.classList.toggle('sec-btn--off', state.valueMode !== v);
  });
  ['default','custom'].forEach(v => {
    const btn = document.getElementById(`vsBtn_${v}`);
    if (btn) btn.classList.toggle('sec-btn--off', state.valueSource !== v);
  });
}

function settingSetDiscount(val) {
  state.discount = val;
  saveConfig({ discount: val });
  syncValueButtons();
  render();
}

function settingSetValueMode(mode) {
  state.valueMode = mode;
  saveConfig({ valueMode: mode });
  syncValueButtons();
  render();
}

function settingSetValueSource(source) {
  state.valueSource = source === 'custom' ? 'custom' : 'default';
  saveConfig({ valueSource: state.valueSource });
  syncValueButtons();

  // Keep Values Manager source toggle in sync
  if (typeof window.setValuesManagerSource === 'function') {
    window.setValuesManagerSource(state.valueSource);
  }

  // Reload values according to the new source, then re-render
  loadItemValuesFromStorage()
    .then(() => {
      render();
      if (typeof window.renderValuesManagerPane === 'function') window.renderValuesManagerPane();
    })
    .catch(() => render());
}

function applyMobileLayoutPreference() {
  document.body.classList.toggle('force-mobile-view', !!state.forceMobileView);
  if (state.forceMobileView) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
  }
}

function settingSetForceMobileView(enabled) {
  state.forceMobileView = !!enabled;
  saveConfig({ forceMobileView: state.forceMobileView });
  const toggle = document.getElementById('settingForceMobileView');
  if (toggle) toggle.checked = state.forceMobileView;
  applyMobileLayoutPreference();
}

window.settingSetDiscount  = settingSetDiscount;
window.settingSetValueMode = settingSetValueMode;
window.settingSetValueSource = settingSetValueSource;
window.settingSetForceMobileView = settingSetForceMobileView;

function syncSectionButtons() {
  SECTION_KEYS.forEach(k => {
    const btn = document.getElementById(`secBtn_${k}`);
    if (btn) btn.classList.toggle('sec-btn--off', !state.sections[k]);
  });
}

function toggleSettingsPanel() {
  const panel = document.getElementById('settingsPanel');
  const gear  = document.getElementById('settingsGearBtn');
  if (!panel) return;
  const open = panel.style.display === 'none' || panel.style.display === '';
  panel.style.display = open ? 'block' : 'none';
  gear?.classList.toggle('settings-gear--active', open);
}

function toggleSection(key) {
  state.sections[key] = !state.sections[key];
  const saved = {};
  SECTION_KEYS.forEach(k => saved[k] = state.sections[k]);
  saveConfig({ sections: saved });
  syncSectionButtons();
  render();
}

function settingSetShowLocation(enabled) {
  state.showLocation = enabled;
  saveConfig({ showLocation: enabled });
  render();
}

window.toggleSettingsPanel    = toggleSettingsPanel;
window.toggleSection          = toggleSection;
window.settingSetShowLocation = settingSetShowLocation;
window.toggleTheme            = toggleTheme;

// ===== THEME MANAGEMENT =====

function initTheme() {
  const savedTheme = localStorage.getItem(LOCAL_STORAGE.theme) || 'dark';
  applyTheme(savedTheme);
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = theme === 'dark' ? '☀' : '🌙';
}

function toggleTheme() {
  const current = localStorage.getItem(LOCAL_STORAGE.theme) || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(LOCAL_STORAGE.theme, next);
  updateThemeIcon(next);
}

function applyTheme(theme) {
  const head = document.head;
  
  // Remove existing theme link
  const existingTheme = document.getElementById('theme-stylesheet');
  if (existingTheme) {
    existingTheme.remove();
  }
  
  // Add new theme link
  const link = document.createElement('link');
  link.id = 'theme-stylesheet';
  link.rel = 'stylesheet';
  link.href = `css/style_${theme}.css`;
  head.appendChild(link);
}

// ===== INITIALIZATION =====

// Track initialization state to prevent race conditions
window.initState = {
  complete: false,
  valuesLoaded: false,
  userHasEditedValues: false
};

function initializeData() {
  if (!AUTO_IMPORT_ON_FIRST_LOAD) {
    render();
    return;
  }

  Promise.all([
    fetchJSON(AUTO_IMPORT_URLS.items),
    fetchJSON(AUTO_IMPORT_URLS.quests),
    fetchJSON(AUTO_IMPORT_URLS.shops),
    fetchJSON(AUTO_IMPORT_URLS.icons),
    fetchJSON(AUTO_IMPORT_URLS.searchIndexName),
    fetchJSON(AUTO_IMPORT_URLS.searchIndexDesc),
    fetchJSON(AUTO_IMPORT_URLS.newItems),
    fetchJSON(AUTO_IMPORT_URLS.spriteMap),
    fetchJSON(AUTO_IMPORT_URLS.itemLists).catch(() => []),
    fetchJSON(AUTO_IMPORT_URLS.pointLinks).catch(() => ({}))
  ])
    .then(([items, quests, shops, icons, searchName, searchDesc, newItems, spriteMap, itemLists, pointLinks]) => {
      loadItems(items);
      loadQuests(quests);
      loadShops(shops);
      loadItemIcons(icons);
      loadSearchIndices(searchName, searchDesc);
      loadNewItems(newItems);
      loadSpriteMap(spriteMap);
      DATA.itemLists = Array.isArray(itemLists) ? itemLists : [];
      loadPointLinks(pointLinks);
      return loadItemValuesFromStorage();
    })
    .then(() => {
      initState.complete = true;
      
      // This ensures we never miss the window or check too early.
      handleURLNavigation();
      
      // Render the final state (handleURLNavigation might have set a specific tab)
      render();
      
      // Initialize history state if needed
      if (!window.history.state) {
        const urlParams = new URLSearchParams(window.location.search);
        const questId = urlParams.get('quest');
        window.history.replaceState(
          { questId: questId || null, tab: state.currentTab },
          '',
          window.location.href
        );
      }
    })
    .catch(handleInitError);
}

function fetchJSON(url) {
  return fetch(url).then(r => r.ok ? r.json() : null);
}

function loadItems(items) {
  if (!items) {
    console.warn("[Init] No items data received from remote");
    return;
  }

  DATA.items = items;
  console.log(`[Init] Loaded ${Object.keys(DATA.items).length} items from remote`);
}

function loadItemValuesFromStorage() {
  // Default mode: always use the canonical remote JSON, never read/write localStorage for values
  if (state.valueSource === 'default') {
    console.log("[Init] Default value source — loading from remote");
    return loadItemValuesFromRemote(false); // false = don't save to localStorage
  }

  // Custom mode: load canonical remote defaults, then overlay localStorage (if any)
  return loadItemValuesFromRemote(false)
    .then(() => {
      const stored = localStorage.getItem(LOCAL_STORAGE.item_values);
      if (!stored) return;
      try {
        const values = JSON.parse(stored);
        applyItemValues(values);
        initState.valuesLoaded = true;
        console.log(`[Init] Overlayed ${Object.keys(values).length} custom item values from localStorage`);
      } catch (err) {
        console.error("[Init] Failed to parse stored item values:", err);
        localStorage.removeItem(LOCAL_STORAGE.item_values);
      }
    });
}

function loadItemValuesFromRemote(saveToStorage = true) {
  return fetchJSON(AUTO_IMPORT_URLS.values)
    .then(values => {
      if (values) {
        if (saveToStorage && initState.userHasEditedValues) {
          console.warn("[Init] User has already edited values. Skipping remote import to preserve user changes.");
          return;
        }
        applyItemValues(values);
        if (saveToStorage) saveItemValuesToStorage();
        initState.valuesLoaded = true;
        console.log(`[Init] Loaded ${Object.keys(values).length} item values from remote${saveToStorage ? " and saved to localStorage" : ""}`);
      } else {
        console.warn("[Init] No item values data received from remote");
      }
    })
    .catch(err => {
      console.error("[Init] Failed to load item values from remote:", err);
    });
}

function applyItemValues(values) {
  Object.entries(values).forEach(([id, value]) => {
    if (DATA.items[id]) {
      DATA.items[id].value = value;
    } else {
      DATA.items[id] = { name: "", value };
    }
  });
}


function loadDefaultValuesIntoCustom() {
  return fetchJSON(AUTO_IMPORT_URLS.values).then(remote => {
    if (!remote) { showToast('Could not reach default values', 'error'); return; }
    // Merge: remote values overwrite matching ids, custom-only items are preserved
    const stored = localStorage.getItem(LOCAL_STORAGE.item_values);
    let existing = {};
    try { existing = stored ? JSON.parse(stored) : {}; } catch { existing = {}; }
    const merged = { ...existing, ...remote };
    applyItemValues(merged);
    localStorage.setItem(LOCAL_STORAGE.item_values, JSON.stringify(merged));
    showToast(`Loaded ${Object.keys(remote).length} default values`, 'success');
  }).catch(() => showToast('Failed to load default values', 'error'));
}
window.loadDefaultValuesIntoCustom = loadDefaultValuesIntoCustom;

function saveItemValuesToStorage() {
  const values = {};
  Object.entries(DATA.items).forEach(([id, item]) => {
    if (item.value > 0) values[id] = item.value;
  });
  localStorage.setItem(LOCAL_STORAGE.item_values, JSON.stringify(values));
}

function saveAutolootData() {
  try {
    localStorage.setItem(LOCAL_STORAGE.autoloot_data, JSON.stringify(state.autolootData));
    localStorage.setItem(LOCAL_STORAGE.autoloot_names, JSON.stringify(state.autolootNames));
    console.log("[Autoloot] Saved autoloot data to localStorage");
  } catch (error) {
    console.error("[Autoloot] Failed to save autoloot data:", error);
    logError("saveAutolootData", error);
  }
}

function importItemValues() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const values = JSON.parse(text);
      
      applyItemValues(values);
      saveItemValuesToStorage();
      
      showToast(`Imported ${Object.keys(values).length} item values`, 'success');
      
      if (state.currentTab === 'items') {
        renderItems();
        if (state.selectedItemId) renderItemContent();
      }
    } catch (err) {
      showToast('Failed to import — check the file format', 'error', 5000);
    }
  };
  
  input.click();
}

async function resetItemValuesToDefaults() {
  const ok = window.confirm('Reset item values to server defaults? This will overwrite your current values.');
  if (!ok) return;

  try {
    const defaults = await fetchJSON(AUTO_IMPORT_URLS.values);
    if (!defaults) {
      showToast('Failed to load default values from server', 'error', 5000);
      return;
    }

    // Clear all existing values first, then apply the defaults set.
    Object.values(DATA.items || {}).forEach((item) => {
      if (item) item.value = 0;
    });

    applyItemValues(defaults);
    saveItemValuesToStorage();

    if (window.initState) {
      window.initState.userHasEditedValues = true;
    }

    showToast(`Restored ${Object.keys(defaults).length} default item values`, 'success');

    if (state.currentTab === 'items') {
      renderItems();
      if (state.selectedItemId) renderItemContent();
    }

    if (typeof window.renderValuesManagerPane === 'function') {
      window.renderValuesManagerPane();
    }
  } catch (err) {
    console.error('[Values] Reset to defaults failed:', err);
    showToast('Failed to reset values to defaults', 'error', 5000);
  }
}

function toggleValuesFilter(checked) {
  state.showValuesOnly = checked;
  renderItems();
}

function loadQuests(quests) {
  if (quests?.groups) {
    DATA.groups = quests.groups;
    console.log(`[Init] Loaded ${quests.groups.length} quest groups`);
  } else {
    console.warn("[Init] No quest data received from remote");
  }
}

function loadShops(shops) {
  if (!shops) {
    console.warn("[Init] No shops data received from remote");
    DATA.shopGroups = [];
    return;
  }
  DATA.shopGroups = shops.groups || [];
  console.log(`[Init] Loaded ${DATA.shopGroups.length} shop groups from remote`);
}

function loadItemIcons(icons) {
  if (icons && Array.isArray(icons)) {
    DATA.itemIcons = icons;
    
    // Clear icon cache when new icons are loaded
    iconCache.clear();
    
    console.log(`[Init] Loaded ${icons.length} item icons`);
  } else {
    console.warn("[Init] No item icons data received from remote");
  }
}

function loadSearchIndices(nameIndex, descIndex) {
  if (nameIndex && typeof nameIndex === 'object') {
    if (typeof window.SEARCH_INDEX_NAME !== 'undefined') {
      SEARCH_INDEX_NAME = nameIndex;
    }
    console.log(`[Init] Loaded name search index (${Object.keys(nameIndex).length} terms)`);
  }
  
  if (descIndex && typeof descIndex === 'object') {
    if (typeof window.SEARCH_INDEX_DESC !== 'undefined') {
      SEARCH_INDEX_DESC = descIndex;
    }
    console.log(`[Init] Loaded description search index (${Object.keys(descIndex).length} terms)`);
  }
}

function loadNewItems(newItems) {
  if (newItems && Array.isArray(newItems)) {
    DATA.newItemIds = new Set(newItems);
    
    // Index new items so they work with text search
    newItems.forEach(id => {
      const item = DATA.items[id];
      if (item && item.name) {
        const terms = item.name.toLowerCase().split(/\s+/);
        terms.forEach(term => {
          if (term.length < 1) return;
          if (!SEARCH_INDEX_NAME[term]) SEARCH_INDEX_NAME[term] = [];
          if (!SEARCH_INDEX_NAME[term].includes(id)) {
            SEARCH_INDEX_NAME[term].push(id);
          }
        });
      }
    });
    
    console.log(`[Init] Loaded and indexed ${newItems.length} new item IDs`);
  }
}

function loadSpriteMap(spriteMap) {
  if (spriteMap && spriteMap.map) {
    DATA.spriteMap = spriteMap;
    console.log(`[Init] Loaded sprite map with ${spriteMap.totalIcons} icons`);
  } else {
    console.warn("[Init] No sprite map data received - falling back to individual icons");
  }
}

function loadPointLinks(raw) {
  const links = raw && typeof raw === 'object' ? raw : {};
  const typeToTicket = {};
  Object.entries(links).forEach(([ticketIdStr, type]) => {
    const ticketId = Number(ticketIdStr);
    if (!Number.isFinite(ticketId) || ticketId <= 0) return;
    if (typeof type !== 'string' || !type) return;
    typeToTicket[type] = ticketId;
  });
  DATA.pointTicketLinks = links;
  DATA.pointTypeToTicket = typeToTicket;
}

function getTicketIdForRequirementType(reqType) {
  return DATA.pointTypeToTicket?.[reqType] || null;
}

window.getTicketIdForRequirementType = getTicketIdForRequirementType;

function handleInitError(err) {
  console.error("[Init] Auto-import failed:", err);
  logError("Initialization", err);
  
  const message = "Failed to auto-import data from remote URLs.\n\n" +
                  "Error: " + (err.message || String(err)) + "\n\n" +
                  "The application may not function correctly. Check console for details.";
  
  showToast(message, 'error', 8000);
  
  // Still try to render with whatever data we have
  initState.complete = true;
  render();
}

// ===== ERROR HANDLING & BOUNDARIES =====

// Error logging and display
window.errorLog = [];

function logError(context, error, data = {}) {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    context,
    message: error.message || String(error),
    stack: error.stack,
    data
  };
  
  errorLog.push(errorEntry);
  console.error(`[Error] ${context}:`, error, data);
  
  // Keep only last 50 errors
  if (errorLog.length > 50) {
    errorLog.shift();
  }
}

function showErrorMessage(container, context, error, canRetry = false) {
  const containerId = typeof container === 'string' ? container : container?.id || 'unknown';
  const errorMessage = error.message || String(error);
  
  const html = `
    <div class="error-state">
      <h2>⚠️ Something Went Wrong</h2>
      <p class="error-context">Error in: <strong>${context}</strong></p>
      <details class="error-details">
        <summary>Error Details</summary>
        <pre>${escapeHtml(errorMessage)}</pre>
        ${error.stack ? `<pre class="error-stack">${escapeHtml(error.stack)}</pre>` : ''}
      </details>
      ${canRetry ? `
        <button onclick="location.reload()" class="btn-retry">
          🔄 Reload Page
        </button>
      ` : ''}
      <p class="error-help">
        If this problem persists, try clearing your browser cache or 
        <a href="#" onclick="localStorage.clear(); location.reload();">resetting your data</a>.
      </p>
    </div>
  `;
  
  if (typeof container === 'string') {
    const el = document.getElementById(container);
    if (el) el.innerHTML = html;
  } else if (container instanceof HTMLElement) {
    container.innerHTML = html;
  }
}

// Error boundary wrapper for render functions
function withErrorBoundary(fn, context) {
  return function(...args) {
    try {
      const result = fn.apply(this, args);
      return result;
    } catch (error) {
      logError(context, error, { args });
      
      // Try to show error in appropriate container
      let containerId = null;
      if (context.includes('Items')) {
        containerId = context.includes('Content') ? 'mainContent' : 'itemsList';
      } else if (context.includes('Quest')) {
        containerId = context.includes('Content') ? 'mainContent' : 'treeContainer';
      } else if (context.includes('Group')) {
        containerId = context.includes('Content') ? 'mainContent' : 'groupsList';
      } else if (context.includes('Autoloot')) {
        containerId = context.includes('Main') ? 'mainContent' : 'autolootList';
      }
      
      if (containerId) {
        showErrorMessage(containerId, context, error, true);
      } else {
        // Fallback: show alert
        showToast(`Error: ${error.message}`, 'error', 6000);
      }
      
      // Don't throw - allow app to continue
      return null;
    }
  };
}

// Wrap a function with validation for required data structures
function withDataValidation(fn, context, requiredData = []) {
  return function(...args) {
    // Check required data exists
    for (const dataPath of requiredData) {
      const parts = dataPath.split('.');
      let current = window;
      
      for (const part of parts) {
        if (current[part] === undefined || current[part] === null) {
          const error = new Error(`Required data missing: ${dataPath}`);
          logError(context, error, { requiredData });
          console.warn(`[${context}] Skipping render - required data not loaded yet`);
          return null;
        }
        current = current[part];
      }
    }
    
    return fn.apply(this, args);
  };
}

// ===== ITEM HELPERS =====

function getItem(id) {
  return (id != null && DATA.items[id]) || { name: "", value: 0 };
}

function getItemDisplayName(item) {
  if (!item) return "";
  const safeName = escapeHtml(item.name || "");
  const slot = Number(item.slot) || 0;
  return slot > 0 ? `${safeName} [${slot}]` : safeName;
}

function ensureItem(id, name) {
  const numId = parseInt(id);
  if (!id || isNaN(numId)) return null;

  if (!DATA.items[numId]) {
    DATA.items[numId] = { name: name || "", value: 0 };
  } else if (name && !DATA.items[numId].name) {
    DATA.items[numId].name = name;
  }
  return DATA.items[numId];
}

function getAllItems() {
  if (!DATA.items || typeof DATA.items !== 'object') {
    console.warn('[getAllItems] DATA.items is not a valid object');
    return [];
  }
  
  return Object.entries(DATA.items)
    .map(([id, item]) => ({ ...item, id: +id }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

function getItemIconUrl(id) {
  const numId = Number(id); // Convert to number for comparison
  if (DATA.itemIcons && DATA.itemIcons.includes(numId)) {
    return `image/item/${numId}.png`;
  }
  return null;
}

function renderItemIcon(id, size = 24) {
  // Normalize/validate size: only allow 24 or 48
  const parsed = Number(size);
  const validSize = parsed === 24 || parsed === 48 ? parsed : 24;
  
  // Check cache first
  const cached = iconCache.get(id, validSize);
  if (cached) {
    return cached;
  }
  
  // Generate icon HTML
  const sizeClass = `icon${validSize}`;
  let html;

  // Special handling for Zeny (ID 1) and Points (ID 2)
  if (id === 2) {
    html = `<div class="item-icon-placeholder-points ${sizeClass}"></div>`;
  } else if (DATA.spriteMap && DATA.spriteMap.map[id]) {
    // Use sprite sheet if available
    const [col, row] = DATA.spriteMap.map[id];
    const iconSize = DATA.spriteMap.iconSize;
    const xPos = col * iconSize;
    const yPos = row * iconSize;
    
    // Calculate scaling for 48px icons (2x upscale)
    const scale = validSize / iconSize;
    const bgSize = `${DATA.spriteMap.spriteWidth * scale}px ${DATA.spriteMap.spriteHeight * scale}px`;
    const bgPos = `-${xPos * scale}px -${yPos * scale}px`;
    
    html = `<div class="item-icon sprite-icon ${sizeClass}" ` +
           `style="background-position: ${bgPos}; background-size: ${bgSize};" ` +
           `title="Item #${id}"></div>`;
  } else {
    // Fallback to individual icon file
    const iconUrl = getItemIconUrl(id);
    if (iconUrl) {
      html = `<img src="${iconUrl}" alt="Item #${id}" title="Item #${id}" ` +
             `class="item-icon pixelated ${sizeClass}" ` +
             `onerror="this.onerror=null; this.outerHTML='<div class=\\'item-icon-placeholder ${sizeClass}\\'></div>';">`;
    } else {
      html = `<div class="item-icon-placeholder ${sizeClass}"></div>`;
    }
  }
  
  // Store in cache and return
  return iconCache.set(id, validSize, html);
}

// ===== TEXT HELPERS =====

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ===== COLOR ADJUSTMENT FOR DARK THEME =====

/**
 * Adjusts hex colors for optimal contrast on dark backgrounds
 * Preserves hue while ensuring readability
 */
function adjustColorForDarkTheme(hexColor) {
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Convert RGB to HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  // Adjust lightness for dark theme
  // Dark colors (l < 0.4) → brighten significantly
  // Mid colors (0.4-0.6) → brighten moderately
  // Light colors (> 0.6) → keep bright but not pure white
  if (l < 0.4) {
    l = Math.min(0.75, l + 0.45); // Boost dark colors
  } else if (l < 0.6) {
    l = Math.min(0.8, l + 0.25); // Moderate boost for mid tones
  } else if (l > 0.95) {
    l = 0.9; // Slightly dim pure white for comfort
  }
  
  // Boost saturation slightly for very desaturated colors
  if (s < 0.3) {
    s = Math.min(0.5, s + 0.15);
  }
  
  // Convert HSL back to RGB
  let r2, g2, b2;
  if (s === 0) {
    r2 = g2 = b2 = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r2 = hue2rgb(p, q, h + 1/3);
    g2 = hue2rgb(p, q, h);
    b2 = hue2rgb(p, q, h - 1/3);
  }
  
  // Convert back to hex
  const toHex = (n) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `${toHex(r2)}${toHex(g2)}${toHex(b2)}`.toUpperCase();
}

function parseDescription(desc) {
  if (!desc) return "";
  
  try {
    let text;
    if (typeof desc === "string") {
      text = desc.replace(/\n/g, "<br>");
    } else if (Array.isArray(desc)) {
      text = desc.join("<br>");
    } else {
      console.warn('[parseDescription] Unexpected description type:', typeof desc);
      return "";
    }
    
    // Check current theme
    const currentTheme = localStorage.getItem(LOCAL_STORAGE.theme) || 'dark';
    const isDarkTheme = currentTheme === 'dark';
    
    // RO color handling - only adjust for dark theme
    return text
      .replace(/\^000000/g, "</span>")
      .replace(/\^([0-9A-Fa-f]{6})/g, (match, hexColor) => {
        // For light theme, use original colors
        const finalColor = isDarkTheme ? adjustColorForDarkTheme(hexColor) : hexColor;
        return `<span style="color: #${finalColor}">`;
      });
  } catch (error) {
    console.error('[parseDescription] Error parsing description:', error);
    return String(desc); // Fallback to string representation
  }
}

// ===== TAB NAVIGATION =====

const TAB_ELEMENTS = {
  quests: {
    sidebar: "treeContainer",
    search: "questsSearch",
    render: ["renderSidebar", "renderQuestContent"]
  },
  shops: {
    sidebar: "shopsTreeContainer",
    search: "shopsSearch",
    render: ["renderShopsSidebar", "renderShopContent"]
  },
  items: {
    sidebar: "itemsList",
    search: "itemsSearch",
    render: ["renderItems", "renderItemContent"]
  },
  groups: {
    sidebar: "groupsList",
    search: "groupsActions",
    render: ["renderGroupsList", "renderGroupContent"],
    editorOnly: true
  },
  autoloot: {
    sidebar: "autolootList",
    render: ["renderAutolootSidebar", "renderAutolootMain"]
  },
  lab: {
    sidebar: "labList",
    render: ["renderLabSidebar", "renderLabMain"]
  },
  'lab-gc': {
    sidebar: "labList",
    render: ["renderLabSidebar", "renderLabMain"]
  },
  'lab-credit': {
    sidebar: "labList",
    render: ["renderLabSidebar", "renderLabMain"]
  },
  'lab-gem': {
    sidebar: "labList",
    render: ["renderLabSidebar", "renderLabMain"]
  }
};

function switchTab(tabName, pushState = true) {
  // 'lab' is a namespace — redirect to the active experiment tab
  if (tabName === 'lab') {
      tabName = state.activeLabExperiment || (window.LAB_DEFAULT_EXPERIMENT) || 'lab-gc';
  }
  if (tabName.startsWith('lab-')) {
      state.activeLabExperiment = tabName;
  }
  const previousTab = state.currentTab;
  state.currentTab = tabName;
  updateTabButtons(tabName);
  hideAllElements();
  showTabElements(tabName);

  // Close the Values Manager when leaving Items tab
  if (tabName !== 'items' && typeof window.closeValuesManager === 'function') {
    window.closeValuesManager(false);
  }
  
  // Update URL when switching tabs (avoid racing user clicks)
  if (pushState && previousTab !== tabName && typeof updateURL === 'function') {
    let entityType = null;
    let entityId = null;

    if (tabName === 'quests' && state.selectedQuest?.producesId) {
      entityType = 'quest';
      entityId = state.selectedQuest.producesId.toString();
    } else if (tabName === 'shops' && state.selectedShop?.producesId) {
      entityType = 'shop';
      entityId = state.selectedShop.producesId.toString();
    } else if (tabName === 'items' && state.selectedItemId) {
      entityType = 'item';
      entityId = state.selectedItemId.toString();
    } else if (tabName === 'autoloot' && state.selectedAutolootSlot) {
      entityType = 'autoloot';
      entityId = state.selectedAutolootSlot.toString();
    }

    updateURL(entityId, entityType, true);
  }
}

function updateTabButtons(tabName) {
  document.querySelectorAll(".tab").forEach(tab => {
    const dataTab = tab.getAttribute('data-tab');
    let matches;
    if (dataTab) {
      // 'lab' button should be active for any lab-* subtab
      matches = dataTab === tabName || (dataTab === 'lab' && tabName.startsWith('lab-'));
    } else {
      matches = tab.textContent.toLowerCase().includes(tabName);
    }
    tab.classList.toggle("active", matches);
  });
}

function hideAllElements() {
  ["treeContainer", "shopsTreeContainer", "itemsList", "groupsList", "autolootList", "labList"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  ["questsSearch", "shopsSearch", "itemsSearch", "groupsActions"].forEach(id => {
    document.getElementById(id).classList.add("hidden");
  });
}

function showTabElements(tabName) {
  const config = TAB_ELEMENTS[tabName];
  if (!config) return;

  // Show sidebar
  const sidebar = document.getElementById(config.sidebar);
  if (sidebar) sidebar.classList.remove("hidden");

  // Show search/actions (if not editor-only or if in editor mode)
  if (config.search && (!config.editorOnly || state.editorMode)) {
    const searchEl = document.getElementById(config.search);
    if (searchEl) searchEl.classList.remove("hidden");
  }

  // Call render functions with error handling
  config.render?.forEach(fnName => {
    if (window[fnName]) {
      try {
        window[fnName]();
      } catch (error) {
        logError(`showTabElements -> ${fnName}`, error, { tabName });
        console.error(`[showTabElements] Failed to call ${fnName}:`, error);
      }
    } else {
      console.warn(`[showTabElements] Render function '${fnName}' not found`);
    }
  });
}

// Auto-select first item when switching to items tab with no selection
function selectFirstItem() {
  if (window.renderItems) {
    // Trigger render to populate the list
    window.renderItems();
  }
  
  // Wait for render, then select first
  setTimeout(() => {
    const firstItemRow = document.querySelector('.item-row');
    if (firstItemRow) {
      const itemId = firstItemRow.onclick?.toString().match(/selectItem\((\d+)/)?.[1];
      if (itemId && window.selectItem) {
        window.selectItem(parseInt(itemId), true);
      }
    }
  }, 100);
}

function render() {
  switchTab(state.currentTab);
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function isMobileSidebarMode() {
  return window.innerWidth <= 768 || !!state.forceMobileView;
}

// ── Mobile FAB: hide on scroll-down, show on scroll-up ──────────────────────
(function () {
  const THRESHOLD = 8;
  let lastY = 0;
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const btn = document.querySelector('.mobile-toggle');
        if (!btn) { ticking = false; return; }

        const scroller = document.querySelector('.main-content');
        if (!scroller) { ticking = false; return; }

        const currentY = scroller.scrollTop;
        const delta = currentY - lastY;

        if (Math.abs(delta) >= THRESHOLD) {
          const shouldHide = delta > 0 && currentY > 100;
          btn.classList.toggle('hidden', shouldHide);
          lastY = currentY;
        }

        ticking = false;
      });
      ticking = true;
    }
  }

  // .main-content exists immediately — attach directly, not to window
  document.addEventListener('DOMContentLoaded', () => {
    const scroller = document.querySelector('.main-content');
    if (scroller) scroller.addEventListener('scroll', onScroll, { passive: true });
  });
})();

function toggleEditorMode(enabled) {
  state.editorMode = enabled;
  document.body.classList.toggle("viewer-mode", !enabled);
  
  if (!enabled && state.currentTab === "groups") {
    switchTab("quests");
  }
  
  render();
}

function saveData() {
  console.log("[Save] No caching - data always fresh from remote");
}

// ===== EXPORT FUNCTIONS =====

function exportQuests() {
  const cleanedGroups = DATA.groups.map(group => ({
    ...group,
    subgroups: group.subgroups.map(subgroup => ({
      ...subgroup,
      quests: subgroup.quests.map(quest => ({
        ...quest,
        requirements: quest.requirements.map(req => {
          const cleaned = { ...req };
          if (!cleaned.immune) delete cleaned.immune;
          return cleaned;
        })
      }))
    }))
  }));

  downloadJSON({ groups: cleanedGroups }, "osrohr_quests.json");
}

function exportShops() {
  const cleanedGroups = DATA.shopGroups.map(group => ({
    ...group,
    subgroups: group.subgroups.map(subgroup => ({
      ...subgroup,
      shops: subgroup.shops.map(shop => ({
        ...shop,
        requirements: shop.requirements.map(req => {
          const cleaned = { ...req };
          if (!cleaned.immune) delete cleaned.immune;
          return cleaned;
        })
      }))
    }))
  }));

  downloadJSON({ groups: cleanedGroups }, "osrohr_shops.json");
}

function exportValues() {
  const values = {};
  Object.entries(DATA.items).forEach(([id, item]) => {
    if (item.value > 0) values[id] = item.value;
  });
  downloadJSON(values, "osrohr_item_values.json");
}

function exportAll() {
  exportQuests();
  setTimeout(exportShops, 100);
}

function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== SEARCH FUNCTIONS =====

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}

const debouncedQuestFilter = debounce(value => {
  state.questSearchFilter = value.toLowerCase();
  if (window.renderSidebar) renderSidebar();
}, 250);

const debouncedItemFilter = debounce(value => {
  state.itemSearchFilter = value.toLowerCase();
  if (typeof renderItems === 'function') renderItems();
  if (state.selectedItemId && typeof renderItemContent === 'function') {
    renderItemContent();
  }
}, 250);

const debouncedShopFilter = debounce(value => {
  state.shopSearchFilter = value.toLowerCase();
  if (window.renderShopsSidebar) renderShopsSidebar();
}, 250);

function clearItemSearch() {
  const input = document.getElementById("itemSearchInput");
  if (input) input.value = "";
  state.itemSearchFilter = "";
  if (typeof renderItems === 'function') renderItems();
  if (state.selectedItemId && typeof renderItemContent === 'function') {
    renderItemContent();
  }
}

function clearQuestSearch() {
  state.questSearchFilter = "";
  document.getElementById("questSearchInput").value = "";
  if (window.renderSidebar) renderSidebar();
}

function clearShopSearch() {
  state.shopSearchFilter = "";
  document.getElementById("shopSearchInput").value = "";
  if (window.renderShopsSidebar) renderShopsSidebar();
}

function toggleDescSearch(checked) {
  state.searchDescriptions = checked;
  renderItems();
}

function toggleShowAllItems(checked) {
  state.showAllItems = checked;
  renderItems();
}

window.toggleShowAllItems = toggleShowAllItems;

// ===== URL NAVIGATION FUNCTIONS =====

// Handle URL parameters on page load and navigation
function handleURLNavigation() {
  const urlParams = new URLSearchParams(window.location.search);
  const questId = urlParams.get('quest');
  const shopId = urlParams.get('shop');
  const itemId = urlParams.get('item');
  const autolootSlot = urlParams.get('autoloot');
  const tab = urlParams.get('tab');
  const ilParam = urlParams.get('il');
  if (ilParam !== null) {
    const idx = parseInt(ilParam);
    state.selectedItemList = Number.isFinite(idx) ? idx : -1;
  }
  if (urlParams.get('ia') === '1') state.showAllItems = true;
  if (urlParams.get('in') === '1') state.showNewItemsOnly = true;
  if (urlParams.get('iv') === '1') state.showValuesOnly = true;
  if (urlParams.get('id') === '1') state.searchDescriptions = true;
  
  // Helper to ensure tab is active before selection
  const ensureTab = (tabName) => {
    if (state.currentTab !== tabName) {
      switchTab(tabName, false); // false = don't push to history during load
    }
  };

  // Priority 1: Entity Deep Links (Implicitly set the tab)
  if (questId) {
    ensureTab('quests');
    selectQuestById(questId, false);
  } 
  else if (shopId) {
    ensureTab('shops');
    if (window.selectShopById) {
      window.selectShopById(shopId, false);
    }
  }
  else if (itemId) {
    ensureTab('items');
    if (window.selectItemById) {
      // Clear any existing search filter so the deep-linked item is visible
      if (state.itemSearchFilter) {
        state.itemSearchFilter = "";
        document.getElementById("itemSearchInput").value = "";
      }
      window.selectItemById(itemId, false);
    }
  } 
  else if (autolootSlot) {
    ensureTab('autoloot');
    if (window.selectAutolootSlot) {
      window.selectAutolootSlot(parseInt(autolootSlot), false);
    }
  }
  // Priority 2: Pure Tab Navigation (Only if no entity is linked)
  else if (tab) {
    if (tab === 'values') {
      ensureTab('items');
      if (typeof window.openValuesManager === 'function') {
        window.openValuesManager(false);
      }
    } else {
      ensureTab(tab);
    }
  }
}

// Update URL with current state without reloading page
function updateURL(entityId = null, entityType = null, pushState = true) {
  const url = new URL(window.location);
  
  // 1. Clear all tracking parameters first to ensure a clean state
  url.searchParams.delete('quest');
  url.searchParams.delete('shop');
  url.searchParams.delete('item');
  url.searchParams.delete('autoloot');
  url.searchParams.delete('tab'); // Always clear tab initially
  
  // 2. Set the specific entity parameter
  if (entityId && entityType) {
    url.searchParams.set(entityType, entityId);
    // Note: We intentionally DO NOT set 'tab' here. 
    // The entity presence implies the tab (quest->quests, item->items, etc.)
  } 
  // 3. If no entity is selected, we rely on the tab parameter
  else if (state.currentTab !== 'quests') {
    // Only set tab if it's not the default "quests" tab
    const valuesOpen = state.currentTab === 'items'
      && typeof window.isValuesManagerOpen === 'function'
      && window.isValuesManagerOpen();
    url.searchParams.set('tab', valuesOpen ? 'values' : state.currentTab);
  }
  
  // 4. Create state object for history
  const historyState = {
    tab: (state.currentTab === 'items'
      && typeof window.isValuesManagerOpen === 'function'
      && window.isValuesManagerOpen())
      ? 'values'
      : state.currentTab,
    questId: entityType === 'quest' ? entityId : null,
    itemId: entityType === 'item' ? entityId : null,
    autolootSlot: entityType === 'autoloot' ? entityId : null
  };
  
  // Persist items-tab search state in URL
  if (state.currentTab === 'items' || entityType === 'item') {
    if (state.selectedItemList >= 0) url.searchParams.set('il', state.selectedItemList);
    else url.searchParams.delete('il');
    if (state.showAllItems)      url.searchParams.set('ia', '1');
    else                         url.searchParams.delete('ia');
    if (state.showNewItemsOnly)  url.searchParams.set('in', '1');
    else                         url.searchParams.delete('in');
    if (state.showValuesOnly)    url.searchParams.set('iv', '1');
    else                         url.searchParams.delete('iv');
    if (state.searchDescriptions) url.searchParams.set('id', '1');
    else                          url.searchParams.delete('id');
  } else {
    // Clean up items params when not on items tab
    ['il','ia','in','iv','id'].forEach(k => url.searchParams.delete(k));
  }

  if (pushState) {
    window.history.pushState(historyState, '', url);
  } else {
    window.history.replaceState(historyState, '', url);
  }
}

// Find a quest by ID in the group/subgroup/quest structure
function findQuestById(questId) {
  if (!DATA.groups || !Array.isArray(DATA.groups)) return null;
  
  for (let groupIdx = 0; groupIdx < DATA.groups.length; groupIdx++) {
    const group = DATA.groups[groupIdx];
    if (!group || !Array.isArray(group.subgroups)) continue;
    
    for (let subIdx = 0; subIdx < group.subgroups.length; subIdx++) {
      const subgroup = group.subgroups[subIdx];
      if (!subgroup || !Array.isArray(subgroup.quests)) continue;
      
      for (let questIdx = 0; questIdx < subgroup.quests.length; questIdx++) {
        const quest = subgroup.quests[questIdx];
        if (quest && quest.producesId && quest.producesId.toString() === questId) {
          return { quest, group, subgroup, groupIdx, subIdx, questIdx };
        }
        // Also check by quest name as fallback
        if (quest && quest.name && quest.name.toLowerCase().replace(/\s+/g, '-') === questId) {
          return { quest, group, subgroup, groupIdx, subIdx, questIdx };
        }
      }
    }
  }
  return null;
}

// Select and display a quest by its ID
function selectQuestById(questId, pushToHistory = true) {
  const result = findQuestById(questId);
  if (result) {
    const { quest, group, subgroup, groupIdx, subIdx } = result;
    
    // Expand the group and subgroup
    state.expandedGroups.add(groupIdx);
    state.expandedSubgroups.add(`${groupIdx}-${subIdx}`);
    
    // Select the quest (this will trigger rendering)
    // Pass pushToHistory to control whether we add to browser history
    if (window.selectQuest) {
      window.selectQuest(group, subgroup, quest, pushToHistory);
    }
    
    // Scroll to the quest after a short delay to allow rendering
    setTimeout(() => {
      const questElement = document.querySelector('.quest-item.active');
      if (questElement) {
        questElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }
}

// Expand tree nodes to reveal a specific quest
function expandTreeToQuest(questId) {
  const result = findQuestById(questId);
  if (result) {
    const { groupIdx, subIdx } = result;
    state.expandedGroups.add(groupIdx);
    state.expandedSubgroups.add(`${groupIdx}-${subIdx}`);
    render();
  }
}

// Highlight the active quest in the tree
function highlightActiveQuest(questId) {
  // The active class is already handled by quests.js
  // This is here for compatibility
  const result = findQuestById(questId);
  if (result) {
    const { quest } = result;
    state.selectedQuest = quest;
  }
}

// Select a quest from browser history (back/forward navigation)
function selectQuestFromHistory(questId) {
  if (!questId) {
    state.selectedQuest = null;
    render();
    return;
  }
  
  // Don't push to history - we're already navigating through history
  selectQuestById(questId, false);
}
// Select an item from browser history (back/forward navigation)
function selectItemFromHistory(itemId) {
  if (!itemId) {
    state.selectedItemId = null;
    render();
    return;
  }
  
  if (window.selectItemById) {
    window.selectItemById(itemId, false);
  }
}

// Select an autoloot slot from browser history (back/forward navigation)
function selectAutolootSlotFromHistory(slotNum) {
  if (!slotNum) {
    render();
    return;
  }
  
  if (window.selectAutolootSlot) {
    window.selectAutolootSlot(parseInt(slotNum), false);
  }
}

// Show copy feedback animation
function showCopyFeedback(selector) {
  const btn = document.querySelector(selector);
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('copied');
    }, 2000);
  }
}


function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);
  const dismiss = () => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };
  const timer = setTimeout(dismiss, duration);
  toast.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
}
window.showToast = showToast;

// ===== EVENT LISTENERS =====

document.addEventListener("DOMContentLoaded", () => {

  window.applySvgIcons?.();

  const logo = document.getElementById("osro-quests-logo");
  if (logo) {
        logo.title = `OSRO Quests v${VERSION} (${FLAVOR})`;
  }

  const versionTag = document.getElementById("header-version-tag");
  if (versionTag) {
        versionTag.textContent = `${FLAVOR}`;
  }

  const iInput = document.getElementById("itemSearchInput");
  if (iInput) {
    iInput.addEventListener("input", e => debouncedItemFilter(e.target.value));
  }

  const qInput = document.getElementById("questSearchInput");
  if (qInput) {
    qInput.addEventListener("input", e => debouncedQuestFilter(e.target.value));
  }

  const sInput = document.getElementById("shopSearchInput");
  if (sInput) {
    sInput.addEventListener("input", e => debouncedShopFilter(e.target.value));
  }
  
  // Handle browser back/forward buttons
  window.addEventListener('popstate', function(event) {
    if (event.state) {
      const { tab, questId, itemId, autolootSlot } = event.state;
      
      if (tab === 'values') {
        if (state.currentTab !== 'items') switchTab('items', false);
        if (typeof window.openValuesManager === 'function') window.openValuesManager(false);
      } else {
        if (tab && tab !== state.currentTab) {
          switchTab(tab, false);
        }
        if (tab === 'items' && typeof window.closeValuesManager === 'function') {
          window.closeValuesManager(false);
        }
      }
      
      if (questId) {
        selectQuestFromHistory(questId);
      } else if (itemId) {
        selectItemFromHistory(itemId);
      } else if (autolootSlot) {
        selectAutolootSlotFromHistory(autolootSlot);
      } else {
        state.selectedQuest = null;
        state.selectedItemId = null;
        render();
      }
    }
  });

  // START APPLICATION
  // Trigger initialization only after DOM is fully ready.
  initTheme();
  initSettings();
  initializeData();
  initSecretEditorToggle();
});

// ===== SHARED VIEWER HEADER =====

function renderViewerHeader(itemId, item, { meta = '', loc = '', showExtLinks = false, bound = false, listBadges = '' } = {}) {
  const icon48  = itemId ? renderItemIcon(itemId, 48) : '';
  const idBadge = itemId ? `<span class="qvh-id">#${itemId}</span>` : '';
  const slot    = item && Number(item.slot) > 0
    ? `<span class="qvh-item-slots">[${item.slot}]</span>` : '';
  const displayName = item ? (item.name || 'Unknown') : 'Unknown';
  const boundClass  = bound ? ' name-bound' : '';
  const name = itemId
    ? `<a class="item-link qvh-item-name${boundClass}" href="${itemUrl(itemId)}" onclick="event.preventDefault(); navigateToItem(${itemId})">${displayName}</a>${slot}`
    : `<span class="qvh-item-name qvh-item-name--none">No item produced</span>`;

  const metaRow = meta ? `<div class="qvh-meta">${meta}</div>` : '';

  // External links — opt-in per call site
  const extLinks = (showExtLinks && itemId) ? `
    <span class="qvh-ext-links">
    <a class="qvh-ext-link" href="https://ratemyserver.net/index.php?page=item_db&item_id=${itemId}&ird=1" target="_blank" rel="noopener">RateMyServer</a>
      <span class="qvh-loc-sep">·</span>
      <a class="qvh-ext-link" href="https://ro.kokotewa.com/db/itm_info?id=${itemId}" target="_blank" rel="noopener">Kokotewa</a>
      <span class="qvh-loc-sep">·</span>
      <a class="qvh-ext-link" href="https://pre.pservero.com/item/${itemId}" target="_blank" rel="noopener">rAthenaDB</a>
    </span>` : '';

  // Location breadcrumb + external links + list badges share the same row
  let bottomRow = '';
  if (loc || extLinks || listBadges) {
    const [locGroup, locSub] = loc ? loc.split(' / ') : ['', ''];
    const breadcrumb = loc
      ? `<span>${locGroup}</span><span class="qvh-loc-sep">›</span><span>${locSub}</span>`
      : '';
    const listBadgesHtml = listBadges ? `<span class="qvh-list-badges">${listBadges}</span>` : '';
    bottomRow = `<div class="qvh-loc">${breadcrumb}${extLinks}${listBadgesHtml}</div>`;
  }

  return `
    <div class="qvh">
      <div class="qvh-icon">${icon48}</div>
      <div class="qvh-body">
        <div class="qvh-title-row">${name}${idBadge}</div>
        ${metaRow}
        ${bottomRow}
      </div>
    </div>
  `;
}

window.renderViewerHeader = renderViewerHeader;


// ===== ITEM LISTS HELPERS =====

function getListsForItem(itemId) {
  if (!DATA.itemLists) return [];
  return DATA.itemLists
    .map((list, idx) => ({ idx, name: list.name, items: list.items }))
    .filter(l => l.items.includes(Number(itemId)));
}

function renderItemListBadges(itemId) {
  const lists = getListsForItem(itemId);
  if (!lists.length) return '';
  return lists.map(l =>
    `<a class="item-list-badge" href="?tab=items&il=${l.idx}" onclick="event.preventDefault(); navigateToItemList(${l.idx})" title="View list: ${escapeHtml(l.name)}">${escapeHtml(l.name)}</a>`
  ).join('');
}

function navigateToItemList(idx) {
  state.selectedItemList = idx;
  switchTab('items');
  if (typeof renderItems === 'function') renderItems();
  updateURL(null, null, true);
}

window.getListsForItem     = getListsForItem;
window.renderItemListBadges = renderItemListBadges;
window.navigateToItemList  = navigateToItemList;

// ===== SHARED USAGE LOOKUP & RENDERING =====

function findItemUsage(itemId) {
  const produces = [];
  const requires = [];

  if (Array.isArray(DATA.groups)) {
    DATA.groups.forEach((group, groupIdx) => {
      if (!group || !Array.isArray(group.subgroups)) return;
      group.subgroups.forEach((subgroup, subIdx) => {
        if (!subgroup || !Array.isArray(subgroup.quests)) return;
        subgroup.quests.forEach((quest, questIdx) => {
          if (!quest) return;
          if (quest.producesId === itemId)
            produces.push({ type: 'quest', quest, group, subgroup, groupIdx, subIdx, questIdx });
          if (Array.isArray(quest.requirements)) {
            quest.requirements.forEach(req => {
              const rid = req.type === 'item'   ? req.id
                        : req.type === 'gold'   ? SPECIAL_ITEMS?.GOLD
                        : req.type === 'credit' ? SPECIAL_ITEMS?.CREDIT : null;
              if (rid === itemId)
                requires.push({ type: 'quest', quest, group, subgroup, groupIdx, subIdx, questIdx, requirement: req });
            });
          }
        });
      });
    });
  }

  if (Array.isArray(DATA.shopGroups)) {
    DATA.shopGroups.forEach((group, groupIdx) => {
      if (!group || !Array.isArray(group.subgroups)) return;
      group.subgroups.forEach((subgroup, subIdx) => {
        if (!subgroup || !Array.isArray(subgroup.shops)) return;
        subgroup.shops.forEach((shop, shopIdx) => {
          if (!shop) return;
          if (shop.producesId === itemId)
            produces.push({ type: 'shop', shop, group, subgroup, groupIdx, subIdx, shopIdx });
          if (Array.isArray(shop.requirements)) {
            shop.requirements.forEach(req => {
              const rid = req.type === 'item'   ? req.id
                        : req.type === 'gold'   ? SPECIAL_ITEMS?.GOLD
                        : req.type === 'credit' ? SPECIAL_ITEMS?.CREDIT : null;
              if (rid === itemId)
                requires.push({ type: 'shop', shop, group, subgroup, groupIdx, subIdx, shopIdx, requirement: req });
            });
          }
        });
      });
    });
  }

  return { produces, requires };
}

function renderUsageSection(itemId, { excludeQuest = null, excludeShop = null } = {}) {
  if (!itemId) return '';
  const { produces, requires } = findItemUsage(itemId);

  const isSelf = u =>
    (u.type === 'quest' && u.quest === excludeQuest) ||
    (u.type === 'shop'  && u.shop  === excludeShop);

  const showProduces = (excludeQuest !== null || excludeShop !== null)
    ? produces.filter(u => !isSelf(u))
    : produces;

  if (showProduces.length === 0 && requires.length === 0) return '';

  function usageRow(u, amountStr) {
    const producesId = u.type === 'quest' ? u.quest.producesId : u.shop.producesId;
    const iconHtml = producesId ? renderItemIcon(producesId, 24) : '<span class="mat-xbtn-ph"></span>';
    const amtHtml = amountStr
      ? `<span class="mat-amt"><span class="mat-x">\u00d7</span>${amountStr}</span>` : '';
    if (u.type === 'quest') {
      return `
        <div class="mat-node">
          <div class="mat-row">
            ${iconHtml}
            <span class="mat-name"><a class="item-link tree-item-name" href="${questUrl(u.quest.producesId)}" onclick="event.preventDefault(); navigateToQuest(${u.groupIdx},${u.subIdx},${u.questIdx})">${u.quest.name}</a></span>
            ${renderItemIcon(3, 24)}
            ${amtHtml}
          </div>
          ${state.showLocation ? `<div class="mat-row-sub mat-row-sub--loc">${u.group.name} \u203a ${u.subgroup.name}</div>` : ''}
        </div>`;
    } else {
      return `
        <div class="mat-node">
          <div class="mat-row">
            ${iconHtml}
            <span class="mat-name"><a class="item-link tree-item-name" href="${shopUrl(u.shop.producesId)}" onclick="event.preventDefault(); navigateToShop(${u.groupIdx},${u.subIdx},${u.shopIdx})">${u.shop.name}</a></span>
            ${renderItemIcon(5, 24)}
            ${amtHtml}
          </div>
          ${state.showLocation ? `<div class="mat-row-sub mat-row-sub--loc">${u.group.name} \u203a ${u.subgroup.name}</div>` : ''}
        </div>`;
    }
  }

  let html = '<div class="usage-section">';

  if (showProduces.length > 0) {
    const label = (excludeQuest || excludeShop) ? 'Also Produced By' : 'Produced By';
    const pbVisible = state.sections.producedby;
    html += `<span class="item-label sec-label" onclick="toggleSection('producedby')">`
          + `<span class="sec-chevron${pbVisible ? '' : ' sec-chevron--closed'}">▾</span>${label}:</span>`;
    if (pbVisible) {
      html += `<div class="mat-tree">`;
      html += showProduces.map(u => usageRow(u, '')).join('');
      html += '</div>';
    }
  }

  if (requires.length > 0) {
    const rbVisible = state.sections.requiredby;
    html += `<span class="item-label sec-label" onclick="toggleSection('requiredby')">`
          + `<span class="sec-chevron${rbVisible ? '' : ' sec-chevron--closed'}">▾</span>Required By:</span>`;
    if (rbVisible) {
      html += `<div class="mat-tree">`;
      html += requires.map(u => {
        const amt = u.requirement?.amount
          ? (Number(u.requirement.amount) >= 1000
              ? Number(u.requirement.amount).toLocaleString()
              : String(u.requirement.amount))
          : '';
        return usageRow(u, amt);
      }).join('');
      html += '</div>';
    }
  }

  html += '</div>';
  return html;
}

window.findItemUsage      = findItemUsage;
window.renderUsageSection = renderUsageSection;


function questUrl(id) { return `?quest=${id}`; }
function shopUrl(id)  { return `?shop=${id}`; }
function itemUrl(id)  { return `?item=${id}`; }
window.questUrl = questUrl;
window.shopUrl  = shopUrl;
window.itemUrl  = itemUrl;

// ===== NOTIFICATIONS (optional) =====

function osroCanNotify() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

async function osroEnsureNotifyPermission() {
  if (!osroCanNotify()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch {
    return false;
  }
}

function osroFireNotification({ title, body = '', tag = '', url = '' }) {
  // Prefer browser notifications; fall back to in-app toast.
  if (osroCanNotify() && Notification.permission === 'granted') {
    try {
      const n = new Notification(title, { body, tag, renotify: false });
      if (url) {
        n.onclick = () => { window.focus(); window.location.href = url; };
      }
      return true;
    } catch { /* fall through */ }
  }
  if (typeof showToast === 'function') {
    showToast(body ? `${title} — ${body}` : title, 'info', 3500);
  }
  return false;
}

function osroNotifyReady({ section, body, tag, url = '' }) {
  osroFireNotification({ title: `OSRO Quests — ${section}`, body, tag, url });
}

// --- NEW CONSTANTS FOR WEB PUSH ---
// We will generate this key in the next step. It's safe to be public.
const VAPID_PUBLIC_KEY = "BAet8Vv5lUgSYaJPGzB25Ehhnze2yF7R541mIyyfEoiMmMbZne8t7ckmfiDnOFYUawtMcmmmznobySm8sh-r4zg"; 
const CLOUDFLARE_WORKER_URL = "https://osro-push-worker.osro-push-worker.workers.dev";

// --- SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/osro-quests-mr/sw.js').then(function(registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// Helper to convert VAPID string for the PushManager
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// --- UPDATED FOR DEBUGGING ---
async function osroEnsureNotifyPermission() {
  console.log("Checking permissions...");
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.error("Browser does not support notifications or SW.");
    return false;
  }

  let permission = Notification.permission;
  console.log("Current permission:", permission);
  
  if (permission !== 'granted') {
    permission = await Notification.requestPermission();
    console.log("Permission requested, result:", permission);
  }

  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log("No subscription found, subscribing...");
      const applicationServerKey = urlB64ToUint8Array(VAPID_PUBLIC_KEY);
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });
        localStorage.setItem('osro_push_sub', JSON.stringify(subscription));
        console.log("Subscribed successfully!");
      } catch (e) {
        console.error("Subscription failed:", e);
      }
    }
    return true;
  }
  return false;
}

async function osroScheduleCloudPush(timerId, delayInSeconds, payload) {
  // Always fetch the live subscription from the SW — localStorage can go stale
  // (expired subscription, SW re-registered, storage cleared during debugging, etc.)
  let subscription;
  try {
    const registration = await navigator.serviceWorker.ready;
    subscription = await registration.pushManager.getSubscription();
  } catch (e) {
    console.error("Could not get push subscription from SW:", e);
    return null;
  }

  if (!subscription) {
    console.error("No active push subscription — call osroEnsureNotifyPermission first.");
    return null;
  }

  console.log("Attempting to fetch:", `${CLOUDFLARE_WORKER_URL}/schedule`);
  
  try {
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        delay: delayInSeconds,
        payload: payload
      })
    });
    
    console.log("Worker response status:", response.status);
    const data = await response.json();
    console.log("Worker returned:", data);
    return data.messageId;
  } catch (err) {
    console.error("Fetch request FAILED (Check CORS or Worker URL):", err);
    return null;
  }
}

async function osroCancelCloudPush(messageId) {
  if (!messageId) return;
  try {
    await fetch(`${CLOUDFLARE_WORKER_URL}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId })
    });
  } catch (err) {
    console.error("Failed to cancel push:", err);
  }
}

// ===== PUBLIC API EXPOSURE =====

// Explicitly expose functions that may be called from HTML or other scripts
// This ensures compatibility even if loaded as a module
window.toggleSidebar = toggleSidebar;
window.isMobileSidebarMode = isMobileSidebarMode;
window.toggleEditorMode = toggleEditorMode;
window.switchTab = switchTab;
window.clearItemSearch = clearItemSearch;
window.clearQuestSearch = clearQuestSearch;
window.importItemValues = importItemValues;
window.resetItemValuesToDefaults = resetItemValuesToDefaults;
window.toggleValuesFilter = toggleValuesFilter;
window.exportQuests = exportQuests;
window.exportShops = exportShops;
window.exportValues = exportValues;
window.exportAll = exportAll;
window.saveData = saveData;
window.render = render;
window.toggleDescSearch = toggleDescSearch;
window.toggleTheme = toggleTheme;
window.osroCanNotify = osroCanNotify;
window.osroEnsureNotifyPermission = osroEnsureNotifyPermission;
window.osroFireNotification = osroFireNotification;
window.osroNotifyReady = osroNotifyReady;
window.osroNotifyTitle = section => `OSRO Quests (MR) - ${section}`;
