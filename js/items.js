// items.js - Item List and Detail Logic

// Search indices
let SEARCH_INDEX_NAME = {};
let SEARCH_INDEX_DESC = {};

// Debounced save for item values
let saveValueTimeout = null;

function debouncedSaveItemValues() {
  if (state?.valueSource !== 'custom') return;
  clearTimeout(saveValueTimeout);
  saveValueTimeout = setTimeout(() => {
    saveItemValuesToStorage();
  }, 500);
}

function renderItemsCore() {
  // Populate list select (idempotent)
  const listSel = document.getElementById('itemListSelect');
  if (listSel && DATA.itemLists) {
    const currentVal = listSel.value;
    // Only rebuild if options are stale
    if (listSel.options.length !== DATA.itemLists.length + 1) {
      listSel.innerHTML = '<option value="-1">All Items</option>';
      DATA.itemLists.forEach((list, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = list.name;
        listSel.appendChild(opt);
      });
    }
    listSel.value = state.selectedItemList >= 0 ? String(state.selectedItemList) : '-1';
  }

  const container = document.getElementById("itemsList");
  
  if (!container) {
    console.warn('[renderItems] Container element not found');
    return;
  }

  // 1. Identify used items
  const usedItemIds = new Set();
  
  // 1a. Add items from Quests
  if (Array.isArray(DATA.groups)) {
    DATA.groups.forEach((group) => {
      if (!group || !Array.isArray(group.subgroups)) return;
      
      group.subgroups.forEach((subgroup) => {
        if (!subgroup || !Array.isArray(subgroup.quests)) return;
        
        subgroup.quests.forEach((quest) => {
          if (!quest) return;
          
          if (quest.producesId) usedItemIds.add(Number(quest.producesId));

          if (Array.isArray(quest.requirements)) {
            quest.requirements.forEach((req) => {
              if (!req) return;
              
              if (req.type === "item" && req.id) {
                usedItemIds.add(Number(req.id));
              }
              if (req.type === "gold" && typeof SPECIAL_ITEMS !== 'undefined') {
                usedItemIds.add(SPECIAL_ITEMS.GOLD);
              }
              if (req.type === "credit" && typeof SPECIAL_ITEMS !== 'undefined') {
                usedItemIds.add(SPECIAL_ITEMS.CREDIT);
              }
            });
          }
        });
      });
    });
  }

  // 1b. Add items from Shops
  if (Array.isArray(DATA.shopGroups)) {
    DATA.shopGroups.forEach((group) => {
      if (!group || !Array.isArray(group.subgroups)) return;
      
      group.subgroups.forEach((subgroup) => {
        if (!subgroup || !Array.isArray(subgroup.shops)) return;
        
        subgroup.shops.forEach((shop) => {
          if (!shop) return;
          
          if (shop.producesId) usedItemIds.add(Number(shop.producesId));

          if (Array.isArray(shop.requirements)) {
            shop.requirements.forEach((req) => {
              if (!req) return;
              
              if (req.type === "item" && req.id) {
                usedItemIds.add(Number(req.id));
              }
              if (req.type === "gold" && typeof SPECIAL_ITEMS !== 'undefined') {
                usedItemIds.add(SPECIAL_ITEMS.GOLD);
              }
              if (req.type === "credit" && typeof SPECIAL_ITEMS !== 'undefined') {
                usedItemIds.add(SPECIAL_ITEMS.CREDIT);
              }
            });
          }
        });
      });
    });
  }

  // 1c. Add autoloot items
  if (state.autolootData) {
    Object.values(state.autolootData).forEach((autolootList) => {
      if (Array.isArray(autolootList)) {
        autolootList.forEach((itemId) => {
          usedItemIds.add(Number(itemId));
        });
      }
    });
  }

  // 1d. Add NEW items (treat them as "used" so they appear in the main list)
  if (DATA.newItemIds) {
    DATA.newItemIds.forEach((id) => {
      usedItemIds.add(Number(id));
    });
  }

  // 1e. Add items from saved lists
  if (Array.isArray(DATA.itemLists)) {
    DATA.itemLists.forEach(list => {
      if (Array.isArray(list.items)) {
        list.items.forEach(id => usedItemIds.add(Number(id)));
      }
    });
  }

  // 2. Filter items
  // If a list is selected, show exactly those items regardless of showAllItems.
  // Otherwise: showAllItems = everything, default = usedItemIds whitelist.
  let items;
  if (state.selectedItemList >= 0 && DATA.itemLists?.[state.selectedItemList]) {
    const listIds = new Set(DATA.itemLists[state.selectedItemList].items.map(Number));
    items = getAllItems().filter(item => listIds.has(item.id));
  } else {
    items = state.showAllItems
      ? getAllItems()
      : getAllItems().filter((item) => usedItemIds.has(item.id));
  }

  // Apply value filter
  if (state.showValuesOnly) {
    items = items.filter((item) => (item.value || 0) > 0);
  }

  // Apply "New Only" filter
  // If checked, we restrict the list to ONLY new items.
  if (state.showNewItemsOnly) {
    items = items.filter((item) => DATA.newItemIds.has(item.id));
  }

  // 3. Apply Search
  if (state.itemSearchFilter) {
    const q = state.itemSearchFilter.trim();
    
    // Helper function to strip color codes (^RRGGBB format)
    const stripColorCodes = (text) => {
      if (!text) return '';
      return text.replace(/\^[0-9A-Fa-f]{6}/g, '');
    };
    
    if (/^\d+$/.test(q)) {
      items = items.filter(item => 
        item.id.toString().includes(q)
      );
    } else {
      const includePhrases = [];
      const includeWords = [];
      const excludePhrases = [];
      const excludeWords = [];
      
      // Extract quoted phrases (both include and exclude)
      let remaining = q.replace(/-?"([^"]+)"/g, (match, phrase) => {
        if (match.startsWith('-')) {
          excludePhrases.push(phrase.toLowerCase());
        } else {
          includePhrases.push(phrase.toLowerCase());
        }
        return '';
      });
      
      // Process remaining words
      remaining.split(/\s+/).forEach(word => {
        if (word.length > 0) {
          if (word.startsWith('-') && word.length > 1) {
            excludeWords.push(word.substring(1).toLowerCase());
          } else if (!word.startsWith('-')) {
            includeWords.push(word.toLowerCase());
          }
        }
      });
      
      // For regular words, use index matching
      const includeMatchSets = includeWords.map(word => {
        const matchingIds = new Set();
        // Strip punctuation from word for index lookup
        const cleanWord = word.replace(/[^\w]/g, '');
        
        Object.keys(SEARCH_INDEX_NAME).forEach(indexTerm => {
          if (indexTerm.includes(cleanWord)) {
            SEARCH_INDEX_NAME[indexTerm].forEach(id => matchingIds.add(id));
          }
        });
        
        if (state.searchDescriptions) {
          Object.keys(SEARCH_INDEX_DESC).forEach(indexTerm => {
            if (indexTerm.includes(cleanWord)) {
              SEARCH_INDEX_DESC[indexTerm].forEach(id => matchingIds.add(id));
            }
          });
        }
        
        return matchingIds;
      });
      
      // For phrases, get candidates using all words, then verify exact phrase
      const includePhraseMatchSets = includePhrases.map(phrase => {
        const matchingIds = new Set();
        const phraseWords = phrase.split(/\s+/);
        
        // Get candidates that contain all words
        const wordSets = phraseWords.map(word => {
          const wordIds = new Set();
          // Strip punctuation from word for index lookup
          const cleanWord = word.replace(/[^\w]/g, '');
          
          Object.keys(SEARCH_INDEX_NAME).forEach(indexTerm => {
            if (indexTerm.includes(cleanWord)) {
              SEARCH_INDEX_NAME[indexTerm].forEach(id => wordIds.add(id));
            }
          });
          
          if (state.searchDescriptions) {
            Object.keys(SEARCH_INDEX_DESC).forEach(indexTerm => {
              if (indexTerm.includes(cleanWord)) {
                SEARCH_INDEX_DESC[indexTerm].forEach(id => wordIds.add(id));
              }
            });
          }
          
          return wordIds;
        });
        
        // Get items that have all words (candidates)
        const candidates = Array.from(wordSets[0] || []).filter(id =>
          wordSets.every(set => set.has(id))
        );
        
        // Verify exact phrase in name or description
        candidates.forEach(id => {
          const item = DATA.items[id];
          if (!item) return;
          
          const itemName = stripColorCodes(item.name || '').toLowerCase();
          const itemDesc = stripColorCodes(item.desc || '').toLowerCase();
          const nameMatch = itemName.includes(phrase);
          const descMatch = state.searchDescriptions && itemDesc.includes(phrase);
          
          if (nameMatch || descMatch) {
            matchingIds.add(id);
          }
        });
        
        return matchingIds;
      });
      
      const allIncludeMatchSets = [...includeMatchSets, ...includePhraseMatchSets];
      
      // For exclude terms, also handle phrases and words separately
      const excludeIds = new Set();
      
      // Exclude words
      excludeWords.forEach(word => {
        // Strip punctuation from word for index lookup
        const cleanWord = word.replace(/[^\w]/g, '');
        
        Object.keys(SEARCH_INDEX_NAME).forEach(indexTerm => {
          if (indexTerm.includes(cleanWord)) {
            SEARCH_INDEX_NAME[indexTerm].forEach(id => excludeIds.add(id));
          }
        });
        
        if (state.searchDescriptions) {
          Object.keys(SEARCH_INDEX_DESC).forEach(indexTerm => {
            if (indexTerm.includes(cleanWord)) {
              SEARCH_INDEX_DESC[indexTerm].forEach(id => excludeIds.add(id));
            }
          });
        }
      });
      
      // Exclude phrases (exact match)
      excludePhrases.forEach(phrase => {
        const phraseWords = phrase.split(/\s+/);
        
        // Get candidates
        const wordSets = phraseWords.map(word => {
          const wordIds = new Set();
          // Strip punctuation from word for index lookup
          const cleanWord = word.replace(/[^\w]/g, '');
          
          Object.keys(SEARCH_INDEX_NAME).forEach(indexTerm => {
            if (indexTerm.includes(cleanWord)) {
              SEARCH_INDEX_NAME[indexTerm].forEach(id => wordIds.add(id));
            }
          });
          
          if (state.searchDescriptions) {
            Object.keys(SEARCH_INDEX_DESC).forEach(indexTerm => {
              if (indexTerm.includes(cleanWord)) {
                SEARCH_INDEX_DESC[indexTerm].forEach(id => wordIds.add(id));
              }
            });
          }
          
          return wordIds;
        });
        
        const candidates = Array.from(wordSets[0] || []).filter(id =>
          wordSets.every(set => set.has(id))
        );
        
        // Verify exact phrase
        candidates.forEach(id => {
          const item = DATA.items[id];
          if (!item) return;
          
          const itemName = stripColorCodes(item.name || '').toLowerCase();
          const itemDesc = stripColorCodes(item.desc || '').toLowerCase();
          const nameMatch = itemName.includes(phrase);
          const descMatch = state.searchDescriptions && itemDesc.includes(phrase);
          
          if (nameMatch || descMatch) {
            excludeIds.add(id);
          }
        });
      });
      
      // Filter: must match all include terms AND match no exclude terms
      items = items.filter(item => {
        const matchesAllIncludes = allIncludeMatchSets.length === 0 || 
          allIncludeMatchSets.every(matchSet => matchSet.has(item.id));
        const matchesNoExcludes = !excludeIds.has(item.id);
        return matchesAllIncludes && matchesNoExcludes;
      });
    }
  }

  // 4. Render
  const totalFound = items.length;
  const limit = 4000;
  const displayedItems = items.slice(0, limit);

  let html = "";

  if (totalFound > 0) {
    html += `<div class="items-search-banner">
               ${displayedItems.length}${totalFound > limit ? `/${totalFound}` : ''} items
             </div>`;
  }

  if (items.length === 0) {
    html = `<div class="empty-msg-centered">
              No used items found ${state.itemSearchFilter ? "matching your search" : ""}
            </div>`;
  } else {
    html += displayedItems
      .map(
        (item) => `
      <div class="item-row ${state.selectedItemId === item.id ? "active" : ""}"
          onclick="selectItem(${item.id})">
        <div class="item-row-header">
          ${renderItemIcon(item.id)}
          <span style="margin-left: 8px;">${getItemDisplayName(item) || "&lt;unnamed&gt;"}</span>
          <span class="item-row-id">#${item.id}</span>
          ${DATA.newItemIds.has(item.id) ? '<span class="new-item-badge">NEW</span>' : ''}
        </div>
      </div>
    `,
      )
      .join("");
    
    if (totalFound > limit) {
      html += `<div class="items-limit-msg">Showing first ${limit} of ${totalFound} items. Use search to narrow results.</div>`;
    }
  }

  container.innerHTML = html;
}

