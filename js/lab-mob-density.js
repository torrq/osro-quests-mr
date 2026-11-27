// lab-mob-density.js — Lab Tab: Mob Density (ROTD)
// Ported from Ragnarok Online Map Analyzer by Synom (https://synomnom.github.io/Ragnarok-Online-Map-Analyzer/)

(function () {
  let dataset = null;       // { maps, mobs, spawns }
  let loadPromise = null;
  let loadError = null;

  let overallByMap = {};
  let mapByName = {};
  let overallStatsByMap = {};
  let mobElementByName = {};

  const rotdState = {
    sortKey: 'density',
    sortDir: 'desc',
    search: '',
    race: 'ALL',
    element: 'ALL',
    mob: 'ALL',
    delay: '',
  };

  function toText(v, fallback) {
    return v == null ? fallback : String(v);
  }

  function toNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function formatNum(v, decimals) {
    return toNum(v).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function sumAmounts(rows) {
    let total = 0;
    for (let i = 0; i < rows.length; i++) total += toNum(rows[i][2]);
    return total;
  }

  function uniqueSorted(values) {
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }

  function displayDelay(ms) {
    ms = toNum(ms);
    if (ms < 1000) return '0s';
    const totalSeconds = Math.round(ms / 1000);
    if (totalSeconds < 60) return totalSeconds + 's';
    return Math.round(totalSeconds / 60) + 'min';
  }

  function displayDelayRange(minMs, maxMs) {
    minMs = toNum(minMs);
    maxMs = toNum(maxMs);
    if (minMs === maxMs) return displayDelay(minMs);
    return displayDelay(minMs) + '~' + displayDelay(maxMs);
  }

  function indexDataset(data) {
    dataset = data;
    overallByMap = {};
    mapByName = {};
    overallStatsByMap = {};
    mobElementByName = {};

    const maps = data.maps || [];
    const mobs = data.mobs || [];
    const spawns = data.spawns || [];

    for (let i = 0; i < maps.length; i++) {
      mapByName[maps[i][0]] = maps[i];
    }

    for (let i = 0; i < mobs.length; i++) {
      const m = mobs[i];
      if (m[1] && !mobElementByName[m[1]]) {
        mobElementByName[m[1]] = toText(m[3], 'Neutral');
      }
    }

    for (let i = 0; i < spawns.length; i++) {
      const s = spawns[i];
      const mapRow = maps[s[0]];
      if (!mapRow) continue;
      const mapName = mapRow[0];
      if (!overallByMap[mapName]) overallByMap[mapName] = [];
      overallByMap[mapName].push(s);
    }

    for (const mapName of Object.keys(overallByMap)) {
      const fixedMonsterCount = sumAmounts(overallByMap[mapName]);
      const fixedWalkableCells = mapByName[mapName] ? toNum(mapByName[mapName][1]) : 0;
      overallStatsByMap[mapName] = {
        monsters: fixedMonsterCount,
        density: fixedWalkableCells > 0 ? (fixedMonsterCount / fixedWalkableCells) * 1000 : 0,
      };
    }
  }

  function ensureDatasetLoaded() {
    if (dataset) return Promise.resolve(dataset);
    if (loadPromise) return loadPromise;

    const fileName = (typeof FILES !== 'undefined' && FILES.mapAnalyzer) || 'osromr_map_analyzer.json';
    const dataUrl = (typeof prefix !== 'undefined' ? prefix : 'data/') + fileName;

    loadError = null;
    loadPromise = fetch(dataUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        indexDataset(json);
        return dataset;
      })
      .catch(err => {
        loadError = err?.message || 'Failed to load map analyzer data.';
        loadPromise = null;
        throw err;
      });

    return loadPromise;
  }

  function setSelectOptions(select, items, allLabel) {
    if (!select) return;
    select.innerHTML = '';
    const all = document.createElement('option');
    all.value = 'ALL';
    all.textContent = allLabel;
    select.appendChild(all);
    for (let i = 0; i < items.length; i++) {
      const opt = document.createElement('option');
      const item = items[i];
      opt.value = typeof item === 'object' ? item.value : item;
      opt.textContent = typeof item === 'object' ? item.label : item;
      select.appendChild(opt);
    }
  }

  function populateFilterDropdowns() {
    if (!dataset) return;
    const mobs = dataset.mobs || [];
    const raceEl = document.getElementById('rotdRaceFilter');
    const elemEl = document.getElementById('rotdElementFilter');

    setSelectOptions(
      raceEl,
      uniqueSorted(mobs.map(m => toText(m[2], 'Unknown'))),
      'All races'
    );
    setSelectOptions(
      elemEl,
      uniqueSorted(mobs.map(m => toText(m[3], 'Unknown'))),
      'All elements'
    );

    if (raceEl) raceEl.value = rotdState.race;
    if (elemEl) elemEl.value = rotdState.element;
    rebuildMobFilter();
  }

  function rebuildMobFilter() {
    if (!dataset) return;
    const mobEl = document.getElementById('rotdMobFilter');
    if (!mobEl) return;

    const mobs = dataset.mobs || [];
    const race = rotdState.race;
    const element = rotdState.element;
    const filteredMobs = {};

    for (let i = 0; i < mobs.length; i++) {
      const m = mobs[i];
      if (race !== 'ALL' && toText(m[2], 'Unknown') !== race) continue;
      if (element !== 'ALL' && toText(m[3], 'Unknown') !== element) continue;
      const id = toText(m[0], '');
      if (id) {
        filteredMobs[id] = { value: id, label: `${toText(m[1], 'Unknown')} [${id}]` };
      }
    }

    const items = Object.keys(filteredMobs)
      .map(id => filteredMobs[id])
      .sort((a, b) => a.label.localeCompare(b.label));

    setSelectOptions(mobEl, items, 'All monsters');

    let found = false;
    for (let j = 0; j < mobEl.options.length; j++) {
      if (mobEl.options[j].value === rotdState.mob) {
        found = true;
        break;
      }
    }
    rotdState.mob = found ? rotdState.mob : 'ALL';
    mobEl.value = rotdState.mob;
  }

  function hasActiveFilters() {
    return (
      rotdState.race !== 'ALL' ||
      rotdState.element !== 'ALL' ||
      rotdState.mob !== 'ALL' ||
      rotdState.delay.trim() !== '' ||
      rotdState.search.trim() !== ''
    );
  }

  function hasSpawnFilters() {
    return (
      rotdState.race !== 'ALL' ||
      rotdState.element !== 'ALL' ||
      rotdState.mob !== 'ALL' ||
      rotdState.delay.trim() !== ''
    );
  }

  function getFilteredSpawns() {
    const maps = dataset.maps || [];
    const mobs = dataset.mobs || [];
    const spawns = dataset.spawns || [];
    const race = rotdState.race;
    const element = rotdState.element;
    const mob = rotdState.mob;
    const delayText = rotdState.delay.trim();
    const delayLimit = delayText === '' ? null : toNum(delayText) * 1000;

    return spawns.filter(s => {
      const m = mobs[s[1]];
      if (!m || !maps[s[0]]) return false;
      if (race !== 'ALL' && m[2] !== race) return false;
      if (element !== 'ALL' && m[3] !== element) return false;
      if (mob !== 'ALL' && m[0] !== mob) return false;
      return delayLimit === null || toNum(s[3]) <= delayLimit;
    });
  }

  function buildRows() {
    const maps = dataset.maps || [];
    const mobs = dataset.mobs || [];
    const filteredSpawns = getFilteredSpawns();
    const filteredByMap = {};

    for (let i = 0; i < filteredSpawns.length; i++) {
      const s = filteredSpawns[i];
      const mapName = maps[s[0]][0];
      if (!filteredByMap[mapName]) filteredByMap[mapName] = [];
      filteredByMap[mapName].push(s);
    }

    const filtersActive = hasSpawnFilters();
    const search = rotdState.search.trim().toLowerCase();
    const rows = [];

    for (let i = 0; i < maps.length; i++) {
      const map = maps[i];
      const mapName = toText(map[0], '');
      if (!mapName) continue;
      if (search && mapName.toLowerCase().indexOf(search) === -1) continue;

      const overallStats = overallStatsByMap[mapName];
      if (!overallStats || overallStats.monsters <= 0) continue;

      const filteredMonsters = sumAmounts(filteredByMap[mapName] || []);
      if (filtersActive && filteredMonsters <= 0) continue;

      const walkable = toNum(map[1]);
      const overallRows = overallByMap[mapName] || [];
      const raceGroups = {};

      for (let k = 0; k < overallRows.length; k++) {
        const s = overallRows[k];
        const mob = mobs[s[1]];
        if (!mob) continue;
        const race = toText(mob[2], 'Unknown');
        const mobName = toText(mob[1], 'Unknown');
        const amount = toNum(s[2]);
        const delayMin = toNum(s[3]);
        const delayMax = s.length > 4 ? toNum(s[4]) : delayMin;
        const delayKey = delayMin + '|' + delayMax;

        if (!raceGroups[race]) raceGroups[race] = {};
        if (!raceGroups[race][mobName]) raceGroups[race][mobName] = {};
        if (!raceGroups[race][mobName][delayKey]) {
          raceGroups[race][mobName][delayKey] = { min: delayMin, max: delayMax, amount: 0 };
        }
        raceGroups[race][mobName][delayKey].amount += amount;
      }

      const raceDetails = Object.keys(raceGroups)
        .sort((a, b) => a.localeCompare(b))
        .map(race => {
          const mobList = Object.keys(raceGroups[race])
            .sort((a, b) => a.localeCompare(b))
            .map(name => {
              const details = Object.keys(raceGroups[race][name])
                .map(dk => raceGroups[race][name][dk])
                .sort((a, b) => (a.min !== b.min ? a.min - b.min : a.max - b.max));
              return {
                name,
                element: mobElementByName[name] || 'Neutral',
                totalAmount: details.reduce((sum, d) => sum + d.amount, 0),
                details: details.map(d => 'x' + formatNum(d.amount, 0) + ' ' + displayDelayRange(d.min, d.max)),
              };
            });
          return { race, mobs: mobList };
        });

      const raceText = raceDetails
        .map(group =>
          group.race +
          (group.mobs.length
            ? ' [' + group.mobs.map(m => m.name + ' ' + m.details.join(', ')).join('; ') + ']'
            : '')
        )
        .join(', ') || 'Unknown';

      rows.push({
        mapName,
        walkable,
        monsters: overallStats.monsters,
        filteredMonsters,
        raceText,
        raceDetails,
        density: overallStats.density,
        filterDensity: walkable > 0 ? (filteredMonsters / walkable) * 1000 : 0,
      });
    }

    return rows;
  }

  function compareRows(a, b, key) {
    if (key === 'map') return a.mapName.localeCompare(b.mapName);
    if (key === 'race') return a.raceText.localeCompare(b.raceText);
    if (key === 'walkable') return a.walkable - b.walkable;
    if (key === 'monsters') return a.monsters - b.monsters;
    if (key === 'filteredMonsters') return a.filteredMonsters - b.filteredMonsters;
    if (key === 'density') return a.density - b.density;
    if (key === 'filterDensity') return a.filterDensity - b.filterDensity;
    return 0;
  }

  function updateSortIndicators() {
    const headers = document.querySelectorAll('#rotdTable thead th');
    for (let i = 0; i < headers.length; i++) {
      const active = headers[i].dataset.sort === rotdState.sortKey;
      headers[i].classList.toggle('active-asc', active && rotdState.sortDir === 'asc');
      headers[i].classList.toggle('active-desc', active && rotdState.sortDir === 'desc');
    }
  }

  function renderRaceCell(td, raceDetails) {
    for (let p = 0; p < raceDetails.length; p++) {
      if (p) td.appendChild(document.createTextNode(', '));
      const group = raceDetails[p];

      const raceSpan = document.createElement('span');
      raceSpan.textContent = group.race;
      td.appendChild(raceSpan);

      if (!group.mobs.length) continue;

      const mobsSpan = document.createElement('span');
      mobsSpan.className = 'rotd-race-mobs';
      mobsSpan.appendChild(document.createTextNode(' ['));

      group.mobs.forEach((m, mobIndex) => {
        const mobSpan = document.createElement('span');
        mobSpan.className = 'rotd-race-mob';
        mobSpan.tabIndex = 0;
        mobSpan.appendChild(document.createTextNode(m.name + ' '));

        const amountSpan = document.createElement('span');
        amountSpan.className = 'rotd-race-mob-amount';
        amountSpan.textContent = 'x' + formatNum(m.totalAmount, 0);
        mobSpan.appendChild(amountSpan);

        const tooltip = document.createElement('span');
        tooltip.className = 'rotd-spawn-tooltip';

        const tooltipTitle = document.createElement('span');
        tooltipTitle.className = 'rotd-tooltip-title';
        tooltipTitle.appendChild(document.createTextNode(m.name + ' ('));

        const elemSpan = document.createElement('span');
        elemSpan.className = 'rotd-element-' + String(m.element || 'Neutral').toLowerCase();
        elemSpan.textContent = m.element || 'Neutral';
        tooltipTitle.appendChild(elemSpan);
        tooltipTitle.appendChild(document.createTextNode(')'));
        tooltip.appendChild(tooltipTitle);

        m.details.forEach((detail, detailIndex) => {
          if (detailIndex) tooltip.appendChild(document.createTextNode('\n'));
          const match = detail.match(/^x([0-9,]+)(.*)$/);
          if (match) {
            const amtSpan = document.createElement('span');
            amtSpan.className = 'rotd-tooltip-amount';
            amtSpan.textContent = 'x' + match[1];
            tooltip.appendChild(amtSpan);
            tooltip.appendChild(document.createTextNode(match[2]));
          } else {
            tooltip.appendChild(document.createTextNode(detail));
          }
        });

        mobSpan.appendChild(tooltip);
        mobsSpan.appendChild(mobSpan);
        if (mobIndex < group.mobs.length - 1) {
          mobsSpan.appendChild(document.createTextNode(', '));
        }
      });

      mobsSpan.appendChild(document.createTextNode(']'));
      td.appendChild(mobsSpan);
    }
  }

  function renderMobileCards(rows) {
    const cardsEl = document.getElementById('rotdCardsList');
    if (!cardsEl) return;

    cardsEl.innerHTML = '';
    if (!rows.length) return;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const card = document.createElement('div');
      card.className = 'rotd-m-card';

      // Head: #Rank + MapName | Density badges
      const head = document.createElement('div');
      head.className = 'rotd-m-card-head';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'rotd-m-title';

      const rankSpan = document.createElement('span');
      rankSpan.className = 'rotd-m-rank';
      rankSpan.textContent = '#' + (i + 1);
      titleWrap.appendChild(rankSpan);

      const mapSpan = document.createElement('span');
      mapSpan.className = 'rotd-m-map';
      mapSpan.textContent = r.mapName;
      titleWrap.appendChild(mapSpan);

      const badges = document.createElement('div');
      badges.className = 'rotd-m-badges';

      const densBadge = document.createElement('span');
      densBadge.className = 'rotd-m-badge rotd-m-badge--density';
      densBadge.innerHTML = `<span class="rotd-m-badge-label">Map</span> ${formatNum(r.density, 2)}`;
      badges.appendChild(densBadge);

      const filtBadge = document.createElement('span');
      filtBadge.className = 'rotd-m-badge rotd-m-badge--filter';
      filtBadge.innerHTML = `<span class="rotd-m-badge-label">Filter</span> ${formatNum(r.filterDensity, 2)}`;
      badges.appendChild(filtBadge);

      head.appendChild(titleWrap);
      head.appendChild(badges);
      card.appendChild(head);

      // Stats strip: Walkable | Mean Mobs | Filtered Mobs
      const statsRow = document.createElement('div');
      statsRow.className = 'rotd-m-stats';
      statsRow.innerHTML =
        `<span><strong>Walkable:</strong> ${formatNum(r.walkable, 0)}</span>` +
        `<span><strong>Mean:</strong> ${formatNum(r.monsters, 0)}</span>` +
        `<span><strong>Filtered:</strong> ${formatNum(r.filteredMonsters, 0)}</span>`;
      card.appendChild(statsRow);

      // Race & Mobs breakdown
      const raceBox = document.createElement('div');
      raceBox.className = 'rotd-m-races rotd-col-race';
      renderRaceCell(raceBox, r.raceDetails);
      card.appendChild(raceBox);

      frag.appendChild(card);
    }

    cardsEl.appendChild(frag);
  }

  function renderRotdTable() {
    if (!dataset) return;
    const body = document.getElementById('rotdResultBody');
    const tableWrap = document.getElementById('rotdTableWrap');
    const emptyEl = document.getElementById('rotdEmptyState');
    const cardsEl = document.getElementById('rotdCardsList');
    if (!body) return;

    const rows = buildRows();
    rows.sort((a, b) => {
      let result = compareRows(a, b, rotdState.sortKey);
      if (result === 0) result = a.mapName.localeCompare(b.mapName);
      return result * (rotdState.sortDir === 'asc' ? 1 : -1);
    });

    const countEl = document.getElementById('rotdResultCount');
    if (countEl) {
      const totalMaps = Object.keys(overallStatsByMap).length;
      countEl.textContent = `Showing ${rows.length} of ${totalMaps} maps`;
    }

    const resetBtn = document.getElementById('rotdResetBtn');
    if (resetBtn) {
      resetBtn.classList.toggle('hidden', !hasActiveFilters());
    }

    const clearSearchBtn = document.getElementById('rotdClearSearchBtn');
    if (clearSearchBtn) {
      clearSearchBtn.classList.toggle('visible', Boolean(rotdState.search));
    }

    body.innerHTML = '';
    if (!rows.length) {
      if (tableWrap) tableWrap.classList.add('rotd-is-empty');
      if (cardsEl) cardsEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      updateSortIndicators();
      return;
    }

    if (tableWrap) tableWrap.classList.remove('rotd-is-empty');
    if (emptyEl) emptyEl.style.display = 'none';

    const frag = document.createDocumentFragment();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const tr = document.createElement('tr');
      const cells = [
        [i + 1, 'rotd-col-num'],
        [r.mapName, 'rotd-col-map'],
        [formatNum(r.walkable, 0), 'rotd-col-num'],
        [formatNum(r.monsters, 0), 'rotd-col-num'],
        [formatNum(r.filteredMonsters, 0), 'rotd-col-num'],
        [null, 'rotd-col-race'],
        [formatNum(r.density, 2), 'rotd-col-num rotd-density'],
        [formatNum(r.filterDensity, 2), 'rotd-col-num rotd-filter-density'],
      ];

      for (let j = 0; j < cells.length; j++) {
        const td = document.createElement('td');
        td.className = cells[j][1];
        if (j === 5) {
          renderRaceCell(td, r.raceDetails);
        } else {
          td.textContent = cells[j][0];
        }
        tr.appendChild(td);
      }
      frag.appendChild(tr);
    }

    body.appendChild(frag);
    renderMobileCards(rows);
    updateSortIndicators();
  }

  function bindRotdEvents() {
    const searchEl = document.getElementById('rotdMapSearch');
    const clearSearchBtn = document.getElementById('rotdClearSearchBtn');
    const raceEl = document.getElementById('rotdRaceFilter');
    const elemEl = document.getElementById('rotdElementFilter');
    const mobEl = document.getElementById('rotdMobFilter');
    const delayEl = document.getElementById('rotdDelayValue');
    const resetBtn = document.getElementById('rotdResetBtn');

    if (searchEl) {
      searchEl.value = rotdState.search;
      searchEl.addEventListener('input', () => {
        rotdState.search = searchEl.value;
        renderRotdTable();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        rotdState.search = '';
        if (searchEl) {
          searchEl.value = '';
          searchEl.focus();
        }
        renderRotdTable();
      });
    }

    if (raceEl) {
      raceEl.addEventListener('change', () => {
        rotdState.race = raceEl.value;
        rebuildMobFilter();
        renderRotdTable();
      });
    }

    if (elemEl) {
      elemEl.addEventListener('change', () => {
        rotdState.element = elemEl.value;
        rebuildMobFilter();
        renderRotdTable();
      });
    }

    if (mobEl) {
      mobEl.addEventListener('change', () => {
        rotdState.mob = mobEl.value;
        renderRotdTable();
      });
    }

    if (delayEl) {
      delayEl.value = rotdState.delay;
      delayEl.addEventListener('input', () => {
        rotdState.delay = delayEl.value;
        renderRotdTable();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        rotdState.search = '';
        rotdState.race = 'ALL';
        rotdState.element = 'ALL';
        rotdState.mob = 'ALL';
        rotdState.delay = '';
        if (searchEl) searchEl.value = '';
        if (raceEl) raceEl.value = 'ALL';
        if (elemEl) elemEl.value = 'ALL';
        if (delayEl) delayEl.value = '';
        rebuildMobFilter();
        renderRotdTable();
      });
    }

    document.querySelectorAll('#rotdTable thead th button').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.parentElement.dataset.sort;
        if (rotdState.sortKey === key) {
          rotdState.sortDir = rotdState.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          rotdState.sortKey = key;
          rotdState.sortDir = 'desc';
        }
        renderRotdTable();
      });
    });
  }

  function renderRotdMain() {
    const mainContainer = document.getElementById('mainContent');
    if (!mainContainer) return;

    const headerHtml = `
      <div class="lab-section-header">
        <span class="lab-section-title">
          <span class="lab-section-icon">${window.SVG_ICONS?.rotd18 || ''}</span>
          Mob Density (ROTD)
        </span>
        <span class="lab-section-meta">
          <span id="rotdResultCount">Map spawn density &amp; ranking</span> · Credit: <a class="rotd-credit-link" href="https://synomnom.github.io/Ragnarok-Online-Map-Analyzer/" target="_blank" rel="noopener">Synom (Ragnarok Online Map Analyzer)</a>
        </span>
      </div>`;

    if (!dataset) {
      if (loadError) {
        mainContainer.innerHTML = `
          <div class="lab-section rotd-page">
            ${headerHtml}
            <div class="rotd-status-box rotd-status-error">
              <p>Failed to load map analyzer data (${loadError}).</p>
              <button type="button" class="btn btn-sm" id="rotdRetryBtn">Retry</button>
            </div>
          </div>`;
        document.getElementById('rotdRetryBtn')?.addEventListener('click', () => {
          loadError = null;
          renderRotdMain();
        });
        return;
      }

      mainContainer.innerHTML = `
        <div class="lab-section rotd-page">
          ${headerHtml}
          <div class="rotd-status-box">Loading map &amp; spawn data…</div>
        </div>`;

      ensureDatasetLoaded()
        .then(() => {
          if (window.state?.currentTab === 'lab-mob-density') {
            renderRotdMain();
          }
        })
        .catch(() => {
          if (window.state?.currentTab === 'lab-mob-density') {
            renderRotdMain();
          }
        });
      return;
    }

    mainContainer.innerHTML = `
      <div class="lab-section rotd-page" id="rotdRoot">
        ${headerHtml}

        <section class="rotd-controls-panel">
          <div class="rotd-search-row">
            <div class="dt-search-wrapper rotd-search-wrapper">
              <span class="dt-search-icon">🔍</span>
              <input id="rotdMapSearch" class="dt-search-input" type="search" placeholder="Search map..." autocomplete="off">
              <button type="button" id="rotdClearSearchBtn" class="btn btn-sm rotd-clear-btn" title="Clear search" aria-label="Clear search">×</button>
            </div>
            <button type="button" id="rotdResetBtn" class="btn btn-sm hidden" title="Reset all filters">Reset</button>
          </div>

          <div class="rotd-filter-row">
            <div class="rotd-filter-group">
              <label for="rotdRaceFilter">Race:</label>
              <select id="rotdRaceFilter"></select>
            </div>
            <div class="rotd-filter-group">
              <label for="rotdElementFilter">Element:</label>
              <select id="rotdElementFilter"></select>
            </div>
            <div class="rotd-filter-group">
              <label for="rotdMobFilter">Monster:</label>
              <select id="rotdMobFilter"></select>
            </div>
            <div class="rotd-filter-group rotd-filter-group--delay" title="Exclude spawns with respawn delay greater than this many seconds">
              <label for="rotdDelayValue">Max Delay:</label>
              <input id="rotdDelayValue" type="number" min="0" step="1" placeholder="sec">
              <span class="rotd-delay-unit">s</span>
            </div>
          </div>
        </section>

        <div class="rotd-table-wrap" id="rotdTableWrap">
          <table id="rotdTable" class="rotd-table">
            <thead>
              <tr>
                <th data-sort="index"><button type="button">#<span class="rotd-sort-indicator"></span></button></th>
                <th data-sort="map"><button type="button">Map<span class="rotd-sort-indicator"></span></button></th>
                <th data-sort="walkable"><button type="button">Walkable Cells<span class="rotd-sort-indicator"></span></button></th>
                <th data-sort="monsters"><button type="button">Mean Mobs<span class="rotd-sort-indicator"></span></button></th>
                <th data-sort="filteredMonsters"><button type="button">Filtered Mobs<span class="rotd-sort-indicator"></span></button></th>
                <th data-sort="race"><button type="button">Mean Race &amp; Mobs/Map<span class="rotd-sort-indicator"></span></button></th>
                <th data-sort="density"><button type="button">Map Density<span class="rotd-sort-indicator"></span></button></th>
                <th data-sort="filterDensity"><button type="button">Filter Density<span class="rotd-sort-indicator"></span></button></th>
              </tr>
            </thead>
            <tbody id="rotdResultBody"></tbody>
          </table>
        </div>

        <div class="rotd-cards-list" id="rotdCardsList"></div>
        <div class="rotd-empty" id="rotdEmptyState" style="display:none;">No maps match current filters.</div>
      </div>`;

    populateFilterDropdowns();
    bindRotdEvents();
    renderRotdTable();
  }

  window.registerLabExperiment?.('lab-mob-density', {
    tabId:        'lab-mob-density',
    title:        'Mob Density (ROTD)',
    sidebarLabel: 'Mob Density (ROTD)',
    sidebarIcon:  window.SVG_ICONS?.rotd14 || '',
    renderMain:   renderRotdMain,
  });
})();
