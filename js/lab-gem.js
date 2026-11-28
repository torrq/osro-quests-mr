// lab-gem.js — Lab: Gem Quest tracker

// ===== CONSTANTS =====

const GEM_TIMER_MS    = 24 * 60 * 60 * 1000;
const GEM_STORAGE_KEY = (typeof LOCAL_STORAGE !== 'undefined' && LOCAL_STORAGE.lab_gem) || 'osromr_lab_gem_v1';

// HR vs MR differences:
// - HR (GEM_IS_HR = true): enables `@warp <map [x y]>` copy buttons, omits walking-direction `mrNote`s,
//   and uses `hrMobs` / `hrLocations` where higher HR drop rates change the optimal farm spot.
// - MR (GEM_IS_HR = false): copies bare `<map [x y]>` without `@warp`, displays `mrNote` portal/navigation tips,
//   and uses `mobs` / `locations`.
// - `note` is shown on both HR and MR (e.g. NPC shop reminders).
const GEM_IS_HR = typeof FLAVOR === 'string' && FLAVOR.toLowerCase().includes('highrate');

const GEM_ITEMS = [
  {
    id: 720, name: 'Aquamarine', amount: 50, source: 'mob',
    mobs: [{ id: 1065, name: 'Strouf' }],
    hrMobs: [
      { id: 1158, name: 'Phen' },
      { id: 1045, name: 'Marc' },
      { id: 1142, name: 'Marine Sphere' },
      { id: 1264, name: 'Merman' },
    ],
    mrNote: 'iz_dun02 → @navi iz_dun04',
    locations: [{ map: 'iz_dun04' }],
    hrLocations: [{ map: 'iz_dun03' }],
  },
  {
    id: 719, name: 'Amethyst', amount: 50, source: 'mob',
    mobs: [{ id: 1216, name: 'Penomena' }, { id: 1111, name: 'Drainliar' }],
    hrMobs: [{ id: 1099, name: 'Argiope' }],
    mrNote: 'Clock Tower B2 → Top Right portal',
    locations: [{ map: 'mjolnir_05' }],
  },
  {
    id: 725, name: 'Sardonyx', amount: 50, source: 'mob',
    mobs: [{ id: 1111, name: 'Drainliar' }],
    locations: [{ map: 'alde_dun03' }],
  },
  {
    id: 722, name: 'Pearl', amount: 50, source: 'mob',
    mobs: [{ id: 1323, name: 'Sea Otter' }],
    hrMobs: [{ id: 1148, name: 'Medusa' }],
    mrNote: 'cmd_fild03 → 6 o\'clock portal',
    locations: [{ map: 'cmd_fild04' }],
    hrLocations: [{ map: 'beach_dun' }],
  },
  {
    id: 726, name: 'Sapphire', amount: 50, source: 'npc',
    mobs: [],
    note: 'Buy from NPC shop',
    locations: [{ map: 'lhz_in02 105 21' }],
  },
  {
    id: 718, name: 'Garnet', amount: 50, source: 'mob',
    mobs: [{ id: 1703, name: 'Lady Solace' }],
    mrNote: 'tha_t03 → climb up; kill all as you go',
    locations: [{ map: 'tha_t07–tha_t12', maps: ['tha_t07', 'tha_t08', 'tha_t09', 'tha_t10', 'tha_t11', 'tha_t12'] }],
  },
  {
    id: 732, name: '3-Carat Diamond', amount: 50, source: 'npc',
    mobs: [],
    note: 'Buy from NPC (500 at a time)',
    locations: [{ map: 'mjolnir_02 85 364' }],
  },
  {
    id: 729, name: 'Zircon', amount: 50, source: 'npc',
    mobs: [],
    note: 'Buy from NPC shop',
    locations: [{ map: 'lhz_in02 105 21' }],
  },
  {
    id: 723, name: 'Ruby', amount: 50, source: 'npc',
    mobs: [],
    note: 'Buy from NPC shop',
    locations: [{ map: 'lhz_in02 105 21' }],
  },
  {
    id: 728, name: 'Topaz', amount: 50, source: 'npc',
    mobs: [],
    note: 'Buy from NPC shop',
    locations: [{ map: 'lhz_in02 105 21' }],
  },
];

