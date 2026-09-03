// bookmarks.js — Bookmarks tab: save quests, shops, and items for quick access

// ===== STORAGE =====

const BOOKMARKS_KEY = 'osromr_bookmarks';

function loadBookmarks() {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || []; }
  catch { return []; }
}

function saveBookmarks(list) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
}

// Each bookmark: { type: 'quest'|'shop'|'item', id: number, name: string, addedAt: number }

function bookmarkKey(type, id) {
  return `${type}:${id}`;
}

function isBookmarked(type, id) {
  return loadBookmarks().some(b => b.type === type && String(b.id) === String(id));
}

function addBookmark(type, id, name) {
  const list = loadBookmarks();
  const key  = bookmarkKey(type, id);
  if (list.some(b => bookmarkKey(b.type, b.id) === key)) return; // already exists
  list.push({ type, id: Number(id), name: name || String(id), addedAt: Date.now() });
  saveBookmarks(list);
}

function removeBookmark(type, id) {
  const list = loadBookmarks().filter(b => !(b.type === type && String(b.id) === String(id)));
  saveBookmarks(list);
}

function toggleBookmark(type, id, name) {
  if (isBookmarked(type, id)) {
    removeBookmark(type, id);
    return false;
  } else {
    addBookmark(type, id, name);
    return true;
  }
}

window.isBookmarked    = isBookmarked;
window.addBookmark     = addBookmark;
window.removeBookmark  = removeBookmark;
window.toggleBookmark  = toggleBookmark;

// ===== BOOKMARK BUTTON HELPER (called from quest/shop/item pages) =====

/**
 * Returns the HTML for an add/remove bookmark icon button.
 * @param {'quest'|'shop'|'item'} type
 * @param {number} id   — producesId or itemId
 * @param {string} name — display name to store
 */
function bookmarkButtonHtml(type, id, name) {
  const on  = isBookmarked(type, id);
  const esc = (s) => String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const iconOn  = window.SVG_ICONS?.bookmark14Filled || '';
  const iconOff = window.SVG_ICONS?.bookmark14 || '';
  const titleOn  = 'Remove bookmark';
  const titleOff = 'Add bookmark';
  return `<button
    class="bm-toggle-btn${on ? ' bm-toggle-btn--on' : ''}"
    data-bm-type="${type}"
    data-bm-id="${id}"
    title="${on ? titleOn : titleOff}"
    aria-label="${on ? titleOn : titleOff}"
    aria-pressed="${on}"
    onclick="bmToggleFromBtn(this, '${type}', ${id}, '${esc(name)}')"
  >${on ? iconOn : iconOff}</button>`;
}

window.bookmarkButtonHtml = bookmarkButtonHtml;

/**
 * Called from the inline button — toggles the bookmark and updates the button in place.
 */
function bmToggleFromBtn(btn, type, id, name) {
  const wasOn = isBookmarked(type, id);
  if (wasOn) {
    removeBookmark(type, id);
  } else {
    addBookmark(type, id, name);
  }
  const nowOn   = !wasOn;
  const iconOn  = window.SVG_ICONS?.bookmark14Filled || '';
  const iconOff = window.SVG_ICONS?.bookmark14 || '';
  btn.innerHTML = nowOn ? iconOn : iconOff;
  btn.title     = nowOn ? 'Remove bookmark' : 'Add bookmark';
  btn.setAttribute('aria-label', btn.title);
  btn.setAttribute('aria-pressed', nowOn);
  btn.classList.toggle('bm-toggle-btn--on', nowOn);

  if (typeof showToast === 'function') {
    showToast(nowOn ? 'Bookmark added' : 'Bookmark removed', 'success', 1800);
  }

  // Refresh bookmarks sidebar list if we're currently on that tab
  if (window.state?.currentTab === 'bookmarks') {
    renderBookmarksSidebar();
  }
}

window.bmToggleFromBtn = bmToggleFromBtn;

// ===== BOOKMARK PAGE RENDER =====

const BM_TYPE_LABELS = {
  quest: 'Quests',
  shop:  'Shops',
  item:  'Items',
};

const BM_TYPE_ORDER = ['quest', 'shop', 'item'];