function selectItem(id, pushToHistory = true) {
  if (valuesManagerState?.open) closeValuesManager(false);
  state.selectedItemId = id;
  
  // Update URL with item ID for sharing and browser history
  if (id && typeof updateURL === 'function') {
    updateURL(id.toString(), 'item', pushToHistory);
  }
  
  renderItems();
  renderItemContent();
  if (window.isMobileSidebarMode && window.isMobileSidebarMode()) toggleSidebar();
}

// Select an item by ID (for URL navigation)
function selectItemById(itemId, pushToHistory = true) {
  const id = parseInt(itemId);
  if (DATA.items[id]) {
    selectItem(id, pushToHistory);
    
    // Scroll to item in sidebar after a short delay
    setTimeout(() => {
      const itemElement = document.querySelector('.item-row.active');
      if (itemElement) {
        itemElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }
}

function highlightSearchTerm(text, searchQuery) {
  if (!searchQuery || !text) return text;

  const phrases = [];
  const words = [];

  // Extract quoted phrases (but not those prefixed with -)
  let remaining = searchQuery.replace(/-?"([^"]+)"/g, (match, phrase) => {
    if (!match.startsWith('-')) phrases.push(phrase);
    return '';
  });

  // Extract words (but not those prefixed with -)
  remaining.split(/\s+/).forEach(word => {
    if (word.length > 0 && !word.startsWith('-')) words.push(word);
  });

  if (phrases.length === 0 && words.length === 0) return text;

  const escRe = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Phrases first (higher priority), then words — all in ONE pass.
  // (<[^>]*>) matches any HTML tag and skips it unchanged, so the
  // highlighter never fires inside a tag name or attribute value.
  const termPatterns = [...phrases, ...words].map(escRe);
  const combined = new RegExp(`(<[^>]*>)|(${termPatterns.join('|')})`, 'gi');

  return text.replace(combined, (match, tag, term) => {
    if (tag) return tag; // preserve HTML tags unchanged
    return `<span class="search-highlight">${term}</span>`;
  });
}

