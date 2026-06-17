// lab-gem.js — Lab: Gem Quest tracker

// ===== CONSTANTS =====

const GEM_TIMER_MS    = 24 * 60 * 60 * 1000;
const GEM_STORAGE_KEY = 'osrohr_lab_gem_v1';

const GEM_ITEMS = [
  {
    id: 720, name: 'Aquamarine', amount: 50,
    note: 'MOB 1065 — iz_dun02 → @navi iz_dun04',
    locations: [{ map: 'iz_dun04' }],
  },
  {
    id: 719, name: 'Amethyst', amount: 50,
    note: 'MOBs 1216, 1111 — Clock Tower B2 → Top Right portal',
    locations: [{ map: 'mjolnir_05' }],
  },
  {
    id: 725, name: 'Sardonyx', amount: 50,
    note: 'MOB 1111',
    locations: [{ map: 'alde_dun03' }],
  },
  {
    id: 722, name: 'Pearl', amount: 50,
    note: 'MOB 1323 — cmd_fild03 → 6 o\'clock portal',
    locations: [{ map: 'cmd_fild04' }],
  },
  {
    id: 726, name: 'Sapphire', amount: 50,
    note: 'NPC shop',
    locations: [{ map: 'lhz_in02 105 21' }],
  },
  {
    id: 718, name: 'Garnet', amount: 50,
    note: 'MOB 1703 — tha_t03 → climb up; kill all as you go',
    locations: [{ map: 'tha_t08 / tha_t09', maps: ['tha_t08', 'tha_t09'] }],
  },
  {
    id: 732, name: '3-Carat Diamond', amount: 50,
    note: 'Buy from NPC (500 at a time)',
    locations: [{ map: 'mjolnir_02 85 364' }],
  },
  {
    id: 729, name: 'Zircon', amount: 50,
    note: 'NPC shop',
    locations: [{ map: 'lhz_in02 105 21' }],
  },
  {
    id: 723, name: 'Ruby', amount: 50,
    note: 'NPC shop',
    locations: [{ map: 'lhz_in02 105 21' }],
  },
  {
    id: 728, name: 'Topaz', amount: 50,
    note: 'NPC shop',
    locations: [{ map: 'lhz_in02 105 21' }],
  },
];

// ===== STORAGE =====

function gemLoad() {
  try { return JSON.parse(localStorage.getItem(GEM_STORAGE_KEY)) || { timers: [] }; }
  catch { return { timers: [] }; }
}

function gemSave(data) {
  localStorage.setItem(GEM_STORAGE_KEY, JSON.stringify(data));
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
  if (m) return `${m[1]} ${m[2]} ${m[3]}`;

  const mapOnly = (mapStr || '').trim().match(/^([A-Za-z0-9_]+)$/);
  if (mapOnly) return `${mapOnly[1]}`;

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
    if (typeof showToast === 'function') showToast('Copied!', 'success', 1200);
  } catch {
    if (typeof showToast === 'function') showToast('Copy failed', 'error', 2500);
  }
}

window.gemCopyWarp = gemCopyWarp;

function gemHowTo() {
  const sorted = [...GEM_ITEMS].sort((a, b) => a.name.localeCompare(b.name));
  return `
    <div class="ca-passport ca-passport--gem">
      <div class="ca-passport-title">Gem Quest Guide</div>
      <div class="ca-passport-meta">
        Gem Quest can be completed <strong>once every 24 hours per account</strong>.
        Type <code class="gem-map">@npc gem</code> to reach the NPC, then submit <strong>10 gem types</strong> (<strong>50</strong> each).
        Rewards <strong>50–100 Activity Points</strong> total (random 5–10 per gem).
        Cooldown is <strong>independent of the game timer</strong> and begins only after you submit the <strong>10th</strong> item (the announcement).
      </div>
      <div class="gem-grid">
        ${sorted.map(g => `
          <div class="gem-card">
            <div class="gem-line gem-line--item">
              <div class="gem-line-left">
                ${renderItemIcon(g.id, 24)}
                <span class="ca-passport-req-amt">×${g.amount}</span>
                <a class="item-link ca-passport-req-name gem-item-link" onclick="navigateToItem(${g.id})" title="${g.name}">${g.name}</a>
              </div>
              <div class="gem-line-note">${escapeHtml(g.note || '')}</div>
            </div>
            <div class="gem-locs">
              ${g.locations.map(l => `
                <div class="gem-line gem-line--loc">
                  <div class="gem-line-left">
                    ${(() => {
                      const maps = Array.isArray(l.maps) ? l.maps : null;
                      if (maps) {
                        return maps.map((m, idx) => {
                          const encMap = encodeURIComponent(m);
                          const label = m.replace(/^tha_/, '').toUpperCase();
                          const sep = idx === 0 ? '' : '<span class="gem-map-sep">/</span>';
                          return `${sep}<button class="gem-map-btn" onclick="gemCopyWarp(decodeURIComponent('${encMap}'))" title="Copy ${m}">${m}</button>`;
                        }).join('');
                      }
                      const enc = encodeURIComponent(l.map);
                      return `<button class="gem-map-btn" onclick="gemCopyWarp(decodeURIComponent('${enc}'))" title="Copy ${l.map}">${l.map}</button>`;
                    })()}
                  </div>
                  <div class="gem-line-note"></div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
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
  });
  gemSave(data);
  gemRenderMain();
}

function gemDeleteTimer(id) {
  clearInterval(gemIntervals[id]);
  delete gemIntervals[id];
  const data = gemLoad();
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
  data.timers.forEach(t => {
    if (t.cloudMessageId) {
      osroCancelCloudPush(t.cloudMessageId);
      t.cloudMessageId = null;
    }
    t.startedAt = null;
    t.finishedAt = null;
  });
  gemSave(data);
  Object.keys(gemIntervals).forEach(id => { clearInterval(gemIntervals[id]); delete gemIntervals[id]; });
  gemRenderMain();
}

function gemRenameTimer(id, name) {
  const data = gemLoad();
  const t = data.timers.find(t => t.id === id);
  if (t) { t.name = name; gemSave(data); }
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
              if (timer) { timer.cloudMessageId = msgId; gemSave(d); }
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