// ===== STORAGE =====

function gemLoad() {
  try {
    return (window.osroStore ? osroStore.getJson(GEM_STORAGE_KEY, { timers: [] }) : JSON.parse(localStorage.getItem(GEM_STORAGE_KEY))) || { timers: [] };
  } catch { return { timers: [] }; }
}

function gemSave(data) {
  if (data && Array.isArray(data.timers)) {
    const now = Date.now();
    data.timers.forEach(t => {
      if (!t.updatedAt) t.updatedAt = now;
    });
  }
  if (window.osroStore) {
    osroStore.setItem(GEM_STORAGE_KEY, data);
  } else {
    localStorage.setItem(GEM_STORAGE_KEY, JSON.stringify(data));
  }
}

const gemIntervals = {};

// ===== RENDER =====

function gemRenderMain() {
  const container = document.getElementById('mainContent');
  if (!container) return;

  const data = gemLoad();

  container.innerHTML = `
    <div class="ca-main ca-main--wide">

      <div class="ca-header">
        <div class="ca-title">
          ${window.SVG_ICONS?.gem18 || ''}
          Gem Quest
        </div>
        <div class="ca-header-actions">
          <button class="btn btn-sm" onclick="gemStopAll()" title="Stop all timers">Stop All</button>
          <button class="btn btn-primary btn-sm" onclick="gemAddTimer()">+ Account</button>
        </div>
      </div>

      <div class="ca-timers" id="gemTimers">
        ${data.timers.length === 0 ? gemEmptyState() : data.timers.map(gemTimerCard).join('')}
      </div>

      <div class="ca-info-section ca-info-section--single">
        ${gemHowTo()}
      </div>

    </div>`;

  Object.keys(gemIntervals).forEach(id => { clearInterval(gemIntervals[id]); delete gemIntervals[id]; });
  data.timers.forEach(t => { if (t.startedAt) gemStartTick(t.id); });
}

function gemEmptyState() {
  return `
    <div class="ca-empty">
      ${window.SVG_ICONS?.gem32Muted || ''}
      <div class="ca-empty-text">No timers yet</div>
      <div class="ca-empty-sub">Add a timer per account using the button above</div>
    </div>`;
}

function gemIdleDisplay(id) {
  return `<input class="ca-time-input" id="gem-h-${id}" type="number" min="0" max="99" value="24"><span class="ca-timer-sep">h</span>`
       + `<input class="ca-time-input" id="gem-m-${id}" type="number" min="0" max="59" value="00"><span class="ca-timer-sep">m</span>`
       + `<input class="ca-time-input" id="gem-s-${id}" type="number" min="0" max="59" value="00"><span class="ca-timer-sep">s</span>`;
}

function gemTimerCard(t) {
  const running = !!t.startedAt;
  const done = !!t.finishedAt && !running;
  const doneClass = done ? ' ca-timer--done' : '';
  const notifyOnDone = !!t.notifyOnDone;
  return `
    <div class="ca-timer ca-timer--gem${doneClass}" data-id="${t.id}">
      <div class="ca-timer-top">
        <div class="ca-timer-left">
          <input class="ca-name-input" value="${escapeHtml(t.name)}"
                 placeholder="Account name…"
                 onchange="gemRenameTimer('${t.id}', this.value)"
                 onclick="this.select()"/>
          <span class="ca-type-badge ca-type-badge--gem">Gem Quest</span>
          <label class="ca-notify-toggle" title="Notify when ready">
            <input type="checkbox" ${notifyOnDone ? 'checked' : ''} onchange="gemSetNotifyOnDone('${t.id}', this.checked, this)">
            Notify
          </label>
        </div>
        <button class="ca-delete-btn" onclick="gemDeleteTimer('${t.id}')" title="Delete timer">
          ${window.SVG_ICONS?.trashNoX14 || ''}
        </button>
      </div>

      <div class="ca-timer-display" id="gem-display-${t.id}">
        ${running ? gemFormatRemaining(t.startedAt) : done ? gemFormatFinished(t.finishedAt) : gemIdleDisplay(t.id)}
      </div>

      <input type="range" class="ca-slider gem-slider" min="0" max="${GEM_TIMER_MS}" step="60000"
             value="${running ? Math.max(0, GEM_TIMER_MS - (Date.now() - t.startedAt)) : done ? 0 : GEM_TIMER_MS}"
             oninput="gemSliderInput('${t.id}', this.value)"
             onchange="gemSliderCommit('${t.id}', this.value)"
             title="Adjust remaining time"/>

      <div class="ca-timer-actions">
        ${running
          ? `<button class="btn btn-sm" onclick="gemStopTimer('${t.id}')">Stop</button>`
          : done
            ? `<button class="btn btn-primary btn-sm gem-start-btn" onclick="gemStartTimer('${t.id}')">Start</button>
               <button class="btn btn-sm" onclick="gemResetTimer('${t.id}')">Reset</button>`
            : `<button class="btn btn-primary btn-sm gem-start-btn" onclick="gemStartTimerFromDisplay('${t.id}')">Start</button>`}
      </div>
    </div>`;
}

