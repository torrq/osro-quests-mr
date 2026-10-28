// autoloot.js - Autoloot Generator & Slot Groups Logic (Variation A + Migration)

// ===== CONSTANTS =====

const AUTOLOOT_CONFIG = {
  MAX_CHARS_PER_LINE: 255,
  MAX_SLOTS: 10,
  MAX_ITEMS_PER_SLOT: 100,
  COMMANDS_WITH_SLOTS: ["save", "reset", "load", "clear", "add", "remove", "set"]
};

// ===== TEXT & HTML SANITIZATION HELPERS =====

function safeHtml(str) {
  if (typeof escapeHtml === 'function') {
    return escapeHtml(str);
  }
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

// ===== CAPACITY HELPERS =====

function getMaxAutolootItems() {
  return AUTOLOOT_CONFIG.MAX_ITEMS_PER_SLOT;
}

// ===== STORAGE & NON-DESTRUCTIVE MIGRATION =====

function initAutolootData() {
  // 1. Check if v2 data exists
  let loaded = null;
  if (window.osroStore) {
    loaded = osroStore.getJson(LOCAL_STORAGE.autoloot_v2, null);
  } else {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE.autoloot_v2);
      if (raw) loaded = JSON.parse(raw);
    } catch (e) {}
  }

  if (loaded && loaded.slots && typeof loaded.slots === 'object' && Object.keys(loaded.slots).length > 0) {
    state.autolootV2 = loaded;
    if (!state.autolootV2.archive) {
      state.autolootV2.archive = { sets: [] };
    }
    ensureSlot10Exists();
    syncLegacyMemoryState();
    selectDefaultInitialSet();
    return;
  }

  // 3. First-time migration from legacy keys (leaving legacy keys completely untouched as backup!)
  performMigrationFromLegacy();
}

function ensureSlot10Exists() {
  if (!state.autolootV2 || !state.autolootV2.slots) return;
  if (state.autolootV2.slots["10"]) return;

  // 1. Check if slot 10 was previously placed into archive during interim migration
  let migratedSet = null;
  if (state.autolootV2.archive && Array.isArray(state.autolootV2.archive.sets)) {
    const archIdx = state.autolootV2.archive.sets.findIndex(s => s.id === "set_migrated_slot_10" || s.name === "Slot 10 (Archived)");
    if (archIdx !== -1) {
      migratedSet = state.autolootV2.archive.sets.splice(archIdx, 1)[0];
      migratedSet.id = "set_slot_10";
      if (migratedSet.name === "Slot 10 (Archived)") {
        migratedSet.name = "Autoloot Slot 10";
      }
    }
  }

  // 2. If not found in archive, check legacy backup data
  if (!migratedSet) {
    let legacyData = null;
    let legacyNames = null;
    if (window.osroStore) {
      legacyData = osroStore.getJson(LOCAL_STORAGE.autoloot_data, null);
      legacyNames = osroStore.getJson(LOCAL_STORAGE.autoloot_names, null);
    } else {
      try {
        const rawD = localStorage.getItem(LOCAL_STORAGE.autoloot_data);
        if (rawD) legacyData = JSON.parse(rawD);
      } catch (e) {}
      try {
        const rawN = localStorage.getItem(LOCAL_STORAGE.autoloot_names);
        if (rawN) legacyNames = JSON.parse(rawN);
      } catch (e) {}
    }
    const rawItems = (legacyData && Array.isArray(legacyData["10"])) ? legacyData["10"] : [];
    const items = rawItems.map(Number).filter(id => Number.isFinite(id) && id > 0);
    const name = (legacyNames && legacyNames["10"] && legacyNames["10"].trim())
      ? legacyNames["10"].trim()
      : "Autoloot Slot 10";
    migratedSet = {
      id: "set_slot_10",
      name: name,
      items: items,
      autoload: false
    };
  }

  if (typeof migratedSet.autoload === 'undefined') {
    migratedSet.autoload = false;
  }

  state.autolootV2.slots["10"] = {
    defaultSetId: migratedSet.id,
    sets: [migratedSet]
  };

  saveAutoloot(false);
}

function performMigrationFromLegacy() {
  let legacyData = null;
  let legacyNames = null;

  if (window.osroStore) {
    legacyData = osroStore.getJson(LOCAL_STORAGE.autoloot_data, null);
    legacyNames = osroStore.getJson(LOCAL_STORAGE.autoloot_names, null);
  } else {
    try {
      const rawD = localStorage.getItem(LOCAL_STORAGE.autoloot_data);
      if (rawD) legacyData = JSON.parse(rawD);
    } catch (e) {}
    try {
      const rawN = localStorage.getItem(LOCAL_STORAGE.autoloot_names);
      if (rawN) legacyNames = JSON.parse(rawN);
    } catch (e) {}
  }

  const newV2 = {
    version: 2,
    slots: {},
    archive: { sets: [] }
  };

  const hasLegacyData = legacyData && typeof legacyData === 'object' && Object.keys(legacyData).length > 0;

  for (let i = 1; i <= AUTOLOOT_CONFIG.MAX_SLOTS; i++) {
    const key = i.toString();
    const rawItems = (hasLegacyData && Array.isArray(legacyData[key])) ? legacyData[key] : [];
    const items = rawItems.map(Number).filter(id => Number.isFinite(id) && id > 0);
    const name = (legacyNames && legacyNames[key] && legacyNames[key].trim())
      ? legacyNames[key].trim()
      : `Autoloot Slot ${i}`;
    const setId = `set_slot_${i}`;

    newV2.slots[key] = {
      defaultSetId: setId,
      sets: [
        {
          id: setId,
          name: name,
          items: items,
          autoload: false
        }
      ]
    };
  }

  state.autolootV2 = newV2;
  // Non-destructively persist to new v2 key without modifying legacy keys
  saveAutoloot(false);
  selectDefaultInitialSet();
}