function renderItemViewerHeader(id, item, { showExtLinks = true, listBadges = null } = {}) {
  const resolvedListBadges = listBadges ?? (typeof renderItemListBadges === "function" ? renderItemListBadges(id) : "");
  // Items tab: name may have search highlights — override display inline
  const displayName = state.itemSearchFilter
    ? highlightSearchTerm(getItemDisplayName(item), state.itemSearchFilter)
    : (getItemDisplayName(item) || 'Unknown');
  // Patch item so renderViewerHeader picks up the highlighted name
  const itemProxy = { ...item, name: displayName };

  const isNew    = DATA.newItemIds && DATA.newItemIds.has(id);
  const newBadge = isNew ? `<span class="qvh-rate qvh-rate--full">NEW</span>` : '';
  const valBadge = item.value > 0
    ? `<span class="qvh-bound">${formatZenyCompact(item.value)} zeny</span>`
    : '';

  return renderViewerHeader(id, itemProxy, {
    meta: newBadge + valBadge,
    showExtLinks: true,
    listBadges: resolvedListBadges
  });
}

function renderItemContentCore() {
  const container = document.getElementById("mainContent");
  
  if (!container) {
    console.warn('[renderItemContent] Container element not found');
    return;
  }

  if (state.selectedItemId == null) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>No Item Selected</h2>
        <p>Select an item from the sidebar</p>
      </div>
    `;
    return;
  }

  const id = state.selectedItemId;
  const item = DATA.items[id];

  if (!item) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Item Not Found</h2>
        <p>The selected item no longer exists.</p>
      </div>
    `;
    return;
  }

  const descriptionHtml = parseDescription(item.desc);

  container.innerHTML = `
    <div class="editor-item">

      ${renderItemViewerHeader(id, item)}

      <div class="panel-section">
        ${descriptionHtml ? `
          <span class="item-label">Description:</span>
          <div class="item-description-box">${
            state.itemSearchFilter && state.searchDescriptions
              ? highlightSearchTerm(descriptionHtml, state.itemSearchFilter)
              : descriptionHtml
          }</div>` : ""}
      </div>

      ${renderUsageSection(id)}

    </div>
  `;
}