function gemWarpCommand(mapStr) {
  const m = (mapStr || '').trim().match(/^([A-Za-z0-9_]+)\s+(\d+)\s+(\d+)$/);
  if (m) return GEM_IS_HR ? `@warp ${m[1]} ${m[2]} ${m[3]}` : `${m[1]} ${m[2]} ${m[3]}`;

  const mapOnly = (mapStr || '').trim().match(/^([A-Za-z0-9_]+)$/);
  if (mapOnly) return GEM_IS_HR ? `@warp ${mapOnly[1]}` : `${mapOnly[1]}`;

  return null;
}

function gemCopyText(text) {
  const t = String(text || '');
  // Prefer async clipboard when available (requires secure context in most browsers)
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(t);
  }
  // Fallback: hidden textarea + execCommand
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = t;
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

async function gemCopyWarp(mapStr) {
  const cmd = gemWarpCommand(mapStr);
  if (!cmd) return;
  try {
    await gemCopyText(cmd);
    if (typeof showToast === 'function') showToast(`Copied: ${cmd}`, 'success', 1500);
  } catch {
    if (typeof showToast === 'function') showToast('Copy failed', 'error', 2500);
  }
}

window.gemCopyWarp = gemCopyWarp;

async function gemCopyCmd(cmd) {
  if (!cmd) return;
  try {
    await gemCopyText(cmd);
    if (typeof showToast === 'function') showToast(`Copied: ${cmd}`, 'success', 1500);
  } catch {
    if (typeof showToast === 'function') showToast('Copy failed', 'error', 2500);
  }
}

window.gemCopyCmd = gemCopyCmd;

function gemGetMobDbPref() {
  try {
    const data = typeof loadLabData === 'function' ? loadLabData() : {};
    return data.gemMobDb === 'koko' ? 'koko' : 'rms';
  } catch {
    return 'rms';
  }
}

function gemMobUrl(mobId, db) {
  if (db === 'koko') {
    return `https://ro.kokotewa.com/db/mon_info?id=${encodeURIComponent(mobId)}`;
  }
  return `https://ratemyserver.net/index.php?page=mob_db&mob_id=${encodeURIComponent(mobId)}`;
}

function gemSetMobDb(db) {
  const val = db === 'koko' ? 'koko' : 'rms';
  if (typeof saveLabData === 'function') {
    saveLabData({ gemMobDb: val });
  }
  document.querySelectorAll('#gemMobDbToggle .mg-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.db === val);
  });
  const guideEl = document.getElementById('gemGuideSection');
  if (guideEl) {
    guideEl.outerHTML = gemHowTo();
  }
}

window.gemSetMobDb = gemSetMobDb;

function gemRenderMapBtn(mapStr) {
  const enc = encodeURIComponent(mapStr);
  const cmd = gemWarpCommand(mapStr) || mapStr;
  const copyIcon = window.SVG_ICONS?.copy11 || '';
  return `<button type="button" class="gem-map-btn" onclick="gemCopyWarp(decodeURIComponent('${enc}'))" title="Copy ${escapeHtml(cmd)}">${copyIcon ? `<span class="gem-map-btn-icon">${copyIcon}</span>` : ''}<span>${escapeHtml(cmd)}</span></button>`;
}