function renderBookmarksSidebar() {
  const el = document.getElementById('bookmarksList');
  if (!el) return;

  const list = loadBookmarks();

  if (!list.length) {
    el.innerHTML = `
      <div class="bm-empty">
        <span class="bm-empty-icon">${window.SVG_ICONS?.tabBookmarks || ''}</span>
        <div class="bm-empty-label">No bookmarks yet</div>
        <div class="bm-empty-sub">Add bookmarks from quest, shop, or item pages</div>
      </div>`;
    return;
  }

  // Group by type
  const grouped = {};
  BM_TYPE_ORDER.forEach(t => { grouped[t] = []; });
  list.forEach(b => {
    if (grouped[b.type]) grouped[b.type].push(b);
  });

  let html = `
    <div class="bm-group">
      <div class="bm-row" style="margin-top: 8px;">
        <a class="bm-row-link" href="#" onclick="event.preventDefault(); renderBookmarksMain()">
          <span class="bm-row-icon">${window.SVG_ICONS?.tabBookmarks || ''}</span>
          <span class="bm-row-name" style="font-weight: bold;">Bookmarks List</span>
        </a>
      </div>
    </div>
  `;

  BM_TYPE_ORDER.forEach(type => {
    const items = grouped[type];
    if (!items.length) return;

    const rows = items.map(b => {
      const icon     = renderBookmarkIcon(b);
      const rawName  = String(b.name).replace(/<[^>]+>/g, '');
      const name     = escapeHtml(rawName);
      const href     = bmHref(b);
      const onclick  = bmOnclick(b);
      return `
        <div class="bm-row" data-type="${b.type}" data-id="${b.id}">
          <a class="bm-row-link" href="${href}" onclick="${onclick}" title="${name}">
            <span class="bm-row-icon">${icon}</span>
            <span class="bm-row-name">${name}</span>
            <span class="bm-row-link-icon">${window.SVG_ICONS?.openItem || ''}</span>
          </a>
        </div>`;
    }).join('');

    html += `
      <div class="bm-group">
        <div class="bm-group-label">${BM_TYPE_LABELS[type]}</div>
        ${rows}
      </div>`;
  });

  el.innerHTML = html;
}