function selectDefaultInitialSet() {
  if (state.selectedAutolootSetId && findSetInfo(state.selectedAutolootSetId)) {
    return;
  }
  const s1 = state.autolootV2?.slots?.["1"];
  if (s1 && s1.defaultSetId) {
    state.selectedAutolootSetId = s1.defaultSetId;
    state.selectedAutolootSlot = 1;
  } else if (s1 && s1.sets?.length > 0) {
    state.selectedAutolootSetId = s1.sets[0].id;
    state.selectedAutolootSlot = 1;
  }
}

function syncLegacyMemoryState() {
  if (!state.autolootV2?.slots) return;
  state.autolootData = state.autolootData || {};
  state.autolootNames = state.autolootNames || {};

  for (let i = 1; i <= AUTOLOOT_CONFIG.MAX_SLOTS; i++) {
    const slot = state.autolootV2.slots[i.toString()];
    if (!slot) continue;
    const def = slot.sets?.find(s => s.id === slot.defaultSetId) || slot.sets?.[0];
    if (def) {
      state.autolootData[i] = [...def.items];
      state.autolootNames[i] = def.name;
    } else {
      state.autolootData[i] = [];
      state.autolootNames[i] = `Autoloot Slot ${i}`;
    }
  }
}

function saveAutoloot(renderAfter = true) {
  if (!state.autolootV2) return;
  syncLegacyMemoryState();

  if (window.osroStore) {
    osroStore.setItem(LOCAL_STORAGE.autoloot_v2, state.autolootV2);
  } else {
    try {
      localStorage.setItem(LOCAL_STORAGE.autoloot_v2, JSON.stringify(state.autolootV2));
    } catch (e) {
      console.error("[Autoloot] Failed to save v2 autoloot data:", e);
    }
  }

  if (renderAfter) {
    renderAutolootSidebar();
    renderAutolootMain();
  }
}

function loadAutolootV2FromSync() {
  let remote = null;
  if (window.osroStore) {
    remote = osroStore.getJson(LOCAL_STORAGE.autoloot_v2, null);
  }
  if (remote && remote.slots) {
    state.autolootV2 = remote;
    if (!state.autolootV2.archive) {
      state.autolootV2.archive = { sets: [] };
    }
    syncLegacyMemoryState();
    if (state.currentTab === 'autoloot') {
      renderAutolootSidebar();
      renderAutolootMain();
    }
  }
}
window.loadAutolootV2FromSync = loadAutolootV2FromSync;

// ===== SET & SLOT LOOKUPS =====

function findSetInfo(setId) {
  if (!state.autolootV2?.slots) return null;

  for (let slotNum = 1; slotNum <= AUTOLOOT_CONFIG.MAX_SLOTS; slotNum++) {
    const slotKey = slotNum.toString();
    const slot = state.autolootV2.slots[slotKey];
    if (slot && slot.sets) {
      const s = slot.sets.find(x => x.id === setId);
      if (s) {
        return {
          set: s,
          slotNum: slotNum,
          isArchived: false,
          isDefault: (slot.defaultSetId === s.id),
          slotGroup: slot
        };
      }
    }
  }

  if (state.autolootV2.archive && Array.isArray(state.autolootV2.archive.sets)) {
    const archSet = state.autolootV2.archive.sets.find(x => x.id === setId);
    if (archSet) {
      return {
        set: archSet,
        slotNum: null,
        isArchived: true,
        isDefault: false,
        slotGroup: null
      };
    }
  }

  return null;
}

function getDefaultSetForSlot(slotNum) {
  const slotKey = slotNum.toString();
  const slot = state.autolootV2?.slots?.[slotKey];
  if (!slot || !slot.sets || slot.sets.length === 0) return null;

  let def = slot.sets.find(s => s.id === slot.defaultSetId);
  if (!def) {
    def = slot.sets[0];
    slot.defaultSetId = def.id;
    saveAutoloot(false);
  }
  return def;
}

// ===== NAVIGATION =====

function selectAutolootSet(setId, pushToHistory = true) {
  state.selectedAutolootSetId = setId;
  const info = findSetInfo(setId);
  if (info) {
    state.selectedAutolootSlot = info.slotNum || 1;
  }

  if (setId && typeof updateURL === 'function') {
    updateURL(setId, 'autoloot', pushToHistory);
  }

  renderAutolootSidebar();
  renderAutolootMain();
  if (window.isMobileSidebarMode && window.isMobileSidebarMode()) toggleSidebar();
}

function selectAutolootSlot(slotNum, pushToHistory = true) {
  if (!state.autolootV2) initAutolootData();
  const num = parseInt(slotNum, 10);
  if (Number.isFinite(num) && num >= 1 && num <= AUTOLOOT_CONFIG.MAX_SLOTS) {
    const def = getDefaultSetForSlot(num);
    if (def) {
      selectAutolootSet(def.id, pushToHistory);
      return;
    }
  }
  renderAutolootSidebar();
  renderAutolootMain();
}

function selectAutolootByParam(param, pushToHistory = true) {
  if (!state.autolootV2) initAutolootData();
  if (!param) return;
  const num = parseInt(param, 10);
  if (num.toString() === param.toString() && num >= 1 && num <= AUTOLOOT_CONFIG.MAX_SLOTS) {
    selectAutolootSlot(num, pushToHistory);
  } else {
    selectAutolootSet(param.toString(), pushToHistory);
  }
}

window.selectAutolootSet = selectAutolootSet;
window.selectAutolootSlot = selectAutolootSlot;
window.selectAutolootByParam = selectAutolootByParam;


// ===== SIDEBAR TREE RENDERING (Variation A) =====