function updateItemValue(id, value) {
  if (state?.valueSource !== 'custom') {
    if (typeof showToast === 'function') showToast('Values are read-only (Default). Enable Custom values in Settings to edit.', 'info', 3500);
    return;
  }
  if (DATA.items[id]) {
    if (window.initState) {
      window.initState.userHasEditedValues = true;
    }
    
    DATA.items[id].value = Number(value) || 0;
    debouncedSaveItemValues(); // Changed from immediate save
  }
}


function toggleNewItemsFilter(checked) {
  state.showNewItemsOnly = checked;
  renderItems();
}



// items.js - Navigation Logic Fix

function navigateToItem(itemId) {
  const id = parseInt(itemId);

  // 1. Switch to items tab if not already there.
  // We pass 'false' to suppress the default URL update (e.g., ?tab=items),
  // because we are about to set a more specific URL (e.g., ?item=123).
  if (state.currentTab !== "items") {
    switchTab("items", false);
  }

  // 2. Use the robust selection functions
  // If the item exists in our data, use selectItemById (handles scrolling & URL).
  // If not, use selectItem directly to show the "Item Not Found" state with the ID.
  if (DATA.items[id]) {
    selectItemById(id);
  } else {
    selectItem(id);
  }
}

// ===== ERROR-WRAPPED RENDER FUNCTIONS =====

// Wrap render functions with error boundaries and data validation
window.renderItems = withErrorBoundary(
  withDataValidation(renderItemsCore, 'renderItems', ['DATA.items', 'DATA.groups']),
  'renderItems'
);

window.renderItemContent = withErrorBoundary(
  withDataValidation(renderItemContentCore, 'renderItemContent', ['DATA.items']),
  'renderItemContent'
);

// ===== EXPOSE FUNCTIONS CALLED FROM HTML =====

// These functions are called from inline HTML event handlers (onclick, onchange)
// and must be globally accessible on the window object
window.selectItem = selectItem;
window.selectItemById = selectItemById;
window.updateItemValue = updateItemValue;
window.navigateToItem = navigateToItem;
window.toggleNewItemsFilter = toggleNewItemsFilter;

function selectItemList(idx) {
  state.selectedItemList = parseInt(idx);
  renderItems();
  updateURL(null, null, true);
}
window.selectItemList = selectItemList;

window.SEARCH_INDEX_NAME = SEARCH_INDEX_NAME;
window.SEARCH_INDEX_DESC = SEARCH_INDEX_DESC;

// ===== VALUES MANAGER PANE =====

const valuesManagerState = {
  open: false,
  mode: 'zeny', // 'zeny' | 'credit'
  source: 'default', // 'default' | 'custom'
  sortKey: 'name', // 'name' | 'id' | 'value'
  sortDir: 'asc',  // 'asc' | 'desc'
  initDone: false,
  tracked: new Set(), // keeps rows visible even when value == 0
  searchDebounce: null,
  nameFilter: '',
};

function loadValuesManagerConfig() {
  let cfg = {};
  if (typeof loadConfig === 'function') {
    cfg = loadConfig() || {};
  } else {
    try { cfg = JSON.parse(localStorage.getItem(LOCAL_STORAGE.config)) || {}; } catch { cfg = {}; }
  }

  const vm = cfg.valuesManager || {};
  const mode = vm.mode === 'credit' ? 'credit' : 'zeny';
  const trackedIds = Array.isArray(vm.trackedIds)
    ? vm.trackedIds
    : (Array.isArray(vm.pinnedIds) ? vm.pinnedIds : []); // legacy support

  const sortKey = (vm.sortKey === 'id' || vm.sortKey === 'value') ? vm.sortKey : 'name';
  const sortDir = vm.sortDir === 'desc' ? 'desc' : 'asc';

  valuesManagerState.source = (vm.source === 'custom') ? 'custom' : 'default';
  valuesManagerState.mode = mode;
  valuesManagerState.sortKey = sortKey;
  valuesManagerState.sortDir = sortDir;
  valuesManagerState.tracked = new Set(
    trackedIds.map(n => Number(n)).filter(n => Number.isFinite(n))
  );
}

function saveValuesManagerConfig(patch) {
  let cfg = {};
  if (typeof loadConfig === 'function') {
    cfg = loadConfig() || {};
  } else {
    try { cfg = JSON.parse(localStorage.getItem(LOCAL_STORAGE.config)) || {}; } catch { cfg = {}; }
  }

  const current = cfg.valuesManager || {};
  const next = { ...current, ...patch };
  // Always persist current source
  if (!('source' in patch)) next.source = valuesManagerState.source;

  if (typeof saveConfig === 'function') {
    saveConfig({ valuesManager: next });
  } else {
    try {
      localStorage.setItem(LOCAL_STORAGE.config, JSON.stringify({ ...cfg, valuesManager: next }));
    } catch {
      // ignore storage failures
    }
  }
}

function ensureValuesManagerInit() {
  if (valuesManagerState.initDone) return;
  valuesManagerState.initDone = true;

  const input = document.getElementById('valuesManagerAddInput');
  const results = document.getElementById('valuesManagerAddResults');
  if (!input || !results) return;

  const hideResults = () => {
    results.classList.add('hidden');
    results.innerHTML = '';
  };

  input.addEventListener('input', () => {
    clearTimeout(valuesManagerState.searchDebounce);
    valuesManagerState.searchDebounce = setTimeout(() => {
      renderValuesManagerAddResults(input.value);
    }, 80);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      hideResults();
    }
  });

  // Click-away to close the add results dropdown
  document.addEventListener('click', (e) => {
    const pane = document.getElementById('valuesManagerPane');
    if (!pane) return;
    if (!pane.contains(e.target)) hideResults();
  });
}

