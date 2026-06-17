// lab-credit.js — Lab: Credit Agent timer tracker

// ===== CONSTANTS =====

const CA_TIMER_MS    = 24 * 60 * 60 * 1000;  // 24 hours
const CA_STORAGE_KEY = 'osrohr_lab_credit_v1';

// Passport info displayed in the info panel
const CA_PASSPORT_INFO = {
  credit: {
    label:    'Credit Passport',
    duration: '14 days · per account',
    limit:    '100 credits/day',
    cost:     '100M zeny',
    items: [
      { id: 40056, amount: 1,  name: 'Intergalatic Coin' },
      { id: 40055, amount: 100,  name: 'Poring Jewel' },
    ],
  },
  rare: {
    label:    'Rare Credit Passport',
    duration: '7 days · per account',
    limit:    '100 rare credits/day',
    cost:     '300M zeny',
    items: [
      { id: 40001, amount: 20, name: 'Credit' },
      { id: 40009, amount: 20, name: 'Gacha Coin' },
      { id: 40078, amount: 20, name: 'Guild Contribution' },
    ],
  },
};

// ===== STORAGE =====

function caLoad() {
  try { return JSON.parse(localStorage.getItem(CA_STORAGE_KEY)) || { timers: [] }; }
  catch { return { timers: [] }; }
}

function caSave(data) {
  localStorage.setItem(CA_STORAGE_KEY, JSON.stringify(data));
}

// Active tick intervals keyed by timer id
const caIntervals = {};

// ===== MAIN RENDER =====

function caRenderMain() {
  const container = document.getElementById('mainContent');
  if (!container) return;

  const data = caLoad();

  container.innerHTML = `
    <div class="ca-main ca-main--wide">

      <div class="ca-header">
        <div class="ca-title">
          ${window.SVG_ICONS?.clock18 || ''}
          Credit Agent
        </div>
        <div class="ca-header-actions">
          <button class="btn btn-sm" onclick="caStopAll()" title="Stop all timers">Stop All</button>
          <button class="btn btn-primary btn-sm" onclick="caAddTimer('credit')">+ Credit</button>
          <button class="btn btn-primary btn-sm ca-rare-btn" onclick="caAddTimer('rare')">+ Rare</button>
        </div>
      </div>

      <div class="ca-timers" id="caTimers">
        ${data.timers.length === 0 ? caEmptyState() : data.timers.map(caTimerCard).join('')}
      </div>

      <div class="ca-info-section ca-info-section--contained">
        ${caPassportInfo('credit')}
        ${caPassportInfo('rare')}
      </div>

    </div>`;

  // Start tickers for running timers
  Object.keys(caIntervals).forEach(id => { clearInterval(caIntervals[id]); delete caIntervals[id]; });
  data.timers.forEach(t => { if (t.startedAt) caStartTick(t.id); });
}

function caEmptyState() {
  return `
    <div class="ca-empty">
      ${window.SVG_ICONS?.clock32Muted || ''}
      <div class="ca-empty-text">No timers yet</div>
      <div class="ca-empty-sub">Add a Credit or Rare Credit timer above</div>
    </div>`;
}

function caIdleDisplay(id) {
  return `<input class="ca-time-input" id="ca-h-${id}" type="number" min="0" max="99" value="24"><span class="ca-timer-sep">h</span>`
       + `<input class="ca-time-input" id="ca-m-${id}" type="number" min="0" max="59" value="00"><span class="ca-timer-sep">m</span>`
       + `<input class="ca-time-input" id="ca-s-${id}" type="number" min="0" max="59" value="00"><span class="ca-timer-sep">s</span>`;
}