function toggleGroupCollapse(groupId, e) {
  if (e) e.stopPropagation();
  state.autolootCollapsedGroups[groupId] = !state.autolootCollapsedGroups[groupId];
  renderAutolootSidebar();
}
window.toggleGroupCollapse = toggleGroupCollapse;

function renderAutolootSidebar() {
  const container = document.getElementById("autolootList");
  if (!container) return;

  if (!state.autolootV2) initAutolootData();

  let html = `<div class="autoloot-tree-container">`;

  // 1. Render Slot Groups 1 to 9
  for (let slotNum = 1; slotNum <= AUTOLOOT_CONFIG.MAX_SLOTS; slotNum++) {
    const slotKey = slotNum.toString();
    const slot = state.autolootV2.slots[slotKey];
    if (!slot) continue;

    const isCollapsed = !!state.autolootCollapsedGroups[slotNum];
    const defaultSet = getDefaultSetForSlot(slotNum);
    const rawTitle = defaultSet ? defaultSet.name : `Autoloot Slot ${slotNum}`;
    const groupTitle = safeHtml(rawTitle);
    const groupItemCount = defaultSet ? defaultSet.items.length : 0;
    const totalSets = (slot.sets || []).length;

    html += `
      <div class="al-tree-group">
        <div class="al-tree-group-header" onclick="toggleGroupCollapse(${slotNum}, event)">
          <span class="al-tree-arrow ${isCollapsed ? 'collapsed' : ''}">▼</span>
          <span class="al-tree-slot-num">${slotNum}</span>
          <div class="al-tree-group-info">
            <div class="al-tree-group-title" title="${groupTitle}">
              ${groupTitle}
            </div>
            <div class="al-tree-group-subtitle">
              ${groupItemCount} items • ${totalSets} set${totalSets !== 1 ? 's' : ''} in slot
            </div>
          </div>
          <button class="al-tree-add-btn" onclick="addSetToSlot(${slotNum}, event)" title="Add new set to Slot ${slotNum}">+</button>
        </div>

        <div class="al-tree-children ${isCollapsed ? 'collapsed' : ''}">
          ${renderSlotChildSets(slotNum, slot)}
        </div>
      </div>
    `;
  }

  // 2. Render Numberless / Archived Group
  const isArchCollapsed = !!state.autolootCollapsedGroups['archive'];
  const archSets = state.autolootV2.archive?.sets || [];
  html += `
    <div class="al-tree-group">
      <div class="al-tree-group-header archived" onclick="toggleGroupCollapse('archive', event)">
        <span class="al-tree-arrow ${isArchCollapsed ? 'collapsed' : ''}">▼</span>
        <span class="al-tree-slot-num">📁</span>
        <div class="al-tree-group-info">
          <div class="al-tree-group-title">
            Unassigned
          </div>
          <div class="al-tree-group-subtitle">
            ${archSets.length} set${archSets.length !== 1 ? 's' : ''} · not in a slot
          </div>
        </div>
        <button class="al-tree-add-btn" onclick="addNewArchivedSet(event)" title="Add new archived set">+</button>
      </div>

      <div class="al-tree-children ${isArchCollapsed ? 'collapsed' : ''}">
        ${renderArchiveChildSets()}
      </div>
    </div>
  `;

  html += `</div>`;
  container.innerHTML = html;
}