function openValuesManager(pushToHistory = true) {
  // Mobile: this is a button action, so always close sidebar even if already open
  if (window.isMobileSidebarMode && window.isMobileSidebarMode() && typeof toggleSidebar === 'function') {
    const sb = document.getElementById('sidebar');
    if (sb && sb.classList.contains('open')) toggleSidebar();
  }

  if (valuesManagerState.open) return;
  valuesManagerState.open = true;

  loadValuesManagerConfig();
  ensureValuesManagerInit();
  const pane = document.getElementById('valuesManagerPane');
  if (pane) {
    pane.classList.remove('hidden');
    pane.setAttribute('aria-hidden', 'false');
  }

  setValuesManagerMode(valuesManagerState.mode || 'zeny');
  syncValuesManagerSortUI();
  syncValuesManagerSource();
  syncValuesManagerNotice();
  renderValuesManager();

  if (typeof updateURL === 'function') {
    updateURL(null, null, pushToHistory);
  }
}

function closeValuesManager(pushToHistory = true) {
  const wasOpen = valuesManagerState.open;
  if (!wasOpen) return;

  valuesManagerState.open = false;
  const pane = document.getElementById('valuesManagerPane');
  if (pane) {
    pane.classList.add('hidden');
    pane.setAttribute('aria-hidden', 'true');
  }

  const results = document.getElementById('valuesManagerAddResults');
  if (results) {
    results.classList.add('hidden');
    results.innerHTML = '';
  }

  if (typeof updateURL === 'function' && pushToHistory) {
    updateURL(null, null, true);
  }
}

function setValuesManagerMode(mode) {
  valuesManagerState.mode = mode === 'credit' ? 'credit' : 'zeny';
  saveValuesManagerConfig({
    mode: valuesManagerState.mode,
    trackedIds: Array.from(valuesManagerState.tracked),
    sortKey: valuesManagerState.sortKey,
    sortDir: valuesManagerState.sortDir,
  });

  const btnZ = document.getElementById('vmgrModeZeny');
  const btnC = document.getElementById('vmgrModeCredit');
  if (btnZ && btnC) {
    btnZ.classList.toggle('sec-btn--off', valuesManagerState.mode !== 'zeny');
    btnC.classList.toggle('sec-btn--off', valuesManagerState.mode !== 'credit');
  }

  syncValuesManagerNotice();
  if (valuesManagerState.open) renderValuesManager();
}

function setValuesManagerSource(src) {
  const isCustom = src === 'custom';
  valuesManagerState.source = isCustom ? 'custom' : 'default';

  // Persist
  saveValuesManagerConfig({ source: valuesManagerState.source });

  // Also update global state & config so loadItemValuesFromStorage re-runs correctly
  if (typeof saveConfig === 'function') saveConfig({ valueSource: valuesManagerState.source });
  if (typeof state !== 'undefined') state.valueSource = valuesManagerState.source;

  // Reload values for the new mode
  if (isCustom) {
    // Switch to custom: load from localStorage (or remote if none)
    const stored = localStorage.getItem(LOCAL_STORAGE.item_values);
    if (stored) {
      try {
        const values = JSON.parse(stored);
        if (typeof applyItemValues === 'function') applyItemValues(values);
      } catch {}
    }
  } else {
    // Switch to default: reload from remote without saving to localStorage
    if (typeof loadDefaultValuesIntoView === 'function') loadDefaultValuesIntoView();
    else if (typeof fetchJSON === 'function') {
      fetchJSON(AUTO_IMPORT_URLS.values).then(v => {
        if (v && typeof applyItemValues === 'function') applyItemValues(v);
        renderValuesManager();
      });
    }
  }

  syncValuesManagerSource();
  syncValuesManagerControlsVisibility();
  renderValuesManager();
}

function syncValuesManagerSource() {
  const isCustom = valuesManagerState.source === 'custom';
  const dBtn = document.getElementById('vmgrSrcDefault');
  const cBtn = document.getElementById('vmgrSrcCustom');
  if (dBtn) dBtn.classList.toggle('sec-btn--off', isCustom);
  if (cBtn) cBtn.classList.toggle('sec-btn--off', !isCustom);
}

function syncValuesManagerControlsVisibility() {
  const isCustom = valuesManagerState.source === 'custom';
  // Controls that only appear in custom mode
  const customOnly = document.querySelectorAll('.vmgr-custom-only');
  customOnly.forEach(el => el.classList.toggle('hidden', !isCustom));
  // Controls that only appear in default mode
  const defaultOnly = document.querySelectorAll('.vmgr-default-only');
  defaultOnly.forEach(el => el.classList.toggle('hidden', isCustom));
  // Add-item input row
  const addRow = document.getElementById('valuesManagerAddRow');
  if (addRow) addRow.classList.toggle('hidden', !isCustom);
}

function setValuesManagerNameFilter(val) {
  valuesManagerState.nameFilter = val;
  renderValuesManager();
}

function clearValuesManagerNameFilter() {
  valuesManagerState.nameFilter = '';
  const input = document.getElementById('vmgrNameFilter');
  if (input) input.value = '';
  renderValuesManager();
}

window.setValuesManagerNameFilter  = setValuesManagerNameFilter;
window.clearValuesManagerNameFilter = clearValuesManagerNameFilter;