function caTimerCard(t) {
  const isRare    = t.type === 'rare';
  const typeClass = isRare ? 'ca-timer--rare' : 'ca-timer--credit';
  const typeLabel = isRare ? 'Rare Credit' : 'Credit';
  const running   = !!t.startedAt;
  const done      = !!t.finishedAt && !running;
  const doneClass = done ? ' ca-timer--done' : '';
  const notifyOnDone = !!t.notifyOnDone;
  return `
    <div class="ca-timer ${typeClass}${doneClass}" data-id="${t.id}">
      <div class="ca-timer-top">
        <div class="ca-timer-left">
          <input class="ca-name-input" value="${escapeHtml(t.name)}"
                 placeholder="Account name…"
                 onchange="caRenameTimer('${t.id}', this.value)"
                 onclick="this.select()"/>
          <span class="ca-type-badge ca-type-badge--${t.type}">${typeLabel}</span>
          <label class="ca-notify-toggle" title="Notify when ready">
            <input type="checkbox" ${notifyOnDone ? 'checked' : ''} onchange="caSetNotifyOnDone('${t.id}', this.checked, this)">
            Notify
          </label>
        </div>
        <button class="ca-delete-btn" onclick="caDeleteTimer('${t.id}')" title="Delete timer">
          ${window.SVG_ICONS?.trashNoX14 || ''}
        </button>
      </div>

      <div class="ca-timer-display" id="ca-display-${t.id}">
        ${running ? caFormatRemaining(t.startedAt) : done ? caFormatFinished(t.finishedAt) : caIdleDisplay(t.id)}
      </div>

      <input type="range" class="ca-slider" min="0" max="${CA_TIMER_MS}" step="60000"
             value="${running ? Math.max(0, CA_TIMER_MS - (Date.now() - t.startedAt)) : done ? 0 : CA_TIMER_MS}"
             oninput="caSliderInput('${t.id}', this.value)"
             onchange="caSliderCommit('${t.id}', this.value)"
             title="Adjust remaining time"/>

      <div class="ca-timer-actions">
        ${running
          ? `<button class="btn btn-sm" onclick="caStopTimer('${t.id}')">Stop</button>`
          : done
            ? `<button class="btn btn-primary btn-sm" onclick="caStartTimer('${t.id}')">Start</button>
               <button class="btn btn-sm" onclick="caResetTimer('${t.id}')">Reset</button>`
            : `<button class="btn btn-primary btn-sm" onclick="caStartTimerFromDisplay('${t.id}')">Start</button>`}
      </div>
    </div>`;
}

function caPassportInfo(type) {
  const p = CA_PASSPORT_INFO[type];
  const isRare = type === 'rare';
  const itemsHtml = p.items.map(item => `
    <div class="ca-passport-req">
      ${renderItemIcon(item.id, 24)}
      <span class="ca-passport-req-amt">×${item.amount}</span>
      <span class="ca-passport-req-name">${item.name}</span>
    </div>`).join('');
  return `
    <div class="ca-passport ca-passport--${type}">
      <div class="ca-passport-title">${p.label}</div>
      <div class="ca-passport-meta">${p.duration} · ${p.limit}</div>
      <div class="ca-passport-reqs">
        ${itemsHtml}
        <div class="ca-passport-req ca-passport-req--zeny">
          ${renderItemIcon(1, 24)}
          <span class="ca-passport-req-amt">${p.cost}</span>
        </div>
      </div>
    </div>`;
}

// ===== TIMER LOGIC =====

function caAddTimer(type) {
  const data = caLoad();
  const id = 'ca_' + Date.now();
  const count = data.timers.filter(t => t.type === type).length + 1;
  data.timers.push({
    id,
    type,
    name: `Account ${count}`,
    startedAt: null,
    finishedAt: null,
    notifyOnDone: false,
    notifiedForFinishedAt: null,
  });
  caSave(data);
  caRenderMain();
}

function caDeleteTimer(id) {
  clearInterval(caIntervals[id]);
  delete caIntervals[id];
  const data = caLoad();
  data.timers = data.timers.filter(t => t.id !== id);
  caSave(data);
  // Remove card from DOM without full re-render so other timers keep ticking
  const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
  if (card) card.remove();
  const timersEl = document.getElementById('caTimers');
  if (timersEl && !timersEl.querySelector('.ca-timer')) {
    timersEl.innerHTML = caEmptyState();
  }
}