function renderSlotChildSets(slotNum, slot) {
  const defaultId = slot.defaultSetId;
  const sets = slot.sets || [];
  const sortedSets = [...sets].sort((a, b) => {
    if (a.id === defaultId) return -1;
    if (b.id === defaultId) return 1;
    return 0;
  });

  return sortedSets.map(s => {
    const isDefault = (s.id === defaultId);
    const isSelected = (state.selectedAutolootSetId === s.id);
    const count = s.items.length;
    const safeName = safeHtml(s.name);

    return `
      <div class="al-tree-set-row ${isDefault ? 'is-default' : ''} ${isSelected ? 'active' : ''}" 
           onclick="selectAutolootSet('${s.id}')">
        <div class="al-tree-set-left">
          ${isDefault ? '<span class="al-default-star">★</span>' : '<span style="color:var(--text-muted); font-size:10px;">↳</span>'}
          <span class="al-tree-set-name" title="${safeName}">${safeName}</span>
          ${isDefault ? '<span class="al-default-pill">DEFAULT</span>' : ''}
          ${s.autoload ? '<span class="al-autoload-pill" title="Auto-loads at login">⚡ LOGIN</span>' : ''}
        </div>
        <div class="al-tree-set-meta">
          <span>${count} items</span>
        </div>
        ${!isDefault ? `
          <div class="al-row-acts">
            <button title="Make default" onclick="setSlotDefault(${slotNum}, '${s.id}'); event.stopPropagation();">★</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function renderArchiveChildSets() {
  const sets = state.autolootV2.archive?.sets || [];
  if (sets.length === 0) {
    return `<div style="padding:6px 12px 6px 36px; font-size:11px; color:var(--text-muted);">No unassigned sets</div>`;
  }

  return sets.map(s => {
    const isSelected = (state.selectedAutolootSetId === s.id);
    const count = s.items.length;
    const safeName = safeHtml(s.name);

    return `
      <div class="al-tree-set-row ${isSelected ? 'active' : ''}" onclick="selectAutolootSet('${s.id}')">
        <div class="al-tree-set-left">
          <span style="color:var(--text-muted); font-size:11px;">📦</span>
          <span class="al-tree-set-name" title="${safeName}">${safeName}</span>
          ${s.autoload ? '<span class="al-autoload-pill" title="Auto-loads at login">⚡ LOGIN</span>' : ''}
        </div>
        <div class="al-tree-set-meta">
          <span>${count} items</span>
        </div>
        <div class="al-row-acts">
          <select title="Send to slot" onclick="event.stopPropagation()" onchange="moveSetToSlot('${s.id}', this.value)">
            <option value="">→ Slot…</option>
            ${Array.from({ length: AUTOLOOT_CONFIG.MAX_SLOTS }, (_, i) => `<option value="${i + 1}">Slot ${i + 1}</option>`).join('')}
          </select>
        </div>
      </div>
    `;
  }).join('');
}

// ===== MAIN CONTENT RENDERING =====

function renderAutolootMain() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  if (!state.autolootV2) initAutolootData();

  let info = findSetInfo(state.selectedAutolootSetId);
  if (!info) {
    selectDefaultInitialSet();
    info = findSetInfo(state.selectedAutolootSetId);
  }

  if (!info || !info.set) {
    container.innerHTML = `<div class="al-empty-state"><div class="al-empty-title">No Autoloot Set Selected</div></div>`;
    return;
  }

  const set = info.set;
  const count = set.items.length;
  const maxLimit = getMaxAutolootItems();
  const pct = maxLimit > 0 ? Math.min(100, Math.round((count / maxLimit) * 100)) : 0;
  const safeSetName = safeHtml(set.name);

  let fillClass = '';
  if (count >= maxLimit) fillClass = 'al-capacity-fill--full';
  else if (count >= maxLimit * 0.8) fillClass = 'al-capacity-fill--warn';

  // Sibling tabs (all sets in this slot group, or the Unassigned library)
  const slotObj = info.isArchived ? null : state.autolootV2.slots[info.slotNum];
  const sibs = info.isArchived ? (state.autolootV2.archive?.sets || []) : (slotObj?.sets || []);
  const tabsHtml = sibs.map(s => {
    const isDef = !info.isArchived && slotObj.defaultSetId === s.id;
    const star = info.isArchived ? '' : `<span class="al-tab-star ${isDef ? '' : 'off'}" title="${isDef ? 'Default for this slot' : 'Make default'}" onclick="event.stopPropagation(); ${isDef ? '' : `setSlotDefault(${info.slotNum}, '${s.id}')`}">★</span>`;
    return `<div class="al-set-tab ${s.id === set.id ? 'active' : ''}" onclick="selectAutolootSet('${s.id}')">${star}<span class="al-set-tab-name">${safeHtml(s.name)}</span></div>`;
  }).join('') + `<div class="al-set-tab al-set-tab--add" title="Add set" onclick="${info.isArchived ? 'addNewArchivedSet(event)' : `addSetToSlot(${info.slotNum}, event)`}">＋</div>`;

  const slotContextBar = `
    <div class="al-crumb">${info.isArchived ? 'Unassigned library' : `Slot ${info.slotNum} · ${sibs.length} set${sibs.length !== 1 ? 's' : ''}`}</div>
    <div class="al-set-tabs">${tabsHtml}</div>
  `;

  const moveOpts = Array.from({ length: AUTOLOOT_CONFIG.MAX_SLOTS }, (_, i) => i + 1).map(n =>
    `<option value="${n}" ${info.slotNum === n ? 'disabled' : ''}>Slot ${n} (${state.autolootV2.slots[n]?.sets?.length || 0} sets)</option>`).join('')
    + `<option value="archive" ${info.isArchived ? 'disabled' : ''}>Unassigned</option>`;
  const setMenuHtml = `
    <div class="al-menu">
      <button class="btn btn-sm" onclick="alToggleMenu(this, event)" title="More actions">⋯</button>
      <div class="al-menu-dd">
        <select onchange="moveSetToSlot('${set.id}', this.value)"><option value="">Move to…</option>${moveOpts}</select>
        <button onclick="duplicateSet('${set.id}')">Duplicate</button>
        <button class="danger" onclick="clearSetItems('${set.id}')">Clear items</button>
        <button class="danger" onclick="deleteSet('${set.id}')">Delete set</button>
      </div>
    </div>`;

  // Target slot for command generation
  const commandSlot = info.slotNum || 1;
  const generatedCmds = generateCommands(commandSlot, set.items, maxLimit, !!set.autoload);

  container.innerHTML = `
    <div class="autoloot-main">
      ${slotContextBar}

      <!-- Header Card -->
      <div class="qvh qvh--autoloot">
        <div class="qvh-body">
          <div class="qvh-title-row" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:baseline; gap:8px;">
              <span class="qvh-item-name">Autoloot</span>
              <span class="qvh-id">${info.isArchived ? 'Unassigned' : `Slot #${info.slotNum}`}</span>
              ${info.isDefault ? '<span class="al-default-pill" style="font-size:10px; padding:2px 6px;">DEFAULT</span>' : ''}
            </div>
          </div>

          <div class="qvh-meta" style="margin-top:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <input
              type="text"
              id="slotNameInput"
              class="al-slot-name-input"
              value="${safeSetName}"
              placeholder="Name this set..."
              onchange="updateSetName('${set.id}', this.value)"
            >
            ${setMenuHtml}
          </div>

          <!-- Capacity Bar -->
          <div class="al-capacity">
            <div class="al-capacity-bar">
              <div class="al-capacity-fill ${fillClass}" style="width:${pct}%"></div>
            </div>
            <span class="al-capacity-label">${count} / ${maxLimit} items</span>
          </div>

          <!-- Auto-load Option Row -->
          <div class="al-set-options-row">
            <label class="al-autoload-toggle">
              <input 
                type="checkbox" 
                ${set.autoload ? 'checked' : ''} 
                onchange="toggleSetAutoload('${set.id}', this.checked)"
              >
              <span>⚡ Auto-load this profile at login</span>
            </label>
            <div class="al-autoload-preview">
              ${set.autoload 
                ? `Appends <code>@alootid2 set ${commandSlot} autoload 1</code> to commands` 
                : `Optional: loads this slot automatically when logging in`}
            </div>
          </div>

        </div>
      </div>

      <!-- Stored Items Section -->
      ${renderItemsSection(set.id, set.items)}

      <!-- Search Section -->
      ${renderSearchBox(set.id)}

      <!-- Command Generation Box -->
      ${renderCommandBox(info, commandSlot, generatedCmds)}

      <!-- Import Section -->
      ${renderImportSection(set.id)}
    </div>
  `;
}

function renderItemsSection(setId, items) {
  const gridOrEmpty = items.length > 0
    ? `<div class="al-items-grid">${items.map(id => renderItemCard(setId, id)).join("")}</div>`
    : `<div class="al-empty-state">
         <div class="al-empty-icon">☁</div>
         <div class="al-empty-title">This set is empty</div>
         <div class="al-empty-hint">Use the search below to add items to this set.</div>
       </div>`;

  return `
    <div class="al-section">
      <div class="al-section-header">
        <span class="item-label">Stored Items (${items.length})</span>
      </div>
      ${gridOrEmpty}
    </div>
  `;
}

function renderItemCard(setId, id) {
  const item = DATA.items[id];
  const name = item?.name || `Item #${id}`;
  const isUnknown = !item;
  const slotCount = Number(item?.slot) || 0;
  const displayName = slotCount > 0 ? `${name} [${slotCount}]` : name;
  const safeDisplayName = safeHtml(displayName);
  const nameHtml = isUnknown
    ? `<span class="al-item-name al-item-name--unknown" title="${safeDisplayName}">${safeDisplayName}</span>`
    : `<a class="item-link al-item-name" onclick="navigateToItem(${id})" title="${safeDisplayName}">${safeDisplayName}</a>`;

  return `
    <div class="al-item-card">
      <div class="al-item-card-left">
        ${renderItemIcon(id, 24)}
        ${nameHtml}
      </div>
      <div class="al-item-card-right">
        <span class="al-item-id">${id}</span>
        <button class="al-remove-btn" onclick="removeFromAutoloot('${setId}', ${id})" title="Remove">×</button>
      </div>
    </div>
  `;
}

function renderSearchBox(setId) {
  return `
    <div class="al-section">
      <div class="al-section-header">
        <span class="item-label">Add Item</span>
      </div>
      <div class="al-search-wrapper">
        <div class="al-search-icon">🔍</div>
        <input type="text"
          id="alSearchInput"
          class="al-search-input"
          placeholder="Search by name or ID (e.g. Poison Spore, Oridecon, 7451)..."
          autocomplete="off"
          oninput="handleAutolootSearch(this.value, '${setId}')">
        <div id="alSearchResults" class="al-search-dropdown hidden"></div>
      </div>
    </div>
  `;
}

function renderCommandBox(info, slot, commands) {
  const commandHtml = commands.length === 0
    ? '<div class="al-empty-hint">Add items above to generate commands.</div>'
    : commands.map(cmd => `<div class="al-code-block">${cmd}</div>`).join("");

  return `
    <div class="al-section">
      <div class="al-section-header">
        <div>
          <span class="item-label">
            Generated Commands ${info.isArchived ? '(Preview for Slot #1)' : `(Target Slot #${info.slotNum})`}
          </span>
          <div class="al-overflow-hint">
            Outputs <code>@alootid2 reset ${slot}</code> ➔ burst saves ➔ <code>@alootid2 load ${slot}</code>${info.set?.autoload ? ` ➔ <code>@alootid2 set ${slot} autoload 1</code>` : ''}.
          </div>
        </div>
        ${commands.length > 0 ? `<button class="btn btn-sm btn-primary" onclick="copyAllAutoloot()">Copy All Commands</button>` : ''}
      </div>
      <div class="al-command-box">
        ${commandHtml}
      </div>
      <p class="al-overflow-hint">Commands are split to prevent client overflow — bursts first, then throttled.</p>
    </div>
  `;
}

function renderImportSection(setId) {
  return `
    <div class="al-section al-section--import">
      <div class="al-section-header">
        <span class="item-label">Import from In-Game Commands</span>
      </div>
      <p class="al-overflow-hint">Paste existing <code>@alootid2</code> commands to import their item IDs into this set.</p>
      <textarea
        id="alootPasteBox"
        class="al-paste-textarea"
        placeholder="@alootid2 save 1 7451 7507 7510"
      ></textarea>
      <div class="al-paste-actions">
        <button class="btn btn-primary btn-sm" onclick="importAlootCommands('${setId}')">Import</button>
        <span class="help-text">Space-separated IDs only. Extra spacing is fine.</span>
      </div>
    </div>
  `;
}

// ===== COMMAND GENERATION =====

function generateCommands(slot, items, maxLimit = 100, autoload = false) {
  if (!items || items.length === 0) return [];

  const { MAX_CHARS_PER_LINE } = AUTOLOOT_CONFIG;
  const commandBlocks = [];
  const prefix = `@alootid2 save ${slot} `;

  // Steeper Decay Strategy:
  // Line 1: 20 items (Burst)
  // Line 2: 15 items
  // Line 3: 12 items
  // Lines 4-7: 7 items (Sustained)
  // Lines 8-9: 6 items (Fatigue sets in)
  // Lines 10+: 5 items (Maximum safety)
  const getLineLimit = (index) => {
    if (index === 0) return 20;
    if (index === 1) return 15;
    if (index === 2) return 12;
    if (index < 7) return 7;
    if (index < 9) return 6;
    return 5;
  };

  const usableItems = items.slice(0, maxLimit);
  let currentChunk = [];
  let currentLineIndex = 0;
  let currentLength = prefix.length;

  usableItems.forEach(id => {
    const idStr = id.toString();
    const limit = getLineLimit(currentLineIndex);
    const spaceCost = currentChunk.length > 0 ? 1 : 0;
    const totalCost = spaceCost + idStr.length;

    if (currentChunk.length >= limit || (currentLength + totalCost) > MAX_CHARS_PER_LINE) {
      commandBlocks.push(`${prefix}${currentChunk.join(" ")}`);
      currentChunk = [];
      currentLineIndex++;
      currentLength = prefix.length;
    }

    currentChunk.push(idStr);
    const addedLen = (currentChunk.length === 1) ? idStr.length : (1 + idStr.length);
    currentLength += addedLen;
  });

  if (currentChunk.length > 0) {
    commandBlocks.push(`${prefix}${currentChunk.join(" ")}`);
  }

  const cmds = [
    `@alootid2 reset ${slot}`,
    ...commandBlocks,
    `@alootid2 load ${slot}`
  ];

  if (autoload) {
    cmds.push(`@alootid2 set ${slot} autoload 1`);
  }

  return cmds;
}

// ===== SET MUTATIONS & ACTIONS =====

function toggleSetAutoload(setId, checked) {
  const info = findSetInfo(setId);
  if (info && info.set) {
    info.set.autoload = !!checked;
    saveAutoloot(true);
    if (info.set.autoload) {
      showToast(`Auto-load enabled for "${safeHtml(info.set.name)}"`, "info");
    } else {
      showToast(`Auto-load disabled for "${safeHtml(info.set.name)}"`, "info");
    }
  }
}
window.toggleSetAutoload = toggleSetAutoload;

function setSlotDefault(slotNum, setId) {
  const slotKey = slotNum.toString();
  const slot = state.autolootV2?.slots?.[slotKey];
  if (!slot) return;
  slot.defaultSetId = setId;
  saveAutoloot(true);
  const info = findSetInfo(setId);
  showToast(`Set "${safeHtml(info?.set?.name || 'Set')}" is now the Default for Slot #${slotNum}`, "success");
}
window.setSlotDefault = setSlotDefault;

function moveSetToSlot(setId, targetValue) {
  if (!targetValue) return;
  const current = findSetInfo(setId);
  if (!current || !current.set) return;

  const theSet = current.set;

  // 1. Remove from source
  if (!current.isArchived) {
    const currentSlot = state.autolootV2.slots[current.slotNum.toString()];
    currentSlot.sets = (currentSlot.sets || []).filter(s => s.id !== setId);
    if (currentSlot.defaultSetId === setId && currentSlot.sets.length > 0) {
      currentSlot.defaultSetId = currentSlot.sets[0].id;
    }
  } else {
    state.autolootV2.archive.sets = (state.autolootV2.archive.sets || []).filter(s => s.id !== setId);
  }

  // 2. Add to destination
  if (targetValue === 'archive') {
    state.autolootV2.archive.sets = state.autolootV2.archive.sets || [];
    state.autolootV2.archive.sets.push(theSet);
    state.autolootCollapsedGroups['archive'] = false;
    showToast(`Moved "${safeHtml(theSet.name)}" to Unassigned`, "info");
  } else {
    const targetSlotNum = parseInt(targetValue, 10);
    const targetSlotKey = targetSlotNum.toString();
    const targetSlot = state.autolootV2.slots[targetSlotKey];
    if (targetSlot) {
      targetSlot.sets = targetSlot.sets || [];
      targetSlot.sets.push(theSet);
      if (targetSlot.sets.length === 1) {
        targetSlot.defaultSetId = theSet.id;
      }
      state.autolootCollapsedGroups[targetSlotNum] = false;
      showToast(`Moved "${safeHtml(theSet.name)}" to Slot #${targetSlotNum} Group`, "info");
    }
  }

  state.selectedAutolootSetId = setId;
  saveAutoloot(true);
}
window.moveSetToSlot = moveSetToSlot;

function addSetToSlot(slotNum, e) {
  if (e) e.stopPropagation();
  const slotKey = slotNum.toString();
  const slot = state.autolootV2?.slots?.[slotKey];
  if (!slot) return;

  const newId = `set_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newSet = {
    id: newId,
    name: `New Slot ${slotNum} Set`,
    items: [],
    autoload: false
  };

  slot.sets = slot.sets || [];
  slot.sets.push(newSet);
  if (slot.sets.length === 1) {
    slot.defaultSetId = newId;
  }

  state.autolootCollapsedGroups[slotNum] = false;
  state.selectedAutolootSetId = newId;
  saveAutoloot(true);
  showToast(`Added new set to Slot #${slotNum}`, "success");
}
window.addSetToSlot = addSetToSlot;

function addNewArchivedSet(e) {
  if (e) e.stopPropagation();
  state.autolootV2.archive = state.autolootV2.archive || { sets: [] };
  const newId = `set_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newSet = {
    id: newId,
    name: `Archived Set ${(state.autolootV2.archive.sets || []).length + 1}`,
    items: [],
    autoload: false
  };

  state.autolootV2.archive.sets.push(newSet);
  state.autolootCollapsedGroups['archive'] = false;
  state.selectedAutolootSetId = newId;
  saveAutoloot(true);
  showToast("Added new set to Archive", "success");
}
window.addNewArchivedSet = addNewArchivedSet;

function duplicateSet(setId) {
  const current = findSetInfo(setId);
  if (!current || !current.set) return;

  const newId = `set_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newSet = {
    id: newId,
    name: `${current.set.name} (Copy)`,
    items: [...current.set.items],
    autoload: !!current.set.autoload
  };

  if (!current.isArchived) {
    const slotKey = current.slotNum.toString();
    state.autolootV2.slots[slotKey].sets.push(newSet);
  } else {
    state.autolootV2.archive.sets.push(newSet);
  }

  state.selectedAutolootSetId = newId;
  saveAutoloot(true);
  showToast(`Duplicated "${safeHtml(current.set.name)}"`, "success");
}
window.duplicateSet = duplicateSet;

function deleteSet(setId) {
  const current = findSetInfo(setId);
  if (!current || !current.set) return;

  if (typeof window.confirm === 'function' && !window.confirm(`Are you sure you want to delete set "${current.set.name}"?`)) {
    return;
  }

  if (!current.isArchived) {
    const slotKey = current.slotNum.toString();
    const slot = state.autolootV2.slots[slotKey];
    if (slot.sets.length <= 1) {
      // Keep at least one empty set in slot
      slot.sets[0] = { id: `set_slot_${current.slotNum}`, name: `Autoloot Slot ${current.slotNum}`, items: [] };
      slot.defaultSetId = slot.sets[0].id;
      state.selectedAutolootSetId = slot.sets[0].id;
    } else {
      slot.sets = slot.sets.filter(s => s.id !== setId);
      if (slot.defaultSetId === setId) {
        slot.defaultSetId = slot.sets[0].id;
      }
      state.selectedAutolootSetId = slot.defaultSetId;
    }
  } else {
    state.autolootV2.archive.sets = state.autolootV2.archive.sets.filter(s => s.id !== setId);
    if (state.autolootV2.archive.sets.length > 0) {
      state.selectedAutolootSetId = state.autolootV2.archive.sets[0].id;
    } else {
      selectDefaultInitialSet();
    }
  }

  saveAutoloot(true);
  showToast("Set deleted", "info");
}
window.deleteSet = deleteSet;

function updateSetName(setId, name) {
  const trimmed = name.trim();
  const info = findSetInfo(setId);
  if (info && info.set) {
    info.set.name = trimmed || (info.isArchived ? 'Archived Set' : `Autoloot Slot ${info.slotNum}`);
    saveAutoloot(true);
  }
}
window.updateSetName = updateSetName;

function clearSetItems(setId) {
  const info = findSetInfo(setId);
  if (info && info.set) {
    info.set.items = [];
    saveAutoloot(true);
    showToast("Set items cleared", "info");
  }
}
window.clearSetItems = clearSetItems;

function addToAutoloot(setId, itemId) {
  const info = findSetInfo(setId);
  if (!info || !info.set) return;

  const currentItems = info.set.items;
  if (currentItems.includes(itemId)) {
    return;
  }

  const maxLimit = getMaxAutolootItems();
  if (currentItems.length >= maxLimit) {
    showToast(`Set is full — max ${maxLimit} items`, 'warning');
    return;
  }

  currentItems.push(itemId);
  saveAutoloot(true);
  clearSearchInput();
}
window.addToAutoloot = addToAutoloot;

function removeFromAutoloot(setId, itemId) {
  const info = findSetInfo(setId);
  if (info && info.set) {
    info.set.items = info.set.items.filter(x => x !== itemId);
    saveAutoloot(true);
  }
}
window.removeFromAutoloot = removeFromAutoloot;

function clearSearchInput() {
  const input = document.getElementById("alSearchInput");
  const results = document.getElementById("alSearchResults");
  if (input) {
    input.value = "";
    input.focus();
  }
  if (results) {
    results.classList.add("hidden");
  }
}

function copyAllAutoloot() {
  const blocks = document.querySelectorAll(".al-code-block");
  const text = Array.from(blocks).map(b => b.textContent).join("\n");
  navigator.clipboard.writeText(text);
  showToast("Commands copied", "success");
}
window.copyAllAutoloot = copyAllAutoloot;

// ===== SEARCH FUNCTIONALITY =====

function handleAutolootSearch(query, setId) {
  const resultsDiv = document.getElementById("alSearchResults");
  if (!resultsDiv) return;

  if (!query?.trim()) {
    resultsDiv.classList.add("hidden");
    return;
  }

  const matches = searchItems(query.toLowerCase());
  if (matches.length === 0) {
    resultsDiv.classList.add("hidden");
    return;
  }

  renderSearchResults(resultsDiv, matches, setId);
}
window.handleAutolootSearch = handleAutolootSearch;

function searchItems(lowerQuery) {
  const allItems = getAllItems();
  const queryNum = parseInt(lowerQuery, 10);
  const isNumeric = !isNaN(queryNum) && queryNum.toString() === lowerQuery.trim();

  if (isNumeric) {
    return searchByID(allItems, queryNum, lowerQuery);
  }
  return searchByName(allItems, lowerQuery);
}

function searchByID(allItems, queryNum, query) {
  const exactMatch = allItems.find(item => item.id === queryNum);
  const matches = exactMatch ? [exactMatch] : [];
  const others = allItems
    .filter(item => 
      item.id !== queryNum && 
      (item.id.toString().includes(query) || 
       item.name?.toLowerCase().includes(query))
    )
    .slice(0, 10);
  return [...matches, ...others];
}

function searchByName(allItems, lowerQuery) {
  return allItems
    .filter(item => 
      item.name?.toLowerCase().includes(lowerQuery) || 
      item.id.toString().includes(lowerQuery)
    )
    .sort((a, b) => sortByRelevance(a, b, lowerQuery))
    .slice(0, 15);
}

function sortByRelevance(a, b, lowerQuery) {
  const aName = (a.name || "").toLowerCase();
  const bName = (b.name || "").toLowerCase();
  if (aName === lowerQuery && bName !== lowerQuery) return -1;
  if (bName === lowerQuery && aName !== lowerQuery) return 1;
  if (aName.startsWith(lowerQuery) && !bName.startsWith(lowerQuery)) return -1;
  if (bName.startsWith(lowerQuery) && !aName.startsWith(lowerQuery)) return 1;
  return a.id - b.id;
}

function renderSearchResults(resultsDiv, matches, setId) {
  const info = findSetInfo(setId);
  const currentItems = info?.set?.items || [];

  resultsDiv.innerHTML = matches.map(item => {
    const slotCount = Number(item.slot) || 0;
    const displayName = slotCount > 0
      ? `${item.name || 'Unknown'} [${slotCount}]`
      : (item.name || 'Unknown');
    const safeDisplayName = safeHtml(displayName);
    const alreadyAdded = currentItems.includes(item.id);

    return `
      <div class="al-result-item ${alreadyAdded ? 'al-result-item--added' : ''}"
           onclick="addToAutoloot('${setId}', ${item.id})">
        ${renderItemIcon(item.id, 24)}
        <span class="al-result-name">${safeDisplayName}</span>
        <span class="al-result-id">${item.id}</span>
        ${alreadyAdded ? '<span class="al-result-check">✓</span>' : ''}
      </div>
    `;
  }).join("");

  resultsDiv.classList.remove("hidden");
}

// ===== IMPORT FUNCTIONALITY =====

function importAlootCommands(setId) {
  const textarea = document.getElementById("alootPasteBox");
  if (!textarea) return;
  const text = textarea.value.trim();
  if (!text) return;

  const info = findSetInfo(setId);
  if (!info || !info.set) {
    showToast('No autoloot set selected', 'warning');
    return;
  }

  const ids = parseAlootCommands(text);
  if (ids.size === 0 && !ids.hasAutoloadCmd) {
    showToast('No valid @alootid2 item IDs found', 'warning');
    return;
  }

  if (ids.hasAutoloadCmd) {
    info.set.autoload = true;
  }

  const currentItems = info.set.items;
  const maxLimit = getMaxAutolootItems();
  const availableSpace = maxLimit - currentItems.length;

  let added = 0;
  let skipped = 0;

  if (ids.size > 0) {
    if (availableSpace <= 0) {
      showToast(`Set is full — max ${maxLimit} items`, 'warning');
      saveAutoloot(true);
      return;
    }

    for (const id of ids) {
      if (currentItems.length >= maxLimit) {
        skipped = ids.size - added;
        break;
      }
      if (!currentItems.includes(id)) {
        currentItems.push(id);
        added++;
      }
    }
  }

  saveAutoloot(true);
  textarea.value = "";
  if (added > 0 || skipped > 0) {
    showToast(`Imported ${added} item${added !== 1 ? 's' : ''}${skipped > 0 ? ` — ${skipped} skipped (set full)` : ''}${ids.hasAutoloadCmd ? ' (auto-load enabled)' : ''}`, skipped > 0 ? 'warning' : 'success');
  } else if (ids.hasAutoloadCmd) {
    showToast('Auto-load on login enabled for this set', 'success');
  }
}
window.importAlootCommands = importAlootCommands;

function parseAlootCommands(text) {
  const lines = text.split(/\r?\n/);
  const ids = new Set();
  let hasAutoloadCmd = false;

  for (let line of lines) {
    line = line.trim();
    if (!line.toLowerCase().startsWith("@alootid2")) continue;

    // Check if line is an autoload configuration: @alootid2 set <slot> autoload 1
    if (/\bset\s+\d+\s+autoload\s+1\b/i.test(line)) {
      hasAutoloadCmd = true;
      continue; // Skip line so '1' is not parsed as item ID
    }

    // Skip control / configuration commands (set, reset, load)
    const parts = line.split(/\s+/).slice(1);
    const verb = parts[0]?.toLowerCase();
    if (verb === 'set' || verb === 'reset' || verb === 'load') {
      continue;
    }

    extractItemIDs(parts, ids);
  }

  ids.hasAutoloadCmd = hasAutoloadCmd;
  return ids;
}

function extractItemIDs(parts, ids) {
  for (let i = 0; i < parts.length; i++) {
    const token = parts[i].toLowerCase();
    if (AUTOLOOT_CONFIG.COMMANDS_WITH_SLOTS.includes(token)) {
      i++; // Skip slot number
      continue;
    }
    if (/^\d+$/.test(token)) {
      ids.add(Number(token));
    }
  }
}

// ===== EVENT LISTENERS =====

document.addEventListener("click", e => {
  const searchWrapper = document.querySelector(".al-search-wrapper");
  const resultsDiv = document.getElementById("alSearchResults");
  if (searchWrapper && resultsDiv && !searchWrapper.contains(e.target)) {
    resultsDiv.classList.add("hidden");
  }
});

// Auto-initialize autoloot state upon script load
initAutolootData();

// Expose public API
window.AUTOLOOT_CONFIG = AUTOLOOT_CONFIG;
window.initAutolootData = initAutolootData;
window.renderAutolootSidebar = renderAutolootSidebar;
window.renderAutolootMain = renderAutolootMain;

// ===== ROW / MENU HELPERS =====

function copySwapCommands(setId, e) {
  if (e) e.stopPropagation();
  const info = findSetInfo(setId);
  if (!info || !info.set || info.isArchived) {
    showToast('Assign this set to a slot first', 'warning');
    return;
  }
  const cmds = generateCommands(info.slotNum, info.set.items, getMaxAutolootItems(), !!info.set.autoload);
  navigator.clipboard.writeText(cmds.join('\n')).then(
    () => showToast(`Copied swap commands for Slot ${info.slotNum}`, 'success'),
    () => showToast('Copy failed', 'error')
  );
}
window.copySwapCommands = copySwapCommands;

function alToggleMenu(btn, e) {
  if (e) e.stopPropagation();
  const menu = btn.closest('.al-menu');
  const open = menu.classList.contains('open');
  document.querySelectorAll('.al-menu.open').forEach(m => m.classList.remove('open'));
  if (!open) menu.classList.add('open');
}
window.alToggleMenu = alToggleMenu;

document.addEventListener('click', e => {
  if (!e.target.closest('.al-menu')) document.querySelectorAll('.al-menu.open').forEach(m => m.classList.remove('open'));
});
