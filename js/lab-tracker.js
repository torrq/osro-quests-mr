(function() {
  const TRACKER_STORAGE_KEY = 'osromr_lab_tracker_v1';
  
  let trackerState = {
    deposits: {},
    unlocks: {}
  };
  
  let currentSearchQuery = "";
  let currentFilter = "all"; // 'all' | 'need' | 'want' | 'done'
  let currentClassFilter = "all"; // 'all' | 'card' | 'equipment' | 'costume'
  
  let sortState = {
    key: "default", // 'default', 'have', 'want', 'name', 'effect', 'class'
    dir: "asc"      // 'asc', 'desc'
  };
  
  let lastTab = "";
  function checkTabChange(currentTabName) {
    if (lastTab !== currentTabName) {
      lastTab = currentTabName;
      currentSearchQuery = "";
      currentFilter = "all";
      currentClassFilter = "all";
      sortState = { key: "default", dir: "asc" };
    }
  }
  
  function loadTrackerState() {
    try {
      const stored = localStorage.getItem(TRACKER_STORAGE_KEY);
      if (stored) {
        trackerState = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load tracker state", e);
    }
    if (!trackerState.deposits) trackerState.deposits = {};
    if (!trackerState.unlocks) trackerState.unlocks = {};
  }
  
  function saveTrackerState() {
    try {
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(trackerState));
    } catch (e) {
      console.error("Failed to save tracker state", e);
    }
  }

  function getItemCategory(itemId, itemClass, itemName) {
    if (!itemClass) itemClass = "";
    const lowerClass = itemClass.toLowerCase();
    if (lowerClass.includes("card")) return "Card";
    if (lowerClass.includes("costume")) return "Costume";
    
    const lowerName = (itemName || "").toLowerCase();
    if (lowerName.includes("costume") || lowerName.includes("chibi")) return "Costume";
    
    const idNum = parseInt(itemId);
    if (idNum >= 20000 && idNum < 30000) {
      if (!lowerClass.includes("card") && !lowerName.includes("card")) {
        return "Costume";
      }
    }
    
    return "Equipment";
  }

  // Aggregate stats from checked items in both lists
  function getAggregatedStats() {
    const totalStats = {};
    const totalUnparsed = [];

    const processList = (listName, subState) => {
      const listData = DATA.itemLists?.find(l => l.name === listName);
      if (!listData || !listData.items) return;
      
      listData.items.forEach(id => {
        if (subState[id]?.have) {
          const effectText = listData.effects?.[id];
          if (effectText) {
            const { stats, unparsed } = parseEffect(effectText);
            for (const [stat, val] of Object.entries(stats)) {
              if (!totalStats[stat]) {
                totalStats[stat] = { value: 0, sources: [] };
              }
              totalStats[stat].value += val;
              const itemInfo = DATA.items[id];
              totalStats[stat].sources.push({
                itemId: id,
                itemName: itemInfo ? itemInfo.name : `Item #${id}`,
                listName: listName,
                value: val
              });
            }
            unparsed.forEach(u => {
              const itemInfo = DATA.items[id];
              totalUnparsed.push({
                effectText: u,
                itemId: id,
                itemName: itemInfo ? itemInfo.name : `Item #${id}`,
                listName: listName
              });
            });
          }
        }
      });
    };

    processList("Deposit List", trackerState.deposits);
    processList("Unlock List", trackerState.unlocks);

    return { parsed: totalStats, unparsed: totalUnparsed };
  }

  function getListCounts(listName, subState) {
    const listData = DATA.itemLists?.find(l => l.name === listName);
    if (!listData || !listData.items) return { have: 0, want: 0, total: 0 };
    
    let have = 0;
    let want = 0;
    listData.items.forEach(id => {
      if (subState[id]?.have) have++;
      if (subState[id]?.want) want++;
    });
    
    return { have, want, total: listData.items.length };
  }

  // ===== RENDER DASHBOARD =====
  function trackerRenderDashboard() {
    checkTabChange("dashboard");
    loadTrackerState();
    const mainContainer = document.getElementById('mainContent');
    if (!mainContainer) return;
    
    const depCounts = getListCounts("Deposit List", trackerState.deposits);
    const unlCounts = getListCounts("Unlock List", trackerState.unlocks);
    
    const depPct = depCounts.total ? Math.round((depCounts.have / depCounts.total) * 100) : 0;
    const unlPct = unlCounts.total ? Math.round((unlCounts.have / unlCounts.total) * 100) : 0;
    
    const { parsed, unparsed } = getAggregatedStats();
    
    let statsHtml = "";
    if (Object.keys(parsed).length === 0 && unparsed.length === 0) {
      statsHtml = `<div class="empty-msg-centered" style="padding: 10px;">Check items as 'Have' in the lists to see aggregated stat bonuses here.</div>`;
    } else {
      statsHtml += `<div class="dt-stats-grid">`;
      const sortedKeys = Object.keys(parsed).sort();
      sortedKeys.forEach(stat => {
        const isPercent = stat.includes('%');
        const displayName = isPercent ? stat.replace('%', '').trim() : stat;
        const suffix = isPercent ? '%' : '';
        const data = parsed[stat];
        const sign = data.value >= 0 ? '+' : '';
        
        // Sort sources by list name (Deposit first), then alphabetically by item name
        const sortedSources = [...data.sources].sort((a, b) => {
          if (a.listName !== b.listName) {
            return a.listName === 'Deposit List' ? -1 : 1;
          }
          return a.itemName.localeCompare(b.itemName);
        });
        
        statsHtml += `
          <div class="dt-stat-item" onclick="window.toggleTrackerStatDetail(this)">
            <div class="dt-stat-summary">
              <div class="dt-stat-summary-info">
                <span class="dt-stat-name">${displayName}</span>
                <span class="dt-stat-val">${sign}${data.value}${suffix}</span>
              </div>
              <span class="dt-stat-summary-arrow">▶</span>
            </div>
            <div class="dt-stat-details" style="display: none;">
              ${sortedSources.map(src => `
                <div class="dt-unparsed-card" style="margin-top: 4px; padding: 6px 10px; cursor: default;" onclick="event.stopPropagation()">
                  <div class="dt-unparsed-header" style="font-size: 11px;">
                    <span class="dt-unparsed-text" style="font-size: 11px; font-weight: normal; color: var(--accent);">${displayName}: ${src.value >= 0 ? '+' : ''}${src.value}${suffix}</span>
                    <span class="dt-unparsed-badge badge--${src.listName === 'Deposit List' ? 'deposit' : 'unlock'}" style="font-size: 8px; padding: 1px 4px;">
                      ${src.listName === 'Deposit List' ? 'Deposit' : 'Unlock'}
                    </span>
                  </div>
                  <div class="dt-unparsed-source" style="font-size: 11px; margin-top: 3px;">
                    <span class="dt-unparsed-icon">${renderItemIcon(src.itemId)}</span>
                    <a href="#" onclick="window.navigateToTrackerItem(${src.itemId}); return false;" class="item-link" style="font-size: 11px;">${src.itemName}</a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      });
      statsHtml += `</div>`;
      
      if (unparsed.length > 0) {
        const sortedUnparsed = [...unparsed].sort((a, b) => {
          const listCompare = a.listName.localeCompare(b.listName);
          if (listCompare !== 0) return listCompare;
          const nameCompare = a.itemName.localeCompare(b.itemName);
          if (nameCompare !== 0) return nameCompare;
          return a.effectText.localeCompare(b.effectText);
        });
        statsHtml += `
          <div class="dt-other-effects">
            <div class="dt-unparsed-title">Special Effects</div>
            <div class="dt-unparsed-list">
              ${sortedUnparsed.map(item => `
                <div class="dt-unparsed-card">
                  <div class="dt-unparsed-header">
                    <span class="dt-unparsed-text">${item.effectText}</span>
                    <span class="dt-unparsed-badge badge--${item.listName === 'Deposit List' ? 'deposit' : 'unlock'}">
                      ${item.listName === 'Deposit List' ? 'Deposit' : 'Unlock'}
                    </span>
                  </div>
                  <div class="dt-unparsed-source">
                    <span class="dt-unparsed-icon">${renderItemIcon(item.itemId)}</span>
                    <a href="#" onclick="window.navigateToTrackerItem(${item.itemId}); return false;" class="item-link">${item.itemName}</a>
                    <span class="item-row-id" style="margin-left: 4px;">#${item.itemId}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    }

    mainContainer.innerHTML = `
      <div class="lab-main">
        <div class="lab-section">
          <div class="lab-section-header">
            <span class="lab-section-title">
              <span class="lab-section-icon" data-svg-icon="tracker14"></span>
              Deposit & Unlock Tracker
            </span>
            <span class="lab-section-meta">Track your card unlocks and equipment deposits!</span>
          </div>
          
          <div class="dt-dashboard">
            <div class="dt-cards-container">
              <!-- Deposits Card -->
              <div class="dt-progress-card">
                <span class="dt-card-title">Equipment & Costume Deposits</span>
                <div class="dt-card-stats">
                  <span>Progress: <strong>${depCounts.have} / ${depCounts.total}</strong> (${depPct}%)</span>
                  <span>Want: <strong>${depCounts.want}</strong></span>
                </div>
                <div class="dt-progress-bar">
                  <div class="dt-progress-fill" style="width: ${depPct}%"></div>
                </div>
                <a href="#" class="dt-card-link" onclick="switchTab('lab-tracker-deposits'); return false;">View & Edit Deposits →</a>
              </div>
              
              <!-- Unlocks Card -->
              <div class="dt-progress-card">
                <span class="dt-card-title">Card Unlocks</span>
                <div class="dt-card-stats">
                  <span>Progress: <strong>${unlCounts.have} / ${unlCounts.total}</strong> (${unlPct}%)</span>
                  <span>Want: <strong>${unlCounts.want}</strong></span>
                </div>
                <div class="dt-progress-bar">
                  <div class="dt-progress-fill" style="width: ${unlPct}%"></div>
                </div>
                <a href="#" class="dt-card-link" onclick="switchTab('lab-tracker-unlocks'); return false;">View & Edit Unlocks →</a>
              </div>
            </div>
            
            <div class="dt-stats-summary">
              <span class="dt-card-title">Active Bonuses</span>
              ${statsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
    
    if (window.applySvgIcons) window.applySvgIcons(mainContainer);
  }

  function getSortIndicator(key) {
    if (sortState.key !== key) return ' <span class="dt-sort-arrow">↕</span>';
    return sortState.dir === 'asc' ? ' <span class="dt-sort-arrow">▲</span>' : ' <span class="dt-sort-arrow">▼</span>';
  }

  // ===== RENDER LIST VIEW =====
  function trackerRenderList(listName, subState) {
    checkTabChange(listName);
    loadTrackerState();
    const mainContainer = document.getElementById('mainContent');
    if (!mainContainer) return;
    
    // Check if the search input is currently focused
    const searchActive = document.activeElement && document.activeElement.classList.contains('dt-search-input');
    const cursorStart = searchActive ? document.activeElement.selectionStart : 0;
    const cursorEnd = searchActive ? document.activeElement.selectionEnd : 0;
    
    const listData = DATA.itemLists?.find(l => l.name === listName);
    if (!listData) {
      mainContainer.innerHTML = `<div class="empty-msg-centered">Error: ${listName} data not loaded.</div>`;
      return;
    }
    
    const isDeposit = listName === "Deposit List";
    
    // Resolve all item details
    const items = listData.items.map(id => {
      const itemInfo = DATA.items[id];
      return {
        id: id,
        name: itemInfo ? itemInfo.name : `Item #${id}`,
        desc: itemInfo ? itemInfo.desc : "",
        effect: listData.effects?.[id] || "",
        class: listData.classes?.[id] || ""
      };
    });
    
    // Filter
    let filtered = items.filter(item => {
      // Search
      const searchMatch = !currentSearchQuery || 
        item.name.toLowerCase().includes(currentSearchQuery) || 
        item.id.toString().includes(currentSearchQuery) ||
        item.effect.toLowerCase().includes(currentSearchQuery);
      
      if (!searchMatch) return false;
      
      // Filter status
      const isHave = !!subState[item.id]?.have;
      const isWant = !!subState[item.id]?.want;
      
      if (currentFilter === "need") {
        if (isHave) return false;
      } else if (currentFilter === "want") {
        if (!isWant) return false;
      } else if (currentFilter === "done") {
        if (!isHave) return false;
      }
      
      // Filter category (only for Deposits)
      if (isDeposit && currentClassFilter !== "all") {
        const cat = getItemCategory(item.id, item.class, item.name).toLowerCase();
        if (cat !== currentClassFilter) return false;
      }
      
      return true;
    });
    
    // Sort
    filtered.sort((a, b) => {
      let valA, valB;
      
      if (sortState.key === "default") {
        const haveA = subState[a.id]?.have ? 1 : 0;
        const haveB = subState[b.id]?.have ? 1 : 0;
        if (haveA !== haveB) return haveB - haveA;
        
        const wantA = subState[a.id]?.want ? 1 : 0;
        const wantB = subState[b.id]?.want ? 1 : 0;
        if (wantA !== wantB) return wantB - wantA;
        
        return a.name.localeCompare(b.name);
      }
      
      if (sortState.key === "have") {
        valA = subState[a.id]?.have ? 1 : 0;
        valB = subState[b.id]?.have ? 1 : 0;
      } else if (sortState.key === "want") {
        valA = subState[a.id]?.want ? 1 : 0;
        valB = subState[b.id]?.want ? 1 : 0;
      } else if (sortState.key === "name") {
        valA = a.name;
        valB = b.name;
      } else if (sortState.key === "effect") {
        valA = a.effect;
        valB = b.effect;
      } else if (sortState.key === "class") {
        valA = getItemCategory(a.id, a.class, a.name);
        valB = getItemCategory(b.id, b.class, b.name);
      } else if (sortState.key === "id") {
        valA = a.id;
        valB = b.id;
      }
      
      if (typeof valA === "string") {
        const cmp = valA.localeCompare(valB);
        return sortState.dir === "asc" ? cmp : -cmp;
      } else {
        const diff = valA - valB;
        if (diff !== 0) return sortState.dir === "asc" ? diff : -diff;
        return a.name.localeCompare(b.name);
      }
    });
    
    const counts = getListCounts(listName, subState);
    const pct = counts.total ? Math.round((counts.have / counts.total) * 100) : 0;
    
    const tableRows = filtered.map(item => {
      const isHave = !!subState[item.id]?.have;
      const isWant = !!subState[item.id]?.want;
      const catClass = getItemCategory(item.id, item.class, item.name);
      
      return `
        <tr class="dt-row ${isHave ? 'dt-row--have' : ''} ${isWant ? 'dt-row--want' : ''}" id="dt-row-${item.id}">
          <td class="dt-col-check">
            <input type="checkbox" class="dt-checkbox" ${isHave ? 'checked' : ''} 
              onchange="window.toggleTrackerHave('${listName}', ${item.id}, this.checked)">
          </td>
          <td class="dt-col-star">
            <button class="dt-star-btn ${isWant ? 'active' : ''}" id="dt-star-${item.id}"
              onclick="window.toggleTrackerWant('${listName}', ${item.id})">
              ${isWant ? '★' : '☆'}
            </button>
          </td>
          <td class="dt-col-icon">
            ${renderItemIcon(item.id)}
          </td>
          <td class="dt-col-item">
            <a href="#" onclick="window.navigateToTrackerItem(${item.id}); return false;" class="item-link">${item.name}</a>
          </td>
          <td class="dt-col-effect">
            ${item.effect}
          </td>
          <td class="dt-col-id">
            ${item.id}
          </td>
          ${isDeposit ? `<td class="dt-col-class">${catClass}</td>` : ''}
        </tr>
      `;
    }).join('');

    let classFilterHtml = "";
    if (isDeposit) {
      classFilterHtml = `
        <div class="dt-class-filters">
          <button class="dt-class-btn ${currentClassFilter === 'all' ? 'active' : ''}" onclick="window.setTrackerClassFilter('Deposit List', 'all')">All</button>
          <button class="dt-class-btn ${currentClassFilter === 'card' ? 'active' : ''}" onclick="window.setTrackerClassFilter('Deposit List', 'card')">Cards</button>
          <button class="dt-class-btn ${currentClassFilter === 'equipment' ? 'active' : ''}" onclick="window.setTrackerClassFilter('Deposit List', 'equipment')">Equip</button>
          <button class="dt-class-btn ${currentClassFilter === 'costume' ? 'active' : ''}" onclick="window.setTrackerClassFilter('Deposit List', 'costume')">Costume</button>
        </div>
      `;
    }

    mainContainer.innerHTML = `
      <div class="lab-main">
        <div class="lab-section">
          <div class="lab-section-header" style="position: relative; display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; gap: 16px; width: 100%;">
            <div style="display: flex; flex-direction: column; gap: 3px; flex-grow: 1;">
              <span class="lab-section-title">
                <span class="lab-section-icon" data-svg-icon="tracker14"></span>
                ${isDeposit ? "Equipment & Costume Deposits" : "Card Unlocks"}
              </span>
              <span class="lab-section-meta">${counts.have} of ${counts.total} collected (${pct}%) — ${counts.want} wanted</span>
            </div>
            <div style="display: flex; gap: 8px; align-self: flex-start; margin-top: 2px; align-items: center;">
              <span style="font-size: 11px; cursor: pointer; color: #50e3c2; text-decoration: underline;" onclick="window.trackerSelectAll('${listName}')" title="Mark all items as Have">Select All</span>
              <span style="font-size: 11px; cursor: pointer; color: #ff6b6b; text-decoration: underline;" onclick="window.trackerClearAll('${listName}')" title="Mark all items as Not Have">Clear All</span>
              <button class="dt-export-btn" onclick="window.importTrackerFromCsv('${listName}')">
                Import CSV
              </button>
              <button class="dt-export-btn" onclick="window.exportTrackerToCsv('${listName}')">
                Export CSV
              </button>
            </div>
          </div>
          
          <div class="dt-toolbar">
            <div class="dt-search-wrapper">
              <span class="dt-search-icon">🔍</span>
              <input type="text" class="dt-search-input" placeholder="Search by name or ID…" 
                value="${currentSearchQuery}" oninput="window.handleTrackerSearch('${listName}', this.value)">
              <button class="btn btn-sm" onclick="window.clearTrackerSearch('${listName}')" 
                style="padding: 0 5px; height: 20px; line-height: 1; margin-left: 4px; flex-shrink: 0;" title="Clear search">×</button>
            </div>
            
            ${classFilterHtml}
            
            <div class="dt-filter-bar">
              <button class="dt-filter-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="window.setTrackerFilter('${listName}', 'all')">All</button>
              <button class="dt-filter-btn ${currentFilter === 'need' ? 'active' : ''}" onclick="window.setTrackerFilter('${listName}', 'need')">Need</button>
              <button class="dt-filter-btn ${currentFilter === 'want' ? 'active' : ''}" onclick="window.setTrackerFilter('${listName}', 'want')">Want</button>
              <button class="dt-filter-btn ${currentFilter === 'done' ? 'active' : ''}" onclick="window.setTrackerFilter('${listName}', 'done')">Done</button>
            </div>
          </div>
          
          <div class="dt-table-wrapper">
            <table class="dt-table">
              <thead>
                <tr>
                  <th class="dt-col-check dt-sortable" onclick="window.handleTrackerSort('${listName}', 'have')">Have${getSortIndicator('have')}</th>
                  <th class="dt-col-star dt-sortable" onclick="window.handleTrackerSort('${listName}', 'want')">Want${getSortIndicator('want')}</th>
                  <th class="dt-col-icon">Icon</th>
                  <th class="dt-col-item dt-sortable" onclick="window.handleTrackerSort('${listName}', 'name')">Item Name${getSortIndicator('name')}</th>
                  <th class="dt-col-effect dt-sortable" onclick="window.handleTrackerSort('${listName}', 'effect')">Effect${getSortIndicator('effect')}</th>
                  <th class="dt-col-id dt-sortable" onclick="window.handleTrackerSort('${listName}', 'id')">ID${getSortIndicator('id')}</th>
                  ${isDeposit ? `<th class="dt-col-class dt-sortable" onclick="window.handleTrackerSort('${listName}', 'class')">Class${getSortIndicator('class')}</th>` : ''}
                </tr>
              </thead>
              <tbody>
                ${tableRows || `<tr><td colspan="${isDeposit ? 7 : 6}" class="empty-msg-centered">No items found matching the filter.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    if (window.applySvgIcons) window.applySvgIcons(mainContainer);
    
    if (searchActive) {
      const searchInput = mainContainer.querySelector('.dt-search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.setSelectionRange(cursorStart, cursorEnd);
      }
    }
  }

  function trackerRenderDeposits() {
    trackerRenderList("Deposit List", trackerState.deposits);
  }

  function trackerRenderUnlocks() {
    trackerRenderList("Unlock List", trackerState.unlocks);
  }

  // ===== GLOBAL INTERACTION HANDLERS =====

  window.toggleTrackerHave = function(listName, itemId, checked) {
    loadTrackerState();
    const subState = listName === "Deposit List" ? trackerState.deposits : trackerState.unlocks;
    if (!subState[itemId]) subState[itemId] = {};
    subState[itemId].have = checked;
    saveTrackerState();
    
    const row = document.getElementById(`dt-row-${itemId}`);
    if (row) {
      if (checked) row.classList.add('dt-row--have');
      else row.classList.remove('dt-row--have');
    }
  };

  window.toggleTrackerWant = function(listName, itemId) {
    loadTrackerState();
    const subState = listName === "Deposit List" ? trackerState.deposits : trackerState.unlocks;
    if (!subState[itemId]) subState[itemId] = {};
    
    const isWant = !subState[itemId].want;
    subState[itemId].want = isWant;
    saveTrackerState();
    
    const row = document.getElementById(`dt-row-${itemId}`);
    if (row) {
      if (isWant) row.classList.add('dt-row--want');
      else row.classList.remove('dt-row--want');
    }
    
    const starBtn = document.getElementById(`dt-star-${itemId}`);
    if (starBtn) {
      if (isWant) {
        starBtn.classList.add('active');
        starBtn.textContent = '★';
      } else {
        starBtn.classList.remove('active');
        starBtn.textContent = '☆';
      }
    }
  };

  let searchTimeout = null;
  window.handleTrackerSearch = function(listName, query) {
    currentSearchQuery = query.toLowerCase();
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (listName === "Deposit List") trackerRenderDeposits();
      else trackerRenderUnlocks();
      
      const input = document.querySelector('.dt-search-input');
      if (input) {
        input.focus();
        const val = input.value;
        input.value = '';
        input.value = val;
      }
    }, 200);
  };

  window.clearTrackerSearch = function(listName) {
    currentSearchQuery = "";
    if (searchTimeout) clearTimeout(searchTimeout);
    if (listName === "Deposit List") trackerRenderDeposits();
    else trackerRenderUnlocks();
  };

  window.trackerSelectAll = function(listName) {
    if (!confirm(`Are you sure you want to mark ALL items in ${listName} as 'Have'?`)) return;
    const stateKey = listName === "Deposit List" ? "deposits" : "unlocks";
    const subState = trackerState[stateKey];
    const listData = getListData(listName);
    if (!listData) return;
    
    listData.items.forEach(id => {
      if (!subState[id]) subState[id] = { have: false, want: false };
      subState[id].have = true;
    });
    
    saveTrackerState();
    trackerRenderDashboard();
  };

  window.trackerClearAll = function(listName) {
    if (!confirm(`Are you sure you want to clear all progress for ${listName}? This action cannot be undone.`)) {
      return;
    }
    const stateKey = listName === "Deposit List" ? "deposits" : "unlocks";
    const subState = trackerState[stateKey];
    const listData = getListData(listName);
    if (!listData) return;
    
    listData.items.forEach(id => {
      if (subState[id]) {
        subState[id].have = false;
      }
    });
    
    saveTrackerState();
    trackerRenderDashboard();
  };

  window.setTrackerFilter = function(listName, filter) {
    currentFilter = filter;
    if (listName === "Deposit List") trackerRenderDeposits();
    else trackerRenderUnlocks();
  };

  window.setTrackerClassFilter = function(listName, filter) {
    currentClassFilter = filter;
    trackerRenderDeposits();
  };

  window.handleTrackerSort = function(listName, key) {
    if (sortState.key === key) {
      sortState.dir = sortState.dir === "asc" ? "desc" : "asc";
    } else {
      sortState.key = key;
      sortState.dir = "asc";
    }
    if (listName === "Deposit List") trackerRenderDeposits();
    else trackerRenderUnlocks();
  };

  window.navigateToTrackerItem = function(itemId) {
    if (typeof navigateToItem === 'function') {
      navigateToItem(itemId);
    }
  };

  window.toggleTrackerStatDetail = function(itemEl) {
    const details = itemEl.querySelector('.dt-stat-details');
    if (details) {
      if (details.style.display === 'none') {
        details.style.display = 'flex';
        itemEl.classList.add('active');
      } else {
        details.style.display = 'none';
        itemEl.classList.remove('active');
      }
    }
  };

  window.exportTrackerToCsv = function(listName) {
    loadTrackerState();
    const subState = listName === "Deposit List" ? trackerState.deposits : trackerState.unlocks;
    const listData = DATA.itemLists?.find(l => l.name === listName);
    if (!listData) return;
    
    const isDeposit = listName === "Deposit List";
    
    // Resolve item details
    const items = listData.items.map(id => {
      const itemInfo = DATA.items[id];
      return {
        id: id,
        name: itemInfo ? itemInfo.name : `Item #${id}`,
        effect: listData.effects?.[id] || "",
        class: listData.classes?.[id] || "",
        have: !!subState[id]?.have,
        want: !!subState[id]?.want
      };
    });
    
    // Sort by item name ascending
    items.sort((a, b) => a.name.localeCompare(b.name));
    
    // Build CSV
    const headers = ["Item Name", "ID", "Have", "Want", "Effect"];
    if (isDeposit) {
      headers.push("Class");
    }
    
    const rows = [headers];
    items.forEach(item => {
      const row = [
        item.name,
        item.id,
        item.have ? "Yes" : "No",
        item.want ? "Yes" : "No",
        item.effect
      ];
      if (isDeposit) {
        row.push(getItemCategory(item.id, item.class, item.name));
      }
      rows.push(row);
    });
    
    // Convert rows to CSV string
    const csvContent = rows.map(r => r.map(val => {
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(",")).join("\n");
    
    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${listName.replace(/\s+/g, "_").toLowerCase()}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  window.importTrackerFromCsv = function(listName) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(evt) {
        const text = evt.target.result;
        
        // Simple CSV parser
        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let inQuotes = false;
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i+1];
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              currentCell += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
          } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
          } else {
            currentCell += char;
          }
        }
        if (currentCell !== '' || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
        }
        
        // Sanity Check
        if (rows.length < 2) {
          alert("Invalid CSV: Not enough rows.");
          return;
        }
        const headers = rows[0];
        if (headers[0] !== "Item Name" || headers[1] !== "ID" || headers[2] !== "Have" || headers[3] !== "Want") {
          alert("Invalid CSV format. Make sure you are using a file generated by Export CSV.");
          return;
        }
        
        if (!confirm(`Are you sure you want to import this file? This will REPLACE your current saved tracker progress for ${listName}.`)) {
          return;
        }
        
        loadTrackerState();
        const subState = listName === "Deposit List" ? trackerState.deposits : trackerState.unlocks;
        
        // Clear current state for this list
        for (let key in subState) delete subState[key];
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 4 || !row[1]) continue;
          
          const id = row[1];
          const have = row[2] === "Yes";
          const want = row[3] === "Yes";
          
          if (have || want) {
            subState[id] = { have, want };
          }
        }
        
        saveTrackerState();
        trackerRenderDashboard();
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Register parent & children tabs under Labs
  window.registerLabExperiment?.('lab-tracker', {
    tabId:        'lab-tracker',
    title:        'Deposit & Unlock Tracker',
    sidebarLabel: 'Deposit & Unlock Tracker',
    sidebarIcon:  window.SVG_ICONS?.tracker14 || '',
    renderMain:   trackerRenderDashboard,
    children: [
      { tabId: 'lab-tracker',          sidebarLabel: 'Summary',      sidebarIcon: window.SVG_ICONS?.summary14 || '', renderMain: trackerRenderDashboard },
      { tabId: 'lab-tracker-deposits', sidebarLabel: 'Deposit List', sidebarIcon: window.SVG_ICONS?.deposit14 || '', renderMain: trackerRenderDeposits },
      { tabId: 'lab-tracker-unlocks',  sidebarLabel: 'Unlock List',  sidebarIcon: window.SVG_ICONS?.unlock14 || '',  renderMain: trackerRenderUnlocks },
    ]
  });
})();