async function caStartTimer(id) {
  const data = caLoad();
  const t = data.timers.find(t => t.id === id);
  if (!t) return;

  // 1. CLEANUP: If there's an old cloud message pending, kill it first
  if (t.cloudMessageId) {
      osroCancelCloudPush(t.cloudMessageId);
      t.cloudMessageId = null;
  }

  t.startedAt = Date.now();
  t.finishedAt = null;
  t.notifiedForFinishedAt = null;
  
  // 2. Update UI
  const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
  if (card) {
    card.classList.remove('ca-timer--done');
    const actionsEl = card.querySelector('.ca-timer-actions');
    if (actionsEl) actionsEl.innerHTML = `<button class="btn btn-sm" onclick="caStopTimer('${id}')">Stop</button>`;
    const slider = card.querySelector('.ca-slider');
    if (slider) slider.value = CA_TIMER_MS;
  }

  // 3. Schedule new notification
  if (t.notifyOnDone) {
      const canNotify = await osroEnsureNotifyPermission();
      
      if (canNotify) {
          const delayInSeconds = CA_TIMER_MS / 1000;
          const msgId = await osroScheduleCloudPush(id, delayInSeconds, {
              title: osroNotifyTitle('Credit Agent'),
              body: "Your 24-hour credit timer is done!",
              url: 'https://torrq.github.io/osro-quests-hr/?tab=lab-credit',
          });
          
          if (msgId) t.cloudMessageId = msgId;
      }
  }
  
  caSave(data);
  caStartTick(id);
}

function caStopTimer(id) {
  clearInterval(caIntervals[id]);
  delete caIntervals[id];
  const data = caLoad();
  const t = data.timers.find(t => t.id === id);
  if (!t) return;

  // Cancel any pending cloud push so it doesn't fire after stopping
  if (t.cloudMessageId) {
    osroCancelCloudPush(t.cloudMessageId);
    t.cloudMessageId = null;
  }

  t.startedAt = null;
  t.finishedAt = null;
  caSave(data);
  const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
  if (card) {
    card.classList.remove('ca-timer--done');
    const disp = card.querySelector(`#ca-display-${id}`);
    if (disp) disp.innerHTML = caIdleDisplay(id);
    const actionsEl = card.querySelector('.ca-timer-actions');
    if (actionsEl) actionsEl.innerHTML = `<button class="btn btn-primary btn-sm" onclick="caStartTimerFromDisplay('${id}')">Start</button>`;
    const slider = card.querySelector('.ca-slider');
    if (slider) slider.value = CA_TIMER_MS;
  }
}

function caStopAll() {
  const data = caLoad();
  data.timers.forEach(t => { t.startedAt = null; t.finishedAt = null; });
  caSave(data);
  Object.keys(caIntervals).forEach(id => { clearInterval(caIntervals[id]); delete caIntervals[id]; });
  caRenderMain();
}

function caRenameTimer(id, name) {
  const data = caLoad();
  const t = data.timers.find(t => t.id === id);
  if (t) { t.name = name; caSave(data); }
}

function caStartTick(id) {
  clearInterval(caIntervals[id]);
  caIntervals[id] = setInterval(() => {
    const data = caLoad();
    const t = data.timers.find(t => t.id === id);
    if (!t?.startedAt) { clearInterval(caIntervals[id]); return; }

    const disp = document.getElementById(`ca-display-${id}`);
    const slider = document.querySelector(`.ca-timer[data-id="${id}"] .ca-slider`);
    const remaining = CA_TIMER_MS - (Date.now() - t.startedAt);

    if (remaining <= 0) {
      const finishedAt = t.startedAt + CA_TIMER_MS;
      t.startedAt = null;
      t.finishedAt = finishedAt;
      caMaybeNotifyDone(t, finishedAt);
      caSave(data);

      const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
      if (card) card.classList.add('ca-timer--done');
      if (disp) disp.innerHTML = caFormatFinished(finishedAt);
      if (slider) slider.value = 0;
      clearInterval(caIntervals[id]);
      delete caIntervals[id];
      const actionsEl = document.querySelector(`.ca-timer[data-id="${id}"] .ca-timer-actions`);
      if (actionsEl) actionsEl.innerHTML = `<button class="btn btn-primary btn-sm" onclick="caStartTimer('${id}')">Start</button><button class="btn btn-sm" onclick="caResetTimer('${id}')">Reset</button>`;
    } else {
      if (disp) disp.innerHTML = caFormatRemaining(t.startedAt);
      if (slider) slider.value = Math.max(0, remaining);
    }
  }, 1000);
}

// ===== SLIDER =====

function caSliderInput(id, val) {
  // Live preview while dragging — just update display
  const remaining = parseInt(val);
  const disp = document.getElementById(`ca-display-${id}`);
  if (disp && remaining > 0) {
    disp.innerHTML = caFormatMs(remaining);
  }
}

