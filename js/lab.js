// lab.js — lightweight launcher/registry for lab experiments

window.LAB_EXPERIMENTS = window.LAB_EXPERIMENTS || {};

window.registerLabExperiment = function registerLabExperiment(id, experiment) {
  if (!id || !experiment) return;
  window.LAB_EXPERIMENTS[id] = experiment;
};

const LAB_DEFAULT_EXPERIMENT = 'lab-gc';

function getActiveLabExperiment() {
  const tabId = window.state?.currentTab;
  return window.LAB_EXPERIMENTS[tabId] || window.LAB_EXPERIMENTS[LAB_DEFAULT_EXPERIMENT] || null;
}

function loadLabData() {
  try { return JSON.parse(localStorage.getItem(LOCAL_STORAGE.lab_data)) || {}; }
  catch { return {}; }
}

function saveLabData(patch) {
  const cur = loadLabData();
  localStorage.setItem(LOCAL_STORAGE.lab_data, JSON.stringify({ ...cur, ...patch }));
}

function renderLabSidebar() {
  const el = document.getElementById('labList');
  if (!el) return;

  const experiment = getActiveLabExperiment();
  if (!experiment) {
    el.innerHTML = '';
    return;
  }

  const currentTab = window.state?.currentTab || LAB_DEFAULT_EXPERIMENT;
  // Render all registered experiments in registration order
  const entries = Object.values(window.LAB_EXPERIMENTS);
  const rows = entries.map(exp => {
    const isActive = currentTab === exp.tabId;
    return `
      <div class="lab-sidebar-section ${isActive ? 'active' : ''}" onclick="switchTab('${exp.tabId}')">
        <span class="lab-sidebar-icon">${exp.sidebarIcon || ''}</span>
        ${exp.sidebarLabel || exp.title || exp.tabId}
      </div>`;
  }).join('');

  el.innerHTML = `<div class="lab-sidebar-content">${rows}</div>`;
}

function renderLabMain() {
  const experiment = getActiveLabExperiment();
  if (!experiment?.renderMain) return;
  experiment.renderMain();
}

window.loadLabData = loadLabData;
window.saveLabData = saveLabData;
window.renderLabSidebar = renderLabSidebar;
window.renderLabMain = renderLabMain;