function renderBookmarksMain() {
  const container = document.getElementById('mainContent');
  if (!container) return;

  const list = loadBookmarks();

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="bm-empty-icon" style="opacity: 0.25; margin-bottom: 12px; display: block;">${window.SVG_ICONS?.tabBookmarks || ''}</span>
        <h2>No Bookmarks</h2>
        <p>Add bookmarks from quest, shop, or item pages.</p>
      </div>`;
    return;
  }

  // Group by type
  const grouped = {};
  BM_TYPE_ORDER.forEach(t => { grouped[t] = []; });
  list.forEach(b => {
    if (grouped[b.type]) grouped[b.type].push(b);
  });

  const sortField = typeof state !== 'undefined' ? (state.bmSort || 'id') : 'id';
  const sortDir = typeof state !== 'undefined' ? (state.bmSortDir || 'asc') : 'asc';
  const viewMode = typeof state !== 'undefined' ? (state.bmViewMode || 'card') : 'card';

  function computeBmValue(b) {
    let displayVal = 0;
    let isCredit = false;

    if (b.type === 'shop') {
      const usage = typeof window.findItemUsage === 'function' ? window.findItemUsage(b.id) : { produces: [] };
      const shopMatch = usage.produces.find(u => u.type === 'shop');
      if (shopMatch && shopMatch.shop && Array.isArray(shopMatch.shop.requirements)) {
        const zReq = shopMatch.shop.requirements.find(r => r.type === 'zeny');
        const cReq = shopMatch.shop.requirements.find(r => r.type === 'credit');
        if (zReq) {
          displayVal = typeof window.applyDiscount === 'function' ? window.applyDiscount(Number(zReq.amount)||0) : (Number(zReq.amount)||0);
        } else if (cReq) {
          isCredit = true;
          displayVal = Number(cReq.amount)||0;
        }
      }
    } else if (b.type === 'quest') {
      const usage = typeof window.findItemUsage === 'function' ? window.findItemUsage(b.id) : { produces: [] };
      const questMatch = usage.produces.find(u => u.type === 'quest');
      if (questMatch && questMatch.quest && Array.isArray(questMatch.quest.requirements)) {
        const cReq = questMatch.quest.requirements.find(r => r.type === 'credit');
        if (cReq) {
          isCredit = true;
          displayVal = Number(cReq.amount)||0;
        }
      }
    } else {
      const itemData = typeof DATA !== 'undefined' && DATA.items && DATA.items[b.id];
      if (itemData && itemData.value > 0) {
        const v = typeof state !== 'undefined' ? state.valueMode : 'mixed';
        const mixedThresh = typeof MIXED_CREDIT_THRESHOLD !== 'undefined' ? MIXED_CREDIT_THRESHOLD : 10000000;
        if (v === 'credit' || (v === 'mixed' && itemData.value >= mixedThresh)) {
          isCredit = true;
          const cv = typeof getCreditValue === 'function' ? getCreditValue() : 10000000;
          displayVal = itemData.value / cv;
        } else {
          displayVal = itemData.value;
        }
      }
    }
    
    // For sorting purposes, normalize credits to zeny equivalents
    if (isCredit) {
      const cv = typeof getCreditValue === 'function' ? getCreditValue() : 10000000;
      return displayVal * cv;
    }
    return displayVal;
  }

  let html = `
    <div class="bookmarks-main">
      <div class="qvh">
        <div class="qvh-icon">${window.SVG_ICONS?.tabBookmarks || ''}</div>
        <div class="qvh-body">
          <div class="qvh-title-row">
            <span class="qvh-item-name">Bookmarks List</span>
          </div>
          <div class="qvh-meta">Manage your saved quests, shops, and items</div>
        </div>
      </div>
      <div class="bm-controls-bar">
        <div class="bm-controls-left">
          <label>Sort:</label>
          <select onchange="window.changeBmSort(this.value)" class="bm-select">
            <option value="id" ${sortField === 'id' ? 'selected' : ''}>ID</option>
            <option value="name" ${sortField === 'name' ? 'selected' : ''}>Name</option>
            <option value="value" ${sortField === 'value' ? 'selected' : ''}>Value</option>
          </select>
          <button onclick="window.toggleBmSortDir()" class="bm-icon-btn" title="Toggle Sort Direction">
            ${sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
        <div class="bm-controls-right">
          <button class="bm-icon-btn ${viewMode === 'list' ? 'active' : ''}" onclick="window.toggleBmViewMode('list')" title="List View">
            List
          </button>
          <button class="bm-icon-btn ${viewMode === 'card' ? 'active' : ''}" onclick="window.toggleBmViewMode('card')" title="Card View">
            Card
          </button>
        </div>
      </div>
  `;
  
  BM_TYPE_ORDER.forEach(type => {
    const items = grouped[type];
    if (!items.length) return;

    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = String(a.name).localeCompare(String(b.name));
      } else if (sortField === 'value') {
        cmp = computeBmValue(a) - computeBmValue(b);
      } else {
        cmp = a.id - b.id;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    const listClass = viewMode === 'list' ? 'bm-main-list list-view' : 'bm-main-list';

    html += `
      <div class="bm-main-group">
        <h3>${BM_TYPE_LABELS[type]}</h3>
        <div class="${listClass}">
    `;

    items.forEach(b => {
      // 48px icon for detailed view (matching qvh-icon)
      let icon = '';
      if (b.type === 'item' || b.type === 'quest' || b.type === 'shop') {
        if (typeof renderItemIcon === 'function') icon = renderItemIcon(b.id, 48).replace(/title="[^"]+"/g, '');
      }
      if (!icon) icon = window.SVG_ICONS?.bookmark14 || '';

      const rawName = String(b.name).replace(/<[^>]+>/g, '');
      const name = escapeHtml(rawName);
      const href = bmHref(b);
      const onclick = bmOnclick(b);
      const itemData = typeof DATA !== 'undefined' && DATA.items && DATA.items[b.id];
      const rawDesc = itemData && itemData.desc ? itemData.desc : '';
      const descriptionHtml = typeof parseDescription === 'function' ? parseDescription(rawDesc) : rawDesc;
      
      // Strip HTML tags for the title attribute to prevent tooltip issues
      const plainDesc = rawDesc.replace(/\^[a-fA-F0-9]{6}/g, '').replace(/<[^>]+>/g, '').replace(/"/g, '&quot;');

      let footerHtml = '';
      let valueHtml = '';
      let usageHtml = '';

      let displayVal = 0;
      let isCredit = false;

      if (b.type === 'shop') {
        const usage = typeof window.findItemUsage === 'function' ? window.findItemUsage(b.id) : { produces: [] };
        const shopMatch = usage.produces.find(u => u.type === 'shop');
        if (shopMatch && shopMatch.shop && Array.isArray(shopMatch.shop.requirements)) {
          const zReq = shopMatch.shop.requirements.find(r => r.type === 'zeny');
          const cReq = shopMatch.shop.requirements.find(r => r.type === 'credit');
          if (zReq) {
            displayVal = typeof window.applyDiscount === 'function' ? window.applyDiscount(Number(zReq.amount)||0) : (Number(zReq.amount)||0);
          } else if (cReq) {
            isCredit = true;
            displayVal = Number(cReq.amount)||0;
          }
        }
      } else if (b.type === 'quest') {
        const usage = typeof window.findItemUsage === 'function' ? window.findItemUsage(b.id) : { produces: [] };
        const questMatch = usage.produces.find(u => u.type === 'quest');
        if (questMatch && questMatch.quest && Array.isArray(questMatch.quest.requirements)) {
          const cReq = questMatch.quest.requirements.find(r => r.type === 'credit');
          if (cReq) {
            isCredit = true;
            displayVal = Number(cReq.amount)||0;
          }
        }
      } else if (itemData && itemData.value > 0) {
        const v = typeof state !== 'undefined' ? state.valueMode : 'mixed';
        const mixedThresh = typeof MIXED_CREDIT_THRESHOLD !== 'undefined' ? MIXED_CREDIT_THRESHOLD : 10000000;
        if (v === 'credit' || (v === 'mixed' && itemData.value >= mixedThresh)) {
          isCredit = true;
          const cv = typeof getCreditValue === 'function' ? getCreditValue() : 10000000;
          displayVal = itemData.value / cv;
        } else {
          displayVal = itemData.value;
        }
      }

      if (displayVal > 0) {
        const creditId = typeof SPECIAL_ITEMS !== 'undefined' ? SPECIAL_ITEMS.CREDIT : 3100;
        const iconHtml = isCredit 
          ? (typeof renderItemIcon === 'function' ? renderItemIcon(creditId, 20).replace(/title="[^"]+"/g, '') : '')
          : (typeof renderItemIcon === 'function' ? renderItemIcon(1, 20).replace(/title="[^"]+"/g, '') : '');
          
        const valStr = typeof formatZenyCompact === 'function' ? formatZenyCompact(displayVal) : displayVal.toLocaleString();
        
        valueHtml = `
          <div class="bm-main-value" title="${isCredit ? 'Credit Value' : 'Zeny Value'}">
            ${iconHtml}
            <span>${valStr}</span>
          </div>
        `;
      }

        const usage = typeof window.findItemUsage === 'function' ? window.findItemUsage(b.id) : { produces: [] };
        if (usage.produces && usage.produces.length > 0) {
          const usagesRendered = usage.produces.map(u => {
            const isQuest = u.type === 'quest';
            const typeLabel = isQuest ? 'Quest' : 'Shop';
            const sourceName = isQuest ? u.quest.name : u.shop.name;
            const tooltip = `${u.subgroup.name} › ${sourceName}`;
            const href = isQuest ? `?quest=${u.quest.producesId}` : `?shop=${u.shop.producesId}`;
            const onclick = isQuest
              ? `window.navigateToQuest(${u.groupIdx}, ${u.subIdx}, ${u.questIdx})`
              : `window.navigateToShop(${u.groupIdx}, ${u.subIdx}, ${u.shopIdx})`;
            const iconId = isQuest ? 3 : 5;
            const iconStr = typeof renderItemIcon === 'function' ? renderItemIcon(iconId, 20).replace(/title="[^"]+"/g, '') : `[${typeLabel}]`;
            
            return `<a class="bm-main-usage-icon" href="${href}" onclick="event.preventDefault(); ${onclick}" title="${escapeHtml(tooltip)}">${iconStr}</a>`;
          }).join('');
          usageHtml = `<div class="bm-main-usages">${usagesRendered}</div>`;
        }

      const actionsHtml = `
        <div class="bm-main-actions">
          <button class="bm-main-remove-btn" title="Remove bookmark"
                  onclick="bmRemoveFromMain('${b.type}', ${b.id})"
                  aria-label="Remove bookmark"
          >
            ${window.SVG_ICONS?.trashNoX14 || '×'}
          </button>
        </div>
      `;

      footerHtml = `
        <div class="bm-main-footer">
          ${valueHtml}
          ${usageHtml}
          ${actionsHtml}
        </div>
      `;

      html += `
        <div class="bm-main-row" data-type="${b.type}" data-id="${b.id}">
          <div class="bm-main-row-body">
            <div class="bm-main-info">
              <a class="bm-main-icon" href="${href}" onclick="${onclick}" title="Go to ${name}">${icon}</a>
              <div class="bm-main-content">
                <div class="bm-main-title-row">
                  <a class="bm-main-name" href="${href}" onclick="${onclick}" title="Go to ${name}">${name}</a>
                  <span class="bm-main-id">#${b.id}</span>
                </div>
                <div class="bm-main-desc-container" onclick="if(this.classList.contains('is-clamped')) this.classList.toggle('expanded')">
                  <div class="bm-main-desc">${descriptionHtml || '<em>No description available</em>'}</div>
                  <div class="bm-main-desc-overlay"></div>
                </div>
              </div>
            </div>
          </div>
          ${footerHtml}
        </div>
      `;
    });

    html += `</div></div>`;
  });

  html += `</div>`;
  container.innerHTML = html;

  // Post-render check: Add 'is-clamped' class to descriptions that exceed 7 lines
  const descContainers = container.querySelectorAll('.bm-main-desc-container');
  descContainers.forEach(el => {
    const desc = el.querySelector('.bm-main-desc');
    if (desc && desc.scrollHeight > desc.clientHeight) {
      el.classList.add('is-clamped');
    }
  });
}

function bmRemoveFromMain(type, id) {
  removeBookmark(type, id);
  _bmRefreshContentBtn(type, id, false);
  renderBookmarksSidebar();
  renderBookmarksMain();
}

function renderBookmarkIcon(b) {
  if (b.type === 'item' || b.type === 'quest' || b.type === 'shop') {
    // Use item icon for all three types (producesId is an item ID)
    if (typeof renderItemIcon === 'function') {
      return renderItemIcon(b.id, 24);
    }
  }
  return window.SVG_ICONS?.bookmark14 || '';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function bmHref(b) {
  if (b.type === 'quest') return `?quest=${b.id}`;
  if (b.type === 'shop')  return `?shop=${b.id}`;
  if (b.type === 'item')  return `?item=${b.id}`;
  return '#';
}

function bmOnclick(b) {
  if (b.type === 'quest') return `event.preventDefault(); bmNavigateQuest(${b.id})`;
  if (b.type === 'shop')  return `event.preventDefault(); bmNavigateShop(${b.id})`;
  if (b.type === 'item')  return `event.preventDefault(); bmNavigateItem(${b.id})`;
  return 'event.preventDefault()';
}

// Navigation helpers — resolve id → navigate
function bmNavigateQuest(id) {
  if (window.state?.currentTab !== 'quests' && typeof window.switchTab === 'function') {
    window.switchTab('quests', false);
  }
  if (typeof window.selectQuestById === 'function') {
    window.selectQuestById(String(id), true);
  }
}

function bmNavigateShop(id) {
  if (window.state?.currentTab !== 'shops' && typeof window.switchTab === 'function') {
    window.switchTab('shops', false);
  }
  if (typeof window.selectShopById === 'function') {
    window.selectShopById(String(id), true);
  }
}

function bmNavigateItem(id) {
  if (typeof window.navigateToItem === 'function') {
    window.navigateToItem(id);
  }
}

function bmRemoveFromSidebar(type, id) {
  removeBookmark(type, id);
  // Update the bookmark toggle button on the currently visible content pane (if any)
  _bmRefreshContentBtn(type, id, false);
  // Re-render the sidebar list
  renderBookmarksSidebar();
}

function _bmRefreshContentBtn(type, id, isOn) {
  const btn = document.querySelector(`.bm-toggle-btn[data-bm-type="${type}"][data-bm-id="${id}"]`);
  if (!btn) return;
  const iconOn  = window.SVG_ICONS?.bookmark14Filled || '';
  const iconOff = window.SVG_ICONS?.bookmark14 || '';
  btn.innerHTML = isOn ? iconOn : iconOff;
  btn.title = isOn ? 'Remove bookmark' : 'Add bookmark';
  btn.setAttribute('aria-label', btn.title);
  btn.setAttribute('aria-pressed', isOn);
  btn.classList.toggle('bm-toggle-btn--on', isOn);
}

window.bmNavigateQuest   = bmNavigateQuest;
window.bmNavigateShop    = bmNavigateShop;
window.bmNavigateItem    = bmNavigateItem;
window.bmRemoveFromSidebar = bmRemoveFromSidebar;
window.bmRemoveFromMain  = bmRemoveFromMain;

window.toggleBmViewMode = function(mode) {
  if (typeof state !== 'undefined' && typeof saveConfig === 'function') {
    state.bmViewMode = mode;
    saveConfig({ bmViewMode: mode });
    renderBookmarksMain();
  }
};

window.changeBmSort = function(criteria) {
  if (typeof state !== 'undefined' && typeof saveConfig === 'function') {
    state.bmSort = criteria;
    saveConfig({ bmSort: criteria });
    renderBookmarksMain();
  }
};

window.toggleBmSortDir = function() {
  if (typeof state !== 'undefined' && typeof saveConfig === 'function') {
    const newDir = state.bmSortDir === 'asc' ? 'desc' : 'asc';
    state.bmSortDir = newDir;
    saveConfig({ bmSortDir: newDir });
    renderBookmarksMain();
  }
};
window.renderBookmarksSidebar = renderBookmarksSidebar;
window.renderBookmarksMain = renderBookmarksMain;