function renderValuesManager() {
  const list = document.getElementById('valuesManagerList');
  if (!list) return;

  syncValuesManagerControlsVisibility();
  const activeSet = valuesManagerState.tracked;
  const mode = valuesManagerState.mode;

  // Always show items that already have a value, plus anything the user added.
  const ids = new Set(activeSet);
  Object.entries(DATA.items || {}).forEach(([id, item]) => {
    const n = Number(id);
    if (!item) return;
    if ((item.value || 0) > 0) ids.add(n);
  });

  const idArr = Array.from(ids).filter((id) => DATA.items && DATA.items[id]);

  if (idArr.length === 0) {
    list.innerHTML = `<div class="values-manager-empty">No values yet. Add an item above to start.</div>`;
    return;
  }

  // Stable sort: user-selected primary, then name asc, then id asc
  idArr.sort((a, b) => {
    const av = Number(DATA.items[a]?.value || 0);
    const bv = Number(DATA.items[b]?.value || 0);
    const an = (getItemDisplayName(DATA.items[a]) || '').toLowerCase();
    const bn = (getItemDisplayName(DATA.items[b]) || '').toLowerCase();

    const dir = valuesManagerState.sortDir === 'desc' ? -1 : 1;
    const key = valuesManagerState.sortKey || 'name';

    if (key === 'value') {
      if (av !== bv) return (av - bv) * dir;
    } else if (key === 'id') {
      if (a !== b) return (a - b) * dir;
    } else {
      if (an < bn) return -1 * dir;
      if (an > bn) return 1 * dir;
    }

    if (an < bn) return -1;
    if (an > bn) return 1;
    return a - b;
  });

  // Filter by name
  const nf = valuesManagerState.nameFilter.trim().toLowerCase();
  const filtered = nf
    ? idArr.filter(id => (getItemDisplayName(DATA.items[id]) || '').toLowerCase().includes(nf))
    : idArr;

  if (filtered.length === 0 && nf) {
    list.innerHTML = `<div class="values-manager-empty">No items match "<em>${escapeHtml(nf)}</em>".</div>`;
    return;
  }

  list.innerHTML = filtered.map((id) => renderValuesManagerRow(id, DATA.items[id], mode)).join('');
}

function renderValuesManagerRow(id, item, mode) {
  const name = getItemDisplayName(item) || '<unnamed>';
  const isCreditItem = typeof SPECIAL_ITEMS !== 'undefined' && id === SPECIAL_ITEMS.CREDIT;
  const creditZeny = (typeof getCreditValue === 'function') ? getCreditValue() : 0;

  let label = 'Zeny';
  let shown = Number(item.value || 0);
  let inputStep = '1';

  if (mode === 'credit' && !isCreditItem) {
    label = 'Credit';
    inputStep = '0.01';
    shown = creditZeny > 0 ? (Number(item.value || 0) / creditZeny) : 0;
  } else if (mode === 'credit' && isCreditItem) {
    label = 'Zeny&nbsp;&nbsp;';
    shown = Number(item.value || 0);
  }

  const safeShown = Number.isFinite(shown) ? shown : 0;
  const valueText = Number(item.value || 0) > 0 ? `${formatZenyCompact(Number(item.value || 0))} zeny` : '0 zeny';
  const disableCreditEdit = (mode === 'credit' && isCreditItem);
  const inputDisabledAttr = disableCreditEdit ? 'disabled' : '';
  const inputTitle = disableCreditEdit ? 'Disabled in Credits mode' : '';

  const isDefault = valuesManagerState.source === 'default';
  const nameCell = isDefault
    ? `<button class="values-manager-name-link" onclick="valuesManagerOpenItem(${id})" title="Open item page">${escapeHtml(name)}</button>`
    : `<div class="values-manager-row-name">${escapeHtml(name)}</div>`;

  const formatCreditsForDisplay = (num) => {
    const n = Number(num);
    if (!Number.isFinite(n)) return '0';
    // Keep up to 4 decimals, but hide trailing zeros (e.g. 3.0000 -> 3, 0.0124 -> 0.0124)
    return n.toFixed(4).replace(/\.?0+$/, '');
  };

  const valueCell = isDefault
    ? `<span class="values-manager-value-readonly">${mode === 'credit' && !isCreditItem ? formatCreditsForDisplay(safeShown) : Math.round(safeShown).toLocaleString()} <span class="values-manager-value-unit">${label.toLowerCase()}</span></span>`
    : `<input
        class="values-manager-value-input"
        type="number"
        step="${inputStep}"
        inputmode="decimal"
        value="${mode === 'credit' && !isCreditItem ? safeShown : Math.round(safeShown)}"
        onchange="updateValuesManagerValue(${id}, this.value)"
        placeholder="0"
        ${inputDisabledAttr}
        title="${inputTitle}"
        aria-label="${label} value for ${escapeHtml(name)}"
      />`;

  const actionsCell = isDefault
    ? ``
    : `<div class="values-manager-row-actions">
         <button class="btn btn-sm btn-icon" onclick="valuesManagerOpenItem(${id})" title="Open item page" aria-label="Open item page">
          ${window.SVG_ICONS?.openItem || ''}
         </button>
         <button class="btn btn-sm btn-danger btn-icon" onclick="deleteValuesManagerItem(${id})" title="Delete value" aria-label="Delete value">
          ${window.SVG_ICONS?.trash14 || ''}
         </button>
       </div>`;

  return `
    <div class="values-manager-row${isDefault ? ' values-manager-row--readonly' : ''}">
      ${renderItemIcon(id, 24)}
      <div class="values-manager-row-main">
        ${nameCell}
        <div class="values-manager-row-sub" title="${escapeHtml(valueText)}">#${id}</div>
      </div>
      ${valueCell}
      ${actionsCell}
    </div>
  `;
}

function valuesManagerOpenItem(id) {
  closeValuesManager(false);
  navigateToItem(id);
}

function addToValuesManager(id) {
  valuesManagerState.tracked.add(Number(id));
  saveValuesManagerConfig({
    mode: valuesManagerState.mode,
    trackedIds: Array.from(valuesManagerState.tracked),
    sortKey: valuesManagerState.sortKey,
    sortDir: valuesManagerState.sortDir,
  });
  renderValuesManager();
}