function gemHowTo() {
  const sorted = [...GEM_ITEMS].sort((a, b) => a.name.localeCompare(b.name));
  const mobDb = gemGetMobDbPref();
  const dbLabel = mobDb === 'koko' ? 'Kokotewa' : 'RateMyServer';
  const copyIcon = window.SVG_ICONS?.copy11 || '';

  return `
    <div class="ca-passport ca-passport--gem" id="gemGuideSection">
      <div class="gem-guide-header gem-guide-header--callout">
        <div class="gem-guide-header-top">
          <div class="gem-guide-title-row">
            ${window.SVG_ICONS?.gem18 || ''}
            <span class="gem-guide-title">Gem Quest Guide</span>
          </div>
          <button type="button" class="gem-npc-btn" onclick="gemCopyCmd('@npc gem')" title="Copy @npc gem">${copyIcon ? `<span class="gem-map-btn-icon">${copyIcon}</span>` : ''}<span>@npc gem</span></button>
        </div>
        <div class="gem-guide-sub">
          Submit <strong>10 gems × 50</strong> for <strong>50–100 Activity Points</strong> (5–10 per gem). Cooldown begins on the <strong>10th</strong> submit · <strong>24h</strong> / account.
        </div>
      </div>

      <div class="gem-grid">
        ${sorted.map(g => {
          const isNpc = g.source === 'npc';
          const locs = (GEM_IS_HR && Array.isArray(g.hrLocations)) ? g.hrLocations : g.locations;
          const mobs = (GEM_IS_HR && Array.isArray(g.hrMobs)) ? g.hrMobs : g.mobs;

          const locsHtml = locs.map(l => {
            const maps = Array.isArray(l.maps) ? l.maps : null;
            if (maps) {
              return maps.map(m => gemRenderMapBtn(m)).join('');
            }
            return gemRenderMapBtn(l.map);
          }).join('');

          const mobsHtml = Array.isArray(mobs) && mobs.length
            ? mobs.map(m => `
                <a class="gem-mob-pill" href="${gemMobUrl(m.id, mobDb)}" target="_blank" rel="noopener" title="Open ${escapeHtml(m.name)} [${m.id}] on ${dbLabel}">
                  <span class="gem-mob-name">${escapeHtml(m.name)}</span>
                  <span class="gem-mob-id">#${m.id}</span>
                </a>
              `).join('')
            : '';

          return `
            <div class="gem-card">
              <div class="gem-card-top">
                <div class="gem-card-item">
                  ${renderItemIcon(g.id, 24)}
                  <a class="item-link ca-passport-req-name gem-item-link" onclick="navigateToItem(${g.id})" title="${escapeHtml(g.name)}">${escapeHtml(g.name)}</a>
                  <span class="gem-item-id">#${g.id}</span>
                </div>
                <div class="gem-card-badges">
                  <span class="gem-amt-pill">×${g.amount}</span>
                  <span class="gem-source-pill ${isNpc ? 'gem-source-pill--npc' : 'gem-source-pill--mob'}">${isNpc ? 'NPC' : 'Mob'}</span>
                </div>
              </div>

              <div class="gem-card-rows">
                ${mobsHtml ? `
                  <div class="gem-detail-row">
                    <span class="gem-detail-label">Mobs</span>
                    <div class="gem-detail-val gem-mobs-list">${mobsHtml}</div>
                  </div>
                ` : ''}

                <div class="gem-detail-row">
                  <span class="gem-detail-label">${GEM_IS_HR ? 'Warp' : 'Map'}</span>
                  <div class="gem-detail-val gem-locs-list">${locsHtml}</div>
                </div>

                ${(() => {
                  const displayNote = GEM_IS_HR ? (g.note || '') : (g.mrNote || g.note || '');
                  return displayNote ? `
                  <div class="gem-detail-row gem-detail-row--note">
                    <span class="gem-detail-label">Note</span>
                    <div class="gem-detail-val gem-note-text">${escapeHtml(displayNote)}</div>
                  </div>
                ` : '';
                })()}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="gem-guide-footer">
        <div class="mg-toggle-group gem-db-toggle" id="gemMobDbToggle" title="Default database when clicking monster names">
          <span class="mg-toggle-label">Mob Click:</span>
          <button type="button" class="mg-toggle-btn ${mobDb === 'rms' ? 'active' : ''}" data-db="rms" onclick="gemSetMobDb('rms')">RMS</button>
          <button type="button" class="mg-toggle-btn ${mobDb === 'koko' ? 'active' : ''}" data-db="koko" onclick="gemSetMobDb('koko')">Kokotewa</button>
        </div>
      </div>
    </div>`;
}

// ===== TIMER LOGIC =====

function gemAddTimer() {
  const data = gemLoad();
  const id = 'gem_' + Date.now();
  const count = data.timers.length + 1;
  data.timers.push({
    id,
    name: `Account ${count}`,
    startedAt: null,
    finishedAt: null,
    notifyOnDone: false,
    notifiedForFinishedAt: null,
    cloudMessageId: null,
    updatedAt: Date.now(),
  });
  gemSave(data);
  gemRenderMain();
}

function gemDeleteTimer(id) {
  clearInterval(gemIntervals[id]);
  delete gemIntervals[id];
  const data = gemLoad();
  const t = data.timers.find(timer => timer.id === id);
  if (t?.cloudMessageId) {
    osroCancelCloudPush(t.cloudMessageId);
  }
  if (!data.deletedTimers) data.deletedTimers = {};
  data.deletedTimers[id] = Date.now();
  data.timers = data.timers.filter(t => t.id !== id);
  gemSave(data);
  const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
  if (card) card.remove();
  const el = document.getElementById('gemTimers');
  if (el && !el.querySelector('.ca-timer')) el.innerHTML = gemEmptyState();
}

async function gemStartTimer(id) {
  const data = gemLoad();
  const t = data.timers.find(t => t.id === id);
  if (!t) return;

  // Cancel any existing cloud push before restarting
  if (t.cloudMessageId) {
    osroCancelCloudPush(t.cloudMessageId);
    t.cloudMessageId = null;
  }

  t.startedAt = Date.now();
  t.finishedAt = null;
  t.notifiedForFinishedAt = null;
  t.updatedAt = Date.now();

  // Schedule cloud push if notify is enabled
  if (t.notifyOnDone) {
    const canNotify = await osroEnsureNotifyPermission();
    if (canNotify) {
      const msgId = await osroScheduleCloudPush(id, GEM_TIMER_MS / 1000, {
        title: osroNotifyTitle('Gem Quest'),
        body:  `${t.name || 'Account'} is ready.`,
        url: 'https://torrq.github.io/osro-quests-hr/?tab=lab-gem',
      });
      if (msgId) t.cloudMessageId = msgId;
    }
  }

  gemSave(data);
  const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
  if (card) {
    card.classList.remove('ca-timer--done');
    card.querySelector('.ca-timer-actions').innerHTML =
      `<button class="btn btn-sm" onclick="gemStopTimer('${id}')">Stop</button>`;
    const sl = card.querySelector('.ca-slider');
    if (sl) sl.value = GEM_TIMER_MS;
  }
  gemStartTick(id);
}

function gemStopTimer(id) {
  clearInterval(gemIntervals[id]);
  delete gemIntervals[id];
  const data = gemLoad();
  const t = data.timers.find(t => t.id === id);
  if (!t) return;

  // Cancel any pending cloud push so it doesn't fire after stopping
  if (t.cloudMessageId) {
    osroCancelCloudPush(t.cloudMessageId);
    t.cloudMessageId = null;
  }

  t.startedAt = null;
  t.finishedAt = null;
  t.updatedAt = Date.now();
  gemSave(data);
  const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
  if (card) {
    card.classList.remove('ca-timer--done');
    const disp = document.getElementById(`gem-display-${id}`);
    if (disp) disp.innerHTML = gemIdleDisplay(id);
    card.querySelector('.ca-timer-actions').innerHTML =
      `<button class="btn btn-primary btn-sm gem-start-btn" onclick="gemStartTimerFromDisplay('${id}')">Start</button>`;
    const sl = card.querySelector('.ca-slider');
    if (sl) sl.value = GEM_TIMER_MS;
  }
}

function gemStopAll() {
  const data = gemLoad();
  const now = Date.now();
  data.timers.forEach(t => {
    if (t.cloudMessageId) {
      osroCancelCloudPush(t.cloudMessageId);
      t.cloudMessageId = null;
    }
    t.startedAt = null;
    t.finishedAt = null;
    t.updatedAt = now;
  });
  gemSave(data);
  Object.keys(gemIntervals).forEach(id => { clearInterval(gemIntervals[id]); delete gemIntervals[id]; });
  gemRenderMain();
}

function gemRenameTimer(id, name) {
  const data = gemLoad();
  const t = data.timers.find(t => t.id === id);
  if (t) { t.name = name; t.updatedAt = Date.now(); gemSave(data); }
}

function gemStartTick(id) {
  clearInterval(gemIntervals[id]);
  gemIntervals[id] = setInterval(() => {
    const data = gemLoad();
    const t = data.timers.find(t => t.id === id);
    if (!t?.startedAt) { clearInterval(gemIntervals[id]); return; }
    const disp = document.getElementById(`gem-display-${id}`);
    const sl   = document.querySelector(`.ca-timer[data-id="${id}"] .ca-slider`);
    const remaining = GEM_TIMER_MS - (Date.now() - t.startedAt);
    if (remaining <= 0) {
      const finishedAt = t.startedAt + GEM_TIMER_MS;
      t.startedAt = null;
      t.finishedAt = finishedAt;
      t.updatedAt = Date.now();
      gemMaybeNotifyDone(t, finishedAt);
      gemSave(data);

      const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
      if (card) card.classList.add('ca-timer--done');
      if (disp) disp.innerHTML = gemFormatFinished(finishedAt);
      if (sl)   sl.value = 0;
      clearInterval(gemIntervals[id]);
      delete gemIntervals[id];
      const act = document.querySelector(`.ca-timer[data-id="${id}"] .ca-timer-actions`);
      if (act) act.innerHTML = `<button class="btn btn-primary btn-sm gem-start-btn" onclick="gemStartTimer('${id}')">Start</button><button class="btn btn-sm" onclick="gemResetTimer('${id}')">Reset</button>`;
    } else {
      if (disp) disp.innerHTML = gemFormatRemaining(t.startedAt);
      if (sl)   sl.value = Math.max(0, remaining);
    }
  }, 1000);
}

// ===== SLIDER =====

function gemSliderInput(id, val) {
  const remaining = parseInt(val);
  const disp = document.getElementById(`gem-display-${id}`);
  if (disp) disp.innerHTML = remaining > 0 ? gemFormatMs(remaining) : gemIdleDisplay(id);
}

function gemSliderCommit(id, val) {
  const remaining = parseInt(val);
  const data = gemLoad();
  const t = data.timers.find(t => t.id === id);
  if (!t) return;
  clearInterval(gemIntervals[id]);
  delete gemIntervals[id];

  // Always cancel any existing cloud push — we'll reschedule if needed
  if (t.cloudMessageId) {
    osroCancelCloudPush(t.cloudMessageId);
    t.cloudMessageId = null;
  }

  const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
  if (remaining <= 0) {
    if (t.startedAt) t.finishedAt = t.startedAt + GEM_TIMER_MS;
    t.startedAt = null;
    if (t.finishedAt) gemMaybeNotifyDone(t, t.finishedAt);
    if (card) {
      card.querySelector('.ca-timer-actions').innerHTML =
        `<button class="btn btn-primary btn-sm gem-start-btn" onclick="gemStartTimer('${id}')">Start</button>${t.finishedAt ? `<button class="btn btn-sm" onclick="gemResetTimer('${id}')">Reset</button>` : ''}`;
      const disp = document.getElementById(`gem-display-${id}`);
      if (disp) disp.innerHTML = t.finishedAt ? gemFormatFinished(t.finishedAt) : '<span class="ca-timer-idle">—</span>';
      if (t.finishedAt) card.classList.add('ca-timer--done');
      else card.classList.remove('ca-timer--done');
    }
  } else {
    t.startedAt = Date.now() - (GEM_TIMER_MS - remaining);
    t.finishedAt = null;
    t.updatedAt = Date.now();

    // Reschedule cloud push with the new remaining time
    if (t.notifyOnDone) {
      osroEnsureNotifyPermission().then(canNotify => {
        if (canNotify) {
          osroScheduleCloudPush(id, Math.ceil(remaining / 1000), {
            title: osroNotifyTitle('Gem Quest'),
            body:  `${t.name || 'Account'} is ready.`,
            url: 'https://torrq.github.io/osro-quests-hr/?tab=lab-gem',
          }).then(msgId => {
            if (msgId) {
              const d = gemLoad();
              const timer = d.timers.find(x => x.id === id);
              if (timer) { timer.cloudMessageId = msgId; timer.updatedAt = Date.now(); gemSave(d); }
            }
          });
        }
      });
    }

    gemStartTick(id);
    if (card) card.querySelector('.ca-timer-actions').innerHTML =
      `<button class="btn btn-sm" onclick="gemStopTimer('${id}')">Stop</button>`;
    if (card) card.classList.remove('ca-timer--done');
  }
  t.updatedAt = Date.now();
  gemSave(data);
}

async function gemStartTimerFromDisplay(id) {
  const h = Math.max(0, parseInt(document.getElementById(`gem-h-${id}`)?.value) || 0);
  const m = Math.max(0, parseInt(document.getElementById(`gem-m-${id}`)?.value) || 0);
  const s = Math.max(0, parseInt(document.getElementById(`gem-s-${id}`)?.value) || 0);
  const remaining = Math.min((h * 3600 + m * 60 + s) * 1000, GEM_TIMER_MS);
  const data = gemLoad();
  const t = data.timers.find(t => t.id === id);
  if (!t) return;

  // Cancel any existing cloud push before starting fresh
  if (t.cloudMessageId) {
    osroCancelCloudPush(t.cloudMessageId);
    t.cloudMessageId = null;
  }

  t.startedAt = Date.now() - (GEM_TIMER_MS - remaining);
  t.finishedAt = null;
  t.notifiedForFinishedAt = null;
  t.updatedAt = Date.now();

  // Schedule cloud push if notify is enabled
  if (t.notifyOnDone) {
    const canNotify = await osroEnsureNotifyPermission();
    if (canNotify) {
      const delayInSeconds = Math.ceil(remaining / 1000);
      const msgId = await osroScheduleCloudPush(id, delayInSeconds, {
        title: osroNotifyTitle('Gem Quest'),
        body:  `${t.name || 'Account'} is ready.`,
        url: 'https://torrq.github.io/osro-quests-hr/?tab=lab-gem',
      });
      if (msgId) t.cloudMessageId = msgId;
    }
  }

  gemSave(data);
  const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
  if (card) {
    card.classList.remove('ca-timer--done');
    const actionsEl = card.querySelector('.ca-timer-actions');
    if (actionsEl) actionsEl.innerHTML = `<button class="btn btn-sm" onclick="gemStopTimer('${id}')">Stop</button>`;
    const slider = card.querySelector('.ca-slider');
    if (slider) slider.value = remaining;
  }
  gemStartTick(id);
}

function gemMaybeNotifyDone(t, finishedAt) {
  if (!t?.notifyOnDone) return;
  if (!finishedAt) return;
  if (t.notifiedForFinishedAt === finishedAt) return;
  t.notifiedForFinishedAt = finishedAt;

  if (typeof window.osroNotifyReady === 'function') {
    window.osroNotifyReady({
      section: 'Gem Quest',
      body:    `${t.name || 'Account'} is ready.`,
      tag:     `osrohr_gem_${t.id}`,
      url:     '?tab=lab-gem',
    });
  }
}

async function gemSetNotifyOnDone(id, enabled, el) {
  const data = gemLoad();
  const t = data.timers.find(t => t.id === id);
  if (!t) return;

  const next = !!enabled;
  if (next && typeof window.osroEnsureNotifyPermission === 'function') {
    const ok = await window.osroEnsureNotifyPermission();
    if (!ok) {
      t.notifyOnDone = false;
      gemSave(data);
      if (el) el.checked = false;
      if (typeof showToast === 'function') showToast('Browser notifications are blocked for this site.', 'error', 3000);
      return;
    }
    // Enabling with an active timer: schedule cloud push for remaining time
    if (t.startedAt) {
      const elapsed   = Date.now() - t.startedAt;
      const remaining = GEM_TIMER_MS - elapsed;
      if (remaining > 0) {
        if (t.cloudMessageId) osroCancelCloudPush(t.cloudMessageId);
        const msgId = await osroScheduleCloudPush(id, Math.ceil(remaining / 1000), {
          title: osroNotifyTitle('Gem Quest'),
          body:  `${t.name || 'Account'} is ready.`,
          url: 'https://torrq.github.io/osro-quests-hr/?tab=lab-gem',
        });
        if (msgId) t.cloudMessageId = msgId;
      }
    }
  } else if (!next) {
    // Disabling: cancel any pending cloud push
    if (t.cloudMessageId) {
      osroCancelCloudPush(t.cloudMessageId);
      t.cloudMessageId = null;
    }
  }

  t.notifyOnDone = next;
  t.updatedAt = Date.now();
  gemSave(data);
}

// ===== FORMAT =====

function gemFormatRemaining(startedAt) {
  const remaining = GEM_TIMER_MS - (Date.now() - startedAt);
  if (remaining <= 0) return '<span class="ca-timer-ready">Ready!</span>';
  return gemFormatMs(remaining);
}

function gemFormatFinished(finishedAt) {
  const when = new Date(finishedAt).toLocaleString();
  return `<span class="ca-timer-ready">Ready!</span><div class="ca-timer-finished-at">Finished ${escapeHtml(when)}</div>`;
}

function gemFormatMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `<span class="ca-timer-h">${h}</span><span class="ca-timer-sep">h</span>`
       + `<span class="ca-timer-m">${String(m).padStart(2,'0')}</span><span class="ca-timer-sep">m</span>`
       + `<span class="ca-timer-s">${String(s).padStart(2,'0')}</span><span class="ca-timer-sep">s</span>`;
}

function gemResetTimer(id) {
  clearInterval(gemIntervals[id]);
  delete gemIntervals[id];
  const data = gemLoad();
  const t = data.timers.find(t => t.id === id);
  if (!t) return;

  // Cancel any pending cloud push
  if (t.cloudMessageId) {
    osroCancelCloudPush(t.cloudMessageId);
    t.cloudMessageId = null;
  }

  t.startedAt = null;
  t.finishedAt = null;
  t.updatedAt = Date.now();
  gemSave(data);

  const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
  if (card) {
    card.classList.remove('ca-timer--done');
    const disp = document.getElementById(`gem-display-${id}`);
    if (disp) disp.innerHTML = gemIdleDisplay(id);
    card.querySelector('.ca-timer-actions').innerHTML =
      `<button class="btn btn-primary btn-sm gem-start-btn" onclick="gemStartTimerFromDisplay('${id}')">Start</button>`;
    const sl = card.querySelector('.ca-slider');
    if (sl) sl.value = GEM_TIMER_MS;
  }
}

// ===== REGISTRATION =====

window.registerLabExperiment?.('lab-gem', {
  tabId:        'lab-gem',
  title:        'Gem Quest',
  sidebarLabel: 'Gem Quest',
  sidebarIcon: window.SVG_ICONS?.gem14 || '',
  renderMain: gemRenderMain,
});

window.gemAddTimer    = gemAddTimer;
window.gemDeleteTimer = gemDeleteTimer;
window.gemStartTimer  = gemStartTimer;
window.gemStartTimerFromDisplay = gemStartTimerFromDisplay;
window.gemStopTimer   = gemStopTimer;
window.gemStopAll     = gemStopAll;
window.gemRenameTimer = gemRenameTimer;
window.gemSliderInput = gemSliderInput;
window.gemSliderCommit = gemSliderCommit;
window.gemResetTimer  = gemResetTimer;
window.gemSetNotifyOnDone = gemSetNotifyOnDone;
