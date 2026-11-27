// lab-mob-density.js — Lab Tab: Mob Density (ROTD)
// Ported from Ragnarok Online Map Analyzer by Synom (https://synomnom.github.io/Ragnarok-Online-Map-Analyzer/)

(function () {
  const IS_HR = false;

  let dataset = null;       // { maps, mobs, spawns }
  let indexedMaps = [];     // pre-computed per-map records for fast filtering
  let totalValidMaps = 0;
  let loadPromise = null;
  let loadError = null;
  let inputDebounceTimer = null;
  let mobileMqBound = false;

  const mobTipMap = new WeakMap();
  let floatingTooltipEl = null;

  const rotdState = {
    sortKey: 'density',
    sortDir: 'desc',
    search: '',
    race: 'ALL',
    element: 'ALL',
    mob: 'ALL',
    delay: '',
    instantOnly: false,
    manualSort: false,
  };

  function isMobileLayout() {
    return (
      document.body.classList.contains('force-mobile-view') ||
      window.matchMedia('(max-width: 768px)').matches
    );
  }

  function getMobDbPref() {
    try {
      const data = typeof loadLabData === 'function' ? loadLabData() : {};
      return data.rotdMobDb === 'koko' ? 'koko' : 'rms';
    } catch {
      return 'rms';
    }
  }

  function setMobDbPref(db) {
    const val = db === 'koko' ? 'koko' : 'rms';
    if (typeof saveLabData === 'function') {
      saveLabData({ rotdMobDb: val });
    }
    document.querySelectorAll('.rotd-db-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.db === val);
    });
    renderRotdTable();
  }

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

  function getMapUrl(mapName, db) {
    if (db === 'koko') {
      return `https://ro.kokotewa.com/db/map_info?id=${encodeURIComponent(mapName)}`;
    }
    return `https://ratemyserver.net/npc_shop_warp.php?map=${encodeURIComponent(mapName)}&s_block=mob_block&small=1`;
  }

  function getMobUrl(mobId, db) {
    if (db === 'koko') {
      return `https://ro.kokotewa.com/db/mon_info?id=${encodeURIComponent(mobId)}`;
    }
    return `https://ratemyserver.net/index.php?page=mob_db&mob_id=${encodeURIComponent(mobId)}`;
  }

  function copyTextFallback(str) {
    if (typeof gemCopyText === 'function') {
      return gemCopyText(str);
    }
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(str);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = str;
        ta.setAttribute('readonly', 'true');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('copy failed'));
      } catch (e) {
        reject(e);
      }
    });
  }

  function copyWarpCommand(mapName) {
    if (!IS_HR || !mapName) return;
    const cmd = `@warp ${mapName}`;
    copyTextFallback(cmd)
      .then(() => {
        if (typeof showToast === 'function') showToast(`Copied: ${cmd}`, 'success', 2000);
      })
      .catch(() => {
        if (typeof showToast === 'function') showToast('Failed to copy @warp command', 'error', 2000);
      });
  }

  function syncStateFromURL() {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.has('rq')) rotdState.search = p.get('rq') || '';
      if (p.has('rr')) rotdState.race = p.get('rr') || 'ALL';
      if (p.has('re')) rotdState.element = p.get('re') || 'ALL';
      if (p.has('rm')) rotdState.mob = p.get('rm') || 'ALL';
      if (p.has('rd')) rotdState.delay = p.get('rd') || '';
      if (p.get('ris') === '1') rotdState.instantOnly = true;
      if (p.has('rs')) {
        rotdState.sortKey = p.get('rs') || 'density';
        rotdState.manualSort = true;
      }
      if (p.get('rsd') === 'asc' || p.get('rsd') === 'desc') {
        rotdState.sortDir = p.get('rsd');
      }
    } catch { /* ignore */ }
  }

  function syncURLFromState() {
    try {
      if (window.state?.currentTab !== 'lab-mob-density') return;
      const url = new URL(window.location.href);
      const p = url.searchParams;
      const setOrDel = (k, v) => (v ? p.set(k, v) : p.delete(k));
      setOrDel('rq', rotdState.search.trim());
      setOrDel('rr', rotdState.race !== 'ALL' ? rotdState.race : '');
      setOrDel('re', rotdState.element !== 'ALL' ? rotdState.element : '');
      setOrDel('rm', rotdState.mob !== 'ALL' ? rotdState.mob : '');
      setOrDel('rd', rotdState.delay.trim());
      setOrDel('ris', rotdState.instantOnly ? '1' : '');
      const defaultSort = hasSpawnFilters() ? 'filterDensity' : 'density';
      setOrDel('rs', rotdState.sortKey !== defaultSort ? rotdState.sortKey : '');
      setOrDel('rsd', rotdState.sortDir !== 'desc' ? rotdState.sortDir : '');
      history.replaceState(history.state, '', url.toString());
    } catch { /* ignore */ }
  }

  function indexDataset(data) {
    dataset = data;
    indexedMaps = [];
    totalValidMaps = 0;

    const maps = data.maps || [];
    const mobs = data.mobs || [];
    const spawns = data.spawns || [];

    const mobElementByName = {};
    const mobIdByName = {};
    for (let i = 0; i < mobs.length; i++) {
      const m = mobs[i];
      if (m[1] && !mobElementByName[m[1]]) mobElementByName[m[1]] = toText(m[3], 'Neutral');
      if (m[1] && !mobIdByName[m[1]] && m[0]) mobIdByName[m[1]] = toText(m[0], '');
    }

    // Group spawns by map index in a single pass
    const spawnsByMapIdx = new Array(maps.length);
    for (let i = 0; i < spawns.length; i++) {
      const s = spawns[i];
      const mapIdx = s[0];
      const mob = mobs[s[1]];
      if (!maps[mapIdx] || !mob) continue;
      if (!spawnsByMapIdx[mapIdx]) spawnsByMapIdx[mapIdx] = [];
      spawnsByMapIdx[mapIdx].push({
        id: toText(mob[0], ''),
        name: toText(mob[1], 'Unknown'),
        race: toText(mob[2], 'Unknown'),
        element: toText(mob[3], 'Neutral'),
        amount: toNum(s[2]),
        delayMin: toNum(s[3]),
        delayMax: s.length > 4 ? toNum(s[4]) : toNum(s[3]),
      });
    }

    for (let i = 0; i < maps.length; i++) {
      const map = maps[i];
      const mapName = toText(map[0], '');
      const mapSpawns = spawnsByMapIdx[i];
      if (!mapName || !mapSpawns || !mapSpawns.length) continue;

      let totalMonsters = 0;
      const raceGroups = {};

      for (let k = 0; k < mapSpawns.length; k++) {
        const sp = mapSpawns[k];
        totalMonsters += sp.amount;

        if (!raceGroups[sp.race]) raceGroups[sp.race] = {};
        if (!raceGroups[sp.race][sp.name]) {
          raceGroups[sp.race][sp.name] = { minDelay: sp.delayMin, delays: {} };
        } else if (sp.delayMin < raceGroups[sp.race][sp.name].minDelay) {
          raceGroups[sp.race][sp.name].minDelay = sp.delayMin;
        }

        const delayKey = sp.delayMin + '|' + sp.delayMax;
        if (!raceGroups[sp.race][sp.name].delays[delayKey]) {
          raceGroups[sp.race][sp.name].delays[delayKey] = {
            min: sp.delayMin,
            max: sp.delayMax,
            amount: 0,
          };
        }
        raceGroups[sp.race][sp.name].delays[delayKey].amount += sp.amount;
      }

      if (totalMonsters <= 0) continue;

      const walkable = toNum(map[1]);
      const density = walkable > 0 ? (totalMonsters / walkable) * 1000 : 0;

      // Pre-compute sorted raceDetails & raceText once
      const raceDetails = Object.keys(raceGroups)
        .sort((a, b) => a.localeCompare(b))
        .map(race => {
          const mobList = Object.keys(raceGroups[race])
            .sort((a, b) => a.localeCompare(b))
            .map(name => {
              const entry = raceGroups[race][name];
              const details = Object.keys(entry.delays)
                .map(dk => entry.delays[dk])
                .sort((a, b) => (a.min !== b.min ? a.min - b.min : a.max - b.max));
              const totalAmount = details.reduce((sum, d) => sum + d.amount, 0);
              return {
                id: mobIdByName[name] || '',
                name,
                race,
                element: mobElementByName[name] || 'Neutral',
                minDelay: entry.minDelay,
                totalAmount,
                totalFormatted: 'x' + formatNum(totalAmount, 0),
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

      indexedMaps.push({
        mapName,
        mapNameLower: mapName.toLowerCase(),
        walkable,
        monsters: totalMonsters,
        density,
        raceDetails,
        raceText,
        spawns: mapSpawns,
      });
    }

    totalValidMaps = indexedMaps.length;
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

  function renderRaceChips(races) {
    const container = document.getElementById('rotdRaceChips');
    if (!container) return;
    container.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'ss-chip' + (rotdState.race === 'ALL' ? ' active' : '');
    allBtn.textContent = 'All Races';
    allBtn.dataset.race = 'ALL';
    container.appendChild(allBtn);

    races.forEach(race => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ss-chip' + (rotdState.race === race ? ' active' : '');
      btn.textContent = race;
      btn.dataset.race = race;
      container.appendChild(btn);
    });
  }

  function updateRaceChipActive() {
    document.querySelectorAll('#rotdRaceChips .ss-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.race === rotdState.race);
    });
  }

  function populateFilterDropdowns() {
    if (!dataset) return;
    const mobs = dataset.mobs || [];
    const elemEl = document.getElementById('rotdElementFilter');
    const races = uniqueSorted(mobs.map(m => toText(m[2], 'Unknown')));

    setSelectOptions(
      elemEl,
      uniqueSorted(mobs.map(m => toText(m[3], 'Unknown'))),
      'All elements'
    );

    if (elemEl) elemEl.value = rotdState.element;
    renderRaceChips(races);
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
      rotdState.instantOnly ||
      rotdState.search.trim() !== ''
    );
  }

  function hasSpawnFilters() {
    return (
      rotdState.race !== 'ALL' ||
      rotdState.element !== 'ALL' ||
      rotdState.mob !== 'ALL' ||
      rotdState.delay.trim() !== '' ||
      rotdState.instantOnly
    );
  }

  function applyAutoSort() {
    if (rotdState.manualSort) return;
    const active = hasSpawnFilters();
    if (active && rotdState.sortKey === 'density') {
      rotdState.sortKey = 'filterDensity';
      rotdState.sortDir = 'desc';
    } else if (!active && rotdState.sortKey === 'filterDensity') {
      rotdState.sortKey = 'density';
      rotdState.sortDir = 'desc';
    }
  }

  function getEffectiveDelayLimitMs() {
    if (rotdState.instantOnly) return 0;
    const delayText = rotdState.delay.trim();
    return delayText === '' ? null : toNum(delayText) * 1000;
  }

  function buildRows() {
    const filtersActive = hasSpawnFilters();
    const delayLimit = getEffectiveDelayLimitMs();
    const search = rotdState.search.trim().toLowerCase();
    const race = rotdState.race;
    const element = rotdState.element;
    const mob = rotdState.mob;
    const rows = [];

    for (let i = 0; i < indexedMaps.length; i++) {
      const m = indexedMaps[i];
      if (search && m.mapNameLower.indexOf(search) === -1) continue;

      let filteredMonsters = 0;
      if (!filtersActive) {
        filteredMonsters = m.monsters;
      } else {
        const spList = m.spawns;
        for (let k = 0; k < spList.length; k++) {
          const sp = spList[k];
          if (race !== 'ALL' && sp.race !== race) continue;
          if (element !== 'ALL' && sp.element !== element) continue;
          if (mob !== 'ALL' && sp.id !== mob) continue;
          if (delayLimit !== null && sp.delayMin > delayLimit) continue;
          filteredMonsters += sp.amount;
        }
        if (filteredMonsters <= 0) continue;
      }

      rows.push({
        mapName: m.mapName,
        walkable: m.walkable,
        monsters: m.monsters,
        filteredMonsters,
        raceText: m.raceText,
        raceDetails: m.raceDetails,
        density: m.density,
        filterDensity: m.walkable > 0 ? (filteredMonsters / m.walkable) * 1000 : 0,
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
    const mobileSortEl = document.getElementById('rotdMobileSortKey');
    if (mobileSortEl) {
      const val = rotdState.sortKey === 'index' ? 'map' : rotdState.sortKey;
      if (mobileSortEl.value !== val) mobileSortEl.value = val;
    }
    const mobileDirEl = document.getElementById('rotdMobileSortDir');
    if (mobileDirEl) {
      mobileDirEl.textContent = rotdState.sortDir === 'asc' ? '↑' : '↓';
      mobileDirEl.title = rotdState.sortDir === 'asc' ? 'Ascending (click to reverse)' : 'Descending (click to reverse)';
    }
  }

  function createWarpBtn(mapName) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rotd-warp-btn';
    btn.title = `Copy @warp ${mapName}`;
    const copyIcon = window.SVG_ICONS?.copy11 || '';
    btn.innerHTML = `${copyIcon ? `<span class="rotd-btn-icon">${copyIcon}</span>` : ''}<span>@warp</span>`;
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      copyWarpCommand(mapName);
    });
    return btn;
  }

  function createMapLink(mapName, extraClass) {
    const db = getMobDbPref();
    const dbLabel = db === 'koko' ? 'Kokotewa' : 'RateMyServer';
    const mapLink = document.createElement('a');
    mapLink.className = extraClass ? `rotd-map-link ${extraClass}` : 'rotd-map-link';
    mapLink.href = getMapUrl(mapName, db);
    mapLink.target = '_blank';
    mapLink.rel = 'noopener';
    mapLink.title = `Open ${mapName} on ${dbLabel}`;
    const mapIcon = window.SVG_ICONS?.map13 || '';
    if (mapIcon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'rotd-map-icon';
      iconSpan.innerHTML = mapIcon;
      mapLink.appendChild(iconSpan);
    }
    mapLink.appendChild(document.createTextNode(mapName));
    return mapLink;
  }

  function getFloatingTooltip() {
    if (!floatingTooltipEl) {
      floatingTooltipEl = document.createElement('div');
      floatingTooltipEl.className = 'rotd-spawn-tooltip rotd-floating-tooltip';
      floatingTooltipEl.setAttribute('role', 'tooltip');
      document.body.appendChild(floatingTooltipEl);
    }
    return floatingTooltipEl;
  }

  function showMobTooltip(targetEl) {
    const m = mobTipMap.get(targetEl);
    if (!m) return;

    const tip = getFloatingTooltip();
    tip.innerHTML = '';

    const tooltipTitle = document.createElement('span');
    tooltipTitle.className = 'rotd-tooltip-title';
    tooltipTitle.appendChild(document.createTextNode(m.name + ' ('));

    const elemSpan = document.createElement('span');
    elemSpan.className = 'rotd-element-' + String(m.element || 'Neutral').toLowerCase();
    elemSpan.textContent = m.element || 'Neutral';
    tooltipTitle.appendChild(elemSpan);
    tooltipTitle.appendChild(document.createTextNode(')'));
    tip.appendChild(tooltipTitle);

    m.details.forEach((detail, detailIndex) => {
      if (detailIndex) tip.appendChild(document.createTextNode('\n'));
      const match = detail.match(/^x([0-9,]+)(.*)$/);
      if (match) {
        const amtSpan = document.createElement('span');
        amtSpan.className = 'rotd-tooltip-amount';
        amtSpan.textContent = 'x' + match[1];
        tip.appendChild(amtSpan);
        tip.appendChild(document.createTextNode(match[2]));
      } else {
        tip.appendChild(document.createTextNode(detail));
      }
    });

    tip.style.display = 'block';

    const rect = targetEl.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const pad = 8;

    let left = rect.left;
    if (left + tipRect.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - tipRect.width - pad);
    }

    let top = rect.bottom + 4;
    if (top + tipRect.height > window.innerHeight - pad) {
      top = Math.max(pad, rect.top - tipRect.height - 4);
    }

    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function hideMobTooltip() {
    if (floatingTooltipEl) {
      floatingTooltipEl.style.display = 'none';
    }
  }

  function mobMatchesActiveFilter(m, delayLimit) {
    if (rotdState.race !== 'ALL' && m.race !== rotdState.race) return false;
    if (rotdState.element !== 'ALL' && m.element !== rotdState.element) return false;
    if (rotdState.mob !== 'ALL' && m.id !== rotdState.mob) return false;
    if (delayLimit !== null && m.minDelay > delayLimit) return false;
    return true;
  }

  function renderRaceCell(td, raceDetails) {
    const filtersActive = hasSpawnFilters();
    const delayLimit = getEffectiveDelayLimitMs();
    const mobDb = getMobDbPref();
    const dbLabel = mobDb === 'koko' ? 'Kokotewa' : 'RateMyServer';

    for (let p = 0; p < raceDetails.length; p++) {
      if (p) td.appendChild(document.createTextNode(', '));
      const group = raceDetails[p];

      const raceWrap = document.createElement('span');
      const groupMatched = !filtersActive || group.mobs.some(m => mobMatchesActiveFilter(m, delayLimit));
      if (!groupMatched) {
        raceWrap.className = 'rotd-group-dim';
      }

      const raceSpan = document.createElement('span');
      raceSpan.textContent = group.race;
      raceWrap.appendChild(raceSpan);

      if (!group.mobs.length) {
        td.appendChild(raceWrap);
        continue;
      }

      const mobsSpan = document.createElement('span');
      mobsSpan.className = 'rotd-race-mobs';
      mobsSpan.appendChild(document.createTextNode(' ['));

      group.mobs.forEach((m, mobIndex) => {
        const mobSpan = document.createElement('span');
        mobSpan.className = 'rotd-race-mob';
        if (filtersActive) {
          mobSpan.classList.add(mobMatchesActiveFilter(m, delayLimit) ? 'rotd-mob-match' : 'rotd-mob-dim');
        }
        mobSpan.tabIndex = 0;
        mobTipMap.set(mobSpan, m);

        if (m.id) {
          const mobLink = document.createElement('a');
          mobLink.className = 'rotd-mob-link';
          mobLink.href = getMobUrl(m.id, mobDb);
          mobLink.target = '_blank';
          mobLink.rel = 'noopener';
          mobLink.title = `Open ${m.name} [${m.id}] on ${dbLabel}`;
          mobLink.textContent = m.name;
          mobSpan.appendChild(mobLink);
          mobSpan.appendChild(document.createTextNode(' '));
        } else {
          mobSpan.appendChild(document.createTextNode(m.name + ' '));
        }

        const amountSpan = document.createElement('span');
        amountSpan.className = 'rotd-race-mob-amount';
        amountSpan.textContent = m.totalFormatted;
        mobSpan.appendChild(amountSpan);

        mobsSpan.appendChild(mobSpan);
        if (mobIndex < group.mobs.length - 1) {
          mobsSpan.appendChild(document.createTextNode(', '));
        }
      });

      mobsSpan.appendChild(document.createTextNode(']'));
      raceWrap.appendChild(mobsSpan);
      td.appendChild(raceWrap);
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

      const head = document.createElement('div');
      head.className = 'rotd-m-card-head';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'rotd-m-title';

      const rankSpan = document.createElement('span');
      rankSpan.className = 'rotd-m-rank';
      rankSpan.textContent = '#' + (i + 1);
      titleWrap.appendChild(rankSpan);

      titleWrap.appendChild(createMapLink(r.mapName, 'rotd-m-map'));

      if (IS_HR) {
        titleWrap.appendChild(createWarpBtn(r.mapName));
      }

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

      const statsRow = document.createElement('div');
      statsRow.className = 'rotd-m-stats';
      statsRow.innerHTML =
        `<span><strong>Walkable:</strong> ${formatNum(r.walkable, 0)}</span>` +
        `<span><strong>Mean:</strong> ${formatNum(r.monsters, 0)}</span>` +
        `<span><strong>Filtered:</strong> ${formatNum(r.filteredMonsters, 0)}</span>`;
      card.appendChild(statsRow);

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
    hideMobTooltip();

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
      countEl.textContent = `Showing ${rows.length} of ${totalValidMaps} maps`;
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
    if (cardsEl) cardsEl.innerHTML = '';

    if (!rows.length) {
      if (tableWrap) tableWrap.classList.add('rotd-is-empty');
      if (emptyEl) emptyEl.style.display = 'block';
      updateSortIndicators();
      syncURLFromState();
      return;
    }

    if (tableWrap) tableWrap.classList.remove('rotd-is-empty');
    if (emptyEl) emptyEl.style.display = 'none';

    if (isMobileLayout()) {
      renderMobileCards(rows);
    } else {
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
          if (j === 1) {
            const mapWrap = document.createElement('span');
            mapWrap.className = 'rotd-map-cell';
            mapWrap.appendChild(createMapLink(r.mapName));
            if (IS_HR) {
              mapWrap.appendChild(createWarpBtn(r.mapName));
            }
            td.appendChild(mapWrap);
          } else if (j === 5) {
            renderRaceCell(td, r.raceDetails);
          } else {
            td.textContent = cells[j][0];
          }
          tr.appendChild(td);
        }
        frag.appendChild(tr);
      }
      body.appendChild(frag);
    }

    updateSortIndicators();
    syncURLFromState();
  }

  function scheduleDebouncedRender() {
    clearTimeout(inputDebounceTimer);
    inputDebounceTimer = setTimeout(() => {
      applyAutoSort();
      renderRotdTable();
    }, 90);
  }

  function attachTooltipDelegation(container) {
    if (!container) return;
    container.addEventListener('mouseover', e => {
      const mobEl = e.target.closest('.rotd-race-mob');
      if (mobEl) showMobTooltip(mobEl);
    });
    container.addEventListener('mouseout', e => {
      const mobEl = e.target.closest('.rotd-race-mob');
      if (mobEl && !mobEl.contains(e.relatedTarget)) hideMobTooltip();
    });
    container.addEventListener('focusin', e => {
      const mobEl = e.target.closest('.rotd-race-mob');
      if (mobEl) showMobTooltip(mobEl);
    });
    container.addEventListener('focusout', e => {
      const mobEl = e.target.closest('.rotd-race-mob');
      if (mobEl && !mobEl.contains(e.relatedTarget)) hideMobTooltip();
    });
  }

  function bindRotdEvents() {
    const searchEl = document.getElementById('rotdMapSearch');
    const clearSearchBtn = document.getElementById('rotdClearSearchBtn');
    const elemEl = document.getElementById('rotdElementFilter');
    const mobEl = document.getElementById('rotdMobFilter');
    const delayEl = document.getElementById('rotdDelayValue');
    const instantBtn = document.getElementById('rotdInstantBtn');
    const resetBtn = document.getElementById('rotdResetBtn');
    const raceChipsEl = document.getElementById('rotdRaceChips');
    const mobileSortEl = document.getElementById('rotdMobileSortKey');
    const mobileDirEl = document.getElementById('rotdMobileSortDir');

    attachTooltipDelegation(document.getElementById('rotdResultBody'));
    attachTooltipDelegation(document.getElementById('rotdCardsList'));

    if (!mobileMqBound) {
      mobileMqBound = true;
      window.matchMedia('(max-width: 768px)').addEventListener('change', () => {
        if (window.state?.currentTab === 'lab-mob-density' && dataset) {
          renderRotdTable();
        }
      });
    }

    if (searchEl) {
      searchEl.value = rotdState.search;
      searchEl.addEventListener('input', () => {
        rotdState.search = searchEl.value;
        scheduleDebouncedRender();
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

    if (raceChipsEl) {
      raceChipsEl.addEventListener('click', e => {
        const btn = e.target.closest('.ss-chip');
        if (!btn) return;
        const race = btn.dataset.race || 'ALL';
        rotdState.race = rotdState.race === race && race !== 'ALL' ? 'ALL' : race;
        updateRaceChipActive();
        rebuildMobFilter();
        applyAutoSort();
        renderRotdTable();
      });
    }

    if (elemEl) {
      elemEl.addEventListener('change', () => {
        rotdState.element = elemEl.value;
        rebuildMobFilter();
        applyAutoSort();
        renderRotdTable();
      });
    }

    if (mobEl) {
      mobEl.addEventListener('change', () => {
        rotdState.mob = mobEl.value;
        applyAutoSort();
        renderRotdTable();
      });
    }

    if (delayEl) {
      delayEl.value = rotdState.delay;
      delayEl.addEventListener('input', () => {
        rotdState.delay = delayEl.value;
        scheduleDebouncedRender();
      });
    }

    if (instantBtn) {
      instantBtn.classList.toggle('active', rotdState.instantOnly);
      instantBtn.addEventListener('click', () => {
        rotdState.instantOnly = !rotdState.instantOnly;
        instantBtn.classList.toggle('active', rotdState.instantOnly);
        applyAutoSort();
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
        rotdState.instantOnly = false;
        rotdState.manualSort = false;
        if (searchEl) searchEl.value = '';
        if (elemEl) elemEl.value = 'ALL';
        if (delayEl) delayEl.value = '';
        if (instantBtn) instantBtn.classList.remove('active');
        updateRaceChipActive();
        rebuildMobFilter();
        applyAutoSort();
        renderRotdTable();
      });
    }

    if (mobileSortEl) {
      mobileSortEl.addEventListener('change', () => {
        rotdState.manualSort = true;
        rotdState.sortKey = mobileSortEl.value;
        renderRotdTable();
      });
    }

    if (mobileDirEl) {
      mobileDirEl.addEventListener('click', () => {
        rotdState.manualSort = true;
        rotdState.sortDir = rotdState.sortDir === 'asc' ? 'desc' : 'asc';
        renderRotdTable();
      });
    }

    document.querySelectorAll('.rotd-db-btn').forEach(btn => {
      btn.addEventListener('click', () => setMobDbPref(btn.dataset.db));
    });

    document.querySelectorAll('#rotdTable thead th button').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.parentElement.dataset.sort;
        rotdState.manualSort = true;
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

    const mobDb = getMobDbPref();

    const headerHtml = `
      <div class="mg-header-row">
        <div class="lab-section-header">
          <span class="lab-section-title">
            <span class="lab-section-icon">${window.SVG_ICONS?.rotd18 || ''}</span>
            Mob Density (ROTD)
          </span>
          <span class="lab-section-meta">
            <span id="rotdResultCount">Map spawn density &amp; ranking</span> · Credit: <a class="rotd-credit-link" href="https://synomnom.github.io/Ragnarok-Online-Map-Analyzer/" target="_blank" rel="noopener">Synom (Ragnarok Online Map Analyzer)</a>
          </span>
        </div>

        <div class="mg-header-controls">
          <div class="mg-toggle-group" title="Default database when clicking map or monster names">
            <span class="mg-toggle-label">Map/Mob Click:</span>
            <button type="button" class="mg-toggle-btn rotd-db-btn ${mobDb === 'rms' ? 'active' : ''}" data-db="rms">RMS</button>
            <button type="button" class="mg-toggle-btn rotd-db-btn ${mobDb === 'koko' ? 'active' : ''}" data-db="koko">Kokotewa</button>
          </div>
        </div>
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
            <button type="button" id="rotdInstantBtn" class="ss-chip ss-chip-green rotd-chip-icon ${rotdState.instantOnly ? 'active' : ''}"
              title="Show only instant-respawn (0s delay) spawns">${window.SVG_ICONS?.zap12 || ''}<span>Instant Spawn Only</span></button>
            <button type="button" id="rotdResetBtn" class="btn btn-sm rotd-reset-btn hidden" title="Reset all filters">${window.SVG_ICONS?.rotateCcw12 || ''}<span>Reset</span></button>
          </div>

          <div class="rotd-race-chips" id="rotdRaceChips" aria-label="Quick ROTD Race Filter"></div>

          <div class="rotd-filter-row">
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
            <div class="rotd-filter-group rotd-mobile-sort-group">
              <label for="rotdMobileSortKey">Sort:</label>
              <div class="rotd-mobile-sort-controls">
                <select id="rotdMobileSortKey">
                  <option value="density">Map Density</option>
                  <option value="filterDensity">Filter Density</option>
                  <option value="filteredMonsters">Filtered Mobs</option>
                  <option value="monsters">Mean Mobs</option>
                  <option value="walkable">Walkable Cells</option>
                  <option value="map">Map Name</option>
                  <option value="race">Race &amp; Mobs</option>
                </select>
                <button type="button" id="rotdMobileSortDir" class="btn btn-sm rotd-mobile-sort-dir" title="Descending (click to reverse)">↓</button>
              </div>
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
    applyAutoSort();
    bindRotdEvents();
    renderRotdTable();
  }

  syncStateFromURL();

  window.registerLabExperiment?.('lab-mob-density', {
    tabId:        'lab-mob-density',
    title:        'Mob Density (ROTD)',
    sidebarLabel: 'Mob Density (ROTD)',
    sidebarIcon:  window.SVG_ICONS?.rotd14 || '',
    renderMain:   renderRotdMain,
  });
})();