function updateValuesManagerValue(id, raw) {
  const itemId = Number(id);
  const v = Number(raw);
  if (!Number.isFinite(v) || v < 0) return;

  const isCreditItem = typeof SPECIAL_ITEMS !== 'undefined' && itemId === SPECIAL_ITEMS.CREDIT;
  if (valuesManagerState.mode === 'credit' && isCreditItem) return;

  let zenyValue = v;
  if (valuesManagerState.mode === 'credit' && !isCreditItem) {
    const creditZeny = (typeof getCreditValue === 'function') ? getCreditValue() : 0;
    zenyValue = creditZeny > 0 ? Math.round(v * creditZeny) : 0;
  } else {
    zenyValue = Math.round(v);
  }

  addToValuesManager(itemId);
  updateItemValue(itemId, zenyValue);
  renderValuesManager();

  // Keep item view in sync if open
  if (state.currentTab === 'items' && state.selectedItemId === itemId && typeof renderItemContent === 'function') {
    renderItemContent();
  }
}

function deleteValuesManagerItem(id) {
  const itemId = Number(id);
  const item = DATA.items?.[itemId];
  const name = item ? (getItemDisplayName(item) || `#${itemId}`) : `#${itemId}`;

  const ok = window.confirm(`Delete value for ${name}? This sets it to 0.`);
  if (!ok) return;

  valuesManagerState.tracked.delete(itemId);
  saveValuesManagerConfig({
    mode: valuesManagerState.mode,
    trackedIds: Array.from(valuesManagerState.tracked),
    sortKey: valuesManagerState.sortKey,
    sortDir: valuesManagerState.sortDir,
  });

  updateItemValue(itemId, 0);
  renderValuesManager();

  if (state.currentTab === 'items' && state.selectedItemId === itemId && typeof renderItemContent === 'function') {
    renderItemContent();
  }
}

function renderValuesManagerAddResults(query) {
  const results = document.getElementById('valuesManagerAddResults');
  if (!results) return;

  const q = (query || '').trim();
  if (!q) {
    results.classList.add('hidden');
    results.innerHTML = '';
    return;
  }

  const stripColorCodes = (text) => {
    if (!text) return '';
    return text.replace(/\^[0-9A-Fa-f]{6}/g, '');
  };

  const all = getAllItems();
  let matches = [];

  const queryNum = parseInt(q, 10);
  const isExactNumeric = !isNaN(queryNum) && q === queryNum.toString();

  if (isExactNumeric) {
    // Exact ID match pinned first (mirrors setupAutocomplete behaviour)
    const exactMatch = all.find(it => it.id === queryNum);
    const rest = all.filter(it =>
      it.id !== queryNum &&
      (it.id.toString().includes(q) || (getItemDisplayName(it) || '').toLowerCase().includes(q))
    ).slice(0, exactMatch ? 19 : 20);
    matches = exactMatch ? [exactMatch, ...rest] : rest;

  } else if (/^\d+$/.test(q)) {
    // Partial numeric — match by ID substring, exact ID first if present
    const exactMatch = all.find(it => it.id === queryNum);
    const rest = all.filter(it => it.id !== (exactMatch?.id ?? -1) && it.id.toString().includes(q)).slice(0, exactMatch ? 19 : 20);
    matches = exactMatch ? [exactMatch, ...rest] : rest;

  } else {
    // Text query — use SEARCH_INDEX_NAME for word/phrase/exclude logic
    const lower = q.toLowerCase();
    const includePhrases = [];
    const includeWords = [];
    const excludePhrases = [];
    const excludeWords = [];

    let remaining = lower.replace(/-?"([^"]+)"/g, (match, phrase) => {
      if (match.startsWith('-')) {
        excludePhrases.push(phrase);
      } else {
        includePhrases.push(phrase);
      }
      return '';
    });

    remaining.split(/\s+/).forEach(word => {
      if (word.length > 0) {
        if (word.startsWith('-') && word.length > 1) {
          excludeWords.push(word.substring(1));
        } else if (!word.startsWith('-')) {
          includeWords.push(word);
        }
      }
    });

    // Include words via index
    const includeMatchSets = includeWords.map(word => {
      const matchingIds = new Set();
      const cleanWord = word.replace(/[^\w]/g, '');
      Object.keys(SEARCH_INDEX_NAME).forEach(indexTerm => {
        if (indexTerm.includes(cleanWord)) {
          SEARCH_INDEX_NAME[indexTerm].forEach(id => matchingIds.add(id));
        }
      });
      return matchingIds;
    });

    // Include phrases via index + exact verify
    const includePhraseMatchSets = includePhrases.map(phrase => {
      const matchingIds = new Set();
      const phraseWords = phrase.split(/\s+/);
      const wordSets = phraseWords.map(word => {
        const wordIds = new Set();
        const cleanWord = word.replace(/[^\w]/g, '');
        Object.keys(SEARCH_INDEX_NAME).forEach(indexTerm => {
          if (indexTerm.includes(cleanWord)) {
            SEARCH_INDEX_NAME[indexTerm].forEach(id => wordIds.add(id));
          }
        });
        return wordIds;
      });
      const candidates = Array.from(wordSets[0] || []).filter(id =>
        wordSets.every(set => set.has(id))
      );
      candidates.forEach(id => {
        const item = DATA.items[id];
        if (!item) return;
        if (stripColorCodes(item.name || '').toLowerCase().includes(phrase)) matchingIds.add(id);
      });
      return matchingIds;
    });

    const allIncludeMatchSets = [...includeMatchSets, ...includePhraseMatchSets];

    // Exclude words via index
    const excludeIds = new Set();
    excludeWords.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      Object.keys(SEARCH_INDEX_NAME).forEach(indexTerm => {
        if (indexTerm.includes(cleanWord)) {
          SEARCH_INDEX_NAME[indexTerm].forEach(id => excludeIds.add(id));
        }
      });
    });

    // Exclude phrases via exact verify
    excludePhrases.forEach(phrase => {
      const phraseWords = phrase.split(/\s+/);
      const wordSets = phraseWords.map(word => {
        const wordIds = new Set();
        const cleanWord = word.replace(/[^\w]/g, '');
        Object.keys(SEARCH_INDEX_NAME).forEach(indexTerm => {
          if (indexTerm.includes(cleanWord)) {
            SEARCH_INDEX_NAME[indexTerm].forEach(id => wordIds.add(id));
          }
        });
        return wordIds;
      });
      const candidates = Array.from(wordSets[0] || []).filter(id =>
        wordSets.every(set => set.has(id))
      );
      candidates.forEach(id => {
        const item = DATA.items[id];
        if (!item) return;
        if (stripColorCodes(item.name || '').toLowerCase().includes(phrase)) excludeIds.add(id);
      });
    });

    matches = all.filter(it => {
      const matchesAllIncludes = allIncludeMatchSets.length === 0 ||
        allIncludeMatchSets.every(matchSet => matchSet.has(it.id));
      return matchesAllIncludes && !excludeIds.has(it.id);
    });

    // Relevance sort: exact name > starts-with > rest (by id) — mirrors setupAutocomplete
    matches.sort((a, b) => {
      const an = (getItemDisplayName(a) || '').toLowerCase();
      const bn = (getItemDisplayName(b) || '').toLowerCase();
      if (an === lower && bn !== lower) return -1;
      if (bn === lower && an !== lower) return 1;
      if (an.startsWith(lower) && !bn.startsWith(lower)) return -1;
      if (bn.startsWith(lower) && !an.startsWith(lower)) return 1;
      return a.id - b.id;
    });

    matches = matches.slice(0, 20);
  }

  if (matches.length === 0) {
    results.classList.remove('hidden');
    results.innerHTML = `<div class="values-manager-result"><span>No matches</span><span></span></div>`;
    return;
  }

  results.classList.remove('hidden');
  results.innerHTML = matches.map(it => `
    <div class="values-manager-result" onclick="valuesManagerAddPick(${it.id})">
      <span style="display:flex;align-items:center;gap:8px;min-width:0;">
        ${renderItemIcon(it.id, 24)}
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(getItemDisplayName(it) || '<unnamed>')}</span>
      </span>
      <span style="color:var(--text-muted);font-size:12px;">#${it.id}</span>
    </div>
  `).join('');
}

