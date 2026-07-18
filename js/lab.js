// lab.js — lightweight launcher/registry for lab experiments

window.LAB_EXPERIMENTS = window.LAB_EXPERIMENTS || {};

window.registerLabExperiment = function registerLabExperiment(id, experiment) {
  if (!id || !experiment) return;
  window.LAB_EXPERIMENTS[id] = experiment;
};

const LAB_DEFAULT_EXPERIMENT = 'lab-gc';

function getActiveLabExperiment() {
  const tabId = window.state?.currentTab;
  if (!tabId) return window.LAB_EXPERIMENTS[LAB_DEFAULT_EXPERIMENT] || null;
  
  if (window.LAB_EXPERIMENTS[tabId]) {
    return window.LAB_EXPERIMENTS[tabId];
  }
  
  for (const exp of Object.values(window.LAB_EXPERIMENTS)) {
    if (exp.children && Array.isArray(exp.children)) {
      const child = exp.children.find(c => c.tabId === tabId);
      if (child) {
        return child;
      }
    }
  }
  
  return window.LAB_EXPERIMENTS[LAB_DEFAULT_EXPERIMENT] || null;
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
  const entries = Object.values(window.LAB_EXPERIMENTS);
  const rows = [];

  entries.forEach(exp => {
    const isChildActive = exp.children && exp.children.some(c => c.tabId === currentTab);
    const isParentActive = currentTab === exp.tabId || isChildActive;

    rows.push(`
      <div class="lab-sidebar-section ${isParentActive ? 'active' : ''}" onclick="switchTab('${exp.tabId}')">
        <span class="lab-sidebar-icon">${exp.sidebarIcon || ''}</span>
        ${exp.sidebarLabel || exp.title || exp.tabId}
      </div>`);

    if (exp.children && Array.isArray(exp.children)) {
      exp.children.forEach(child => {
        const isThisChildActive = currentTab === child.tabId;
        const iconHtml = child.sidebarIcon ? `<span class="lab-sidebar-icon">${child.sidebarIcon}</span>` : '';
        rows.push(`
          <div class="lab-sidebar-child ${isThisChildActive ? 'active' : ''}" onclick="switchTab('${child.tabId}')">
            ${iconHtml}${child.sidebarLabel || child.title || child.tabId}
          </div>`);
      });
    }
  });

  el.innerHTML = `<div class="lab-sidebar-content">${rows.join('')}</div>`;
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