function caSliderCommit(id, val) {
  const remaining = parseInt(val);
  const data = caLoad();
  const t = data.timers.find(t => t.id === id);
  if (!t) return;

  clearInterval(caIntervals[id]);
  delete caIntervals[id];

  // Always cancel any existing cloud push — we'll reschedule if needed
  if (t.cloudMessageId) {
    osroCancelCloudPush(t.cloudMessageId);
    t.cloudMessageId = null;
  }

  if (remaining <= 0) {
    if (t.startedAt) t.finishedAt = t.startedAt + CA_TIMER_MS;
    t.startedAt = null;
    if (t.finishedAt) caMaybeNotifyDone(t, t.finishedAt);
    const actionsEl = document.querySelector(`.ca-timer[data-id="${id}"] .ca-timer-actions`);
    if (actionsEl) actionsEl.innerHTML = `<button class="btn btn-primary btn-sm" onclick="caStartTimer('${id}')">Start</button>${t.finishedAt ? `<button class="btn btn-sm" onclick="caResetTimer('${id}')">Reset</button>` : ''}`;
    const disp = document.getElementById(`ca-display-${id}`);
    if (disp) disp.innerHTML = t.finishedAt ? caFormatFinished(t.finishedAt) : '<span class="ca-timer-idle">—</span>';
    const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
    if (card) {
      if (t.finishedAt) card.classList.add('ca-timer--done');
      else card.classList.remove('ca-timer--done');
    }
  } else {
    // Back-calculate startedAt so remaining matches
    t.startedAt = Date.now() - (CA_TIMER_MS - remaining);
    t.finishedAt = null;

    // Reschedule cloud push with the new remaining time
    if (t.notifyOnDone) {
      osroEnsureNotifyPermission().then(canNotify => {
        if (canNotify) {
          osroScheduleCloudPush(id, Math.ceil(remaining / 1000), {
            title: osroNotifyTitle('Credit Agent'),
            body: `${t.name || 'Account'} is ready.`,
            url: 'https://torrq.github.io/osro-quests-hr/?tab=lab-credit',
          }).then(msgId => {
            if (msgId) {
              const d = caLoad();
              const timer = d.timers.find(x => x.id === id);
              if (timer) { timer.cloudMessageId = msgId; caSave(d); }
            }
          });
        }
      });
    }

    caStartTick(id);
    const actionsEl = document.querySelector(`.ca-timer[data-id="${id}"] .ca-timer-actions`);
    if (actionsEl) actionsEl.innerHTML = `<button class="btn btn-sm" onclick="caStopTimer('${id}')">Stop</button>`;
    const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
    if (card) card.classList.remove('ca-timer--done');
  }
  caSave(data);
}

async function caStartTimerFromDisplay(id) {
  const h = Math.max(0, parseInt(document.getElementById(`ca-h-${id}`)?.value) || 0);
  const m = Math.max(0, parseInt(document.getElementById(`ca-m-${id}`)?.value) || 0);
  const s = Math.max(0, parseInt(document.getElementById(`ca-s-${id}`)?.value) || 0);
  const remaining = Math.min((h * 3600 + m * 60 + s) * 1000, CA_TIMER_MS);
  const data = caLoad();
  const t = data.timers.find(t => t.id === id);
  if (!t) return;

  // Cancel any existing cloud push before starting fresh
  if (t.cloudMessageId) {
    osroCancelCloudPush(t.cloudMessageId);
    t.cloudMessageId = null;
  }

  t.startedAt = Date.now() - (CA_TIMER_MS - remaining);
  t.finishedAt = null;
  t.notifiedForFinishedAt = null;

  // Schedule cloud push if notify is enabled
  if (t.notifyOnDone) {
    const canNotify = await osroEnsureNotifyPermission();
    if (canNotify) {
      const delayInSeconds = Math.ceil(remaining / 1000);
      const msgId = await osroScheduleCloudPush(id, delayInSeconds, {
        title: osroNotifyTitle('Credit Agent'),
        body: `${t.name || 'Account'} is ready.`,
        url: 'https://torrq.github.io/osro-quests-hr/?tab=lab-credit',
      });
      if (msgId) t.cloudMessageId = msgId;
    }
  }

  caSave(data);
  const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
  if (card) {
    card.classList.remove('ca-timer--done');
    const actionsEl = card.querySelector('.ca-timer-actions');
    if (actionsEl) actionsEl.innerHTML = `<button class="btn btn-sm" onclick="caStopTimer('${id}')">Stop</button>`;
    const slider = card.querySelector('.ca-slider');
    if (slider) slider.value = remaining;
  }
  caStartTick(id);
}