function valuesManagerAddPick(id) {
  addToValuesManager(Number(id));
  const input = document.getElementById('valuesManagerAddInput');
  const results = document.getElementById('valuesManagerAddResults');
  if (input) input.value = '';
  if (results) {
    results.classList.add('hidden');
    results.innerHTML = '';
  }
  renderValuesManager();
}

function setValuesManagerSort(key) {
  valuesManagerState.sortKey = (key === 'id' || key === 'value') ? key : 'name';
  saveValuesManagerConfig({
    mode: valuesManagerState.mode,
    trackedIds: Array.from(valuesManagerState.tracked),
    sortKey: valuesManagerState.sortKey,
    sortDir: valuesManagerState.sortDir,
  });
  syncValuesManagerSortUI();
  renderValuesManager();
}

function toggleValuesManagerSortDir() {
  valuesManagerState.sortDir = valuesManagerState.sortDir === 'desc' ? 'asc' : 'desc';
  saveValuesManagerConfig({
    mode: valuesManagerState.mode,
    trackedIds: Array.from(valuesManagerState.tracked),
    sortKey: valuesManagerState.sortKey,
    sortDir: valuesManagerState.sortDir,
  });
  syncValuesManagerSortUI();
  renderValuesManager();
}

function syncValuesManagerSortUI() {
  const sel = document.getElementById('valuesManagerSortKey');
  if (sel) sel.value = valuesManagerState.sortKey || 'name';

  const btn = document.getElementById('valuesManagerSortDir');
  if (!btn) return;

  const key = valuesManagerState.sortKey || 'name';
  const dir = valuesManagerState.sortDir === 'desc' ? 'desc' : 'asc';

  let label = dir === 'desc' ? 'Z→A' : 'A→Z';
  if (key === 'id') label = dir === 'desc' ? 'ID↓' : 'ID↑';
  if (key === 'value') label = dir === 'desc' ? 'V↓' : 'V↑';
  btn.textContent = label;
}

function syncValuesManagerNotice() {
  const notice = document.getElementById('valuesManagerNotice');
  if (!notice) return;

  const isCreditMode = valuesManagerState.mode === 'credit';
  if (!isCreditMode) {
    notice.classList.add('hidden');
    notice.textContent = '';
    return;
  }
}

// Expose pane controls for inline handlers
window.setValuesManagerSource = setValuesManagerSource;
window.openValuesManager = openValuesManager;
window.closeValuesManager = closeValuesManager;
window.setValuesManagerMode = setValuesManagerMode;
window.updateValuesManagerValue = updateValuesManagerValue;
window.addToValuesManager = addToValuesManager;
window.valuesManagerAddPick = valuesManagerAddPick;
window.valuesManagerOpenItem = valuesManagerOpenItem;
window.deleteValuesManagerItem = deleteValuesManagerItem;
window.setValuesManagerSort = setValuesManagerSort;
window.toggleValuesManagerSortDir = toggleValuesManagerSortDir;
window.isValuesManagerOpen = () => valuesManagerState.open;
window.renderValuesManagerPane = () => {
  if (valuesManagerState.open) renderValuesManager();
};