function caMaybeNotifyDone(t, finishedAt) {
  if (!t?.notifyOnDone) return;
  if (!finishedAt) return;
  if (t.notifiedForFinishedAt === finishedAt) return;
  t.notifiedForFinishedAt = finishedAt;

  if (typeof window.osroNotifyReady === 'function') {
    window.osroNotifyReady({
      section: 'Credit Agent',
      body:    `${t.name || 'Account'} is ready.`,
      tag:     `osrohr_credit_${t.type || 'credit'}_${t.id}`,
      url:     '?tab=lab-credit',
    });
  }
}

async function caSetNotifyOnDone(id, enabled, el) {
  const data = caLoad();
  const t = data.timers.find(t => t.id === id);
  if (!t) return;

  const next = !!enabled;
  if (next && typeof window.osroEnsureNotifyPermission === 'function') {
    const ok = await window.osroEnsureNotifyPermission();
    if (!ok) {
      t.notifyOnDone = false;
      caSave(data);
      if (el) el.checked = false;
      if (typeof showToast === 'function') showToast('Browser notifications are blocked for this site.', 'error', 3000);
      return;
    }
  }

  t.notifyOnDone = next;
  caSave(data);
}

// ===== FORMAT HELPERS =====

function caFormatRemaining(startedAt) {
  const remaining = CA_TIMER_MS - (Date.now() - startedAt);
  if (remaining <= 0) return '<span class="ca-timer-ready">Ready!</span>';
  return caFormatMs(remaining);
}

function caFormatFinished(finishedAt) {
  const when = new Date(finishedAt).toLocaleString();
  return `<span class="ca-timer-ready">Ready!</span><div class="ca-timer-finished-at">Finished ${escapeHtml(when)}</div>`;
}

function caFormatMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `<span class="ca-timer-h">${h}</span><span class="ca-timer-sep">h</span>`
       + `<span class="ca-timer-m">${String(m).padStart(2,'0')}</span><span class="ca-timer-sep">m</span>`
       + `<span class="ca-timer-s">${String(s).padStart(2,'0')}</span><span class="ca-timer-sep">s</span>`;
}

function caResetTimer(id) {
  clearInterval(caIntervals[id]);
  delete caIntervals[id];
  const data = caLoad();
  const t = data.timers.find(t => t.id === id);
  if (!t) return;
  
  if (t.cloudMessageId) {
      osroCancelCloudPush(t.cloudMessageId);
      t.cloudMessageId = null;
  }
  
  t.startedAt = null;
  t.finishedAt = null;
  caSave(data);

  const card = document.querySelector(`.ca-timer[data-id="${id}"]`);
  if (card) {
    card.classList.remove('ca-timer--done');
    const disp = document.getElementById(`ca-display-${id}`);
    if (disp) disp.innerHTML = caIdleDisplay(id);
    const actionsEl = card.querySelector('.ca-timer-actions');
    if (actionsEl) actionsEl.innerHTML = `<button class="btn btn-primary btn-sm" onclick="caStartTimerFromDisplay('${id}')">Start</button>`;
    const slider = card.querySelector('.ca-slider');
    if (slider) slider.value = CA_TIMER_MS;
  }
}

// ===== REGISTRATION =====

window.registerLabExperiment?.('lab-credit', {
  tabId:        'lab-credit',
  title:        'Credit Agent',
  sidebarLabel: 'Credit Agent',
  sidebarIcon: window.SVG_ICONS?.clock14 || '',
  renderMain: caRenderMain,
});

window.caAddTimer    = caAddTimer;
window.caDeleteTimer = caDeleteTimer;
window.caStartTimer  = caStartTimer;
window.caStartTimerFromDisplay = caStartTimerFromDisplay;
window.caStopTimer   = caStopTimer;
window.caStopAll     = caStopAll;
window.caRenameTimer = caRenameTimer;
window.caSliderInput = caSliderInput;
window.caSliderCommit = caSliderCommit;
window.caResetTimer  = caResetTimer;
window.caSetNotifyOnDone = caSetNotifyOnDone;
