// js/sync.js — Cloud synchronization & multi-device linking engine
(function() {
  const SESSION_KEY   = 'osromr_sync_session';
  const DEVICE_ID_KEY = 'osromr_device_id';
  const LAST_SYNC_KEY = 'osromr_sync_last_time';

  let syncTimeout = null;
  let syncState = {
    status: 'idle', // 'idle' | 'syncing' | 'synced' | 'pending' | 'offline' | 'error'
    error: null,
  };

  // --------------------------------------------------------------------------
  // Device & Session Management
  // --------------------------------------------------------------------------

  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }

  function getSession() {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }

  function setSession(session) {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);
      if (window.osroStore) {
        osroStore.clearDirty();
      }
    }
    updateStatusUI();
  }

  window.osroSyncGetSessionToken = function() {
    const s = getSession();
    return s ? s.token : null;
  };

  window.osroSyncIsLinked = function() {
    return !!getSession();
  };

  window.osroSyncGetDeviceId = function() {
    return getDeviceId();
  };

  // --------------------------------------------------------------------------
  // Specialized Data Merge Algorithms
  // --------------------------------------------------------------------------

  function mergeTimerArrays(localData, remoteData) {
    const local = localData || { timers: [], deletedTimers: {} };
    const remote = remoteData || { timers: [], deletedTimers: {} };

    // Merge deletedTimers tracking map and prune tombstones older than 30 days
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const rawDeleted = {
      ...(local.deletedTimers || {}),
      ...(remote.deletedTimers || {}),
    };
    const deletedTimers = {};
    for (const [id, delTime] of Object.entries(rawDeleted)) {
      if (now - delTime < THIRTY_DAYS_MS) {
        deletedTimers[id] = delTime;
      }
    }

    const timerMap = new Map();

    const processTimer = (t) => {
      if (!t || !t.id) return;
      const delTime = deletedTimers[t.id];
      const timerUpdated = t.updatedAt || 0;
      // If deleted after or at same time as last update, omit
      if (delTime && delTime >= timerUpdated) {
        return;
      }

      if (!timerMap.has(t.id)) {
        timerMap.set(t.id, t);
      } else {
        const existing = timerMap.get(t.id);
        const existingUpdated = existing.updatedAt || 0;
        if (timerUpdated >= existingUpdated) {
          timerMap.set(t.id, t);
        }
      }
    };

    (local.timers || []).forEach(processTimer);
    (remote.timers || []).forEach(processTimer);

    return {
      timers: Array.from(timerMap.values()),
      deletedTimers,
      updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0, Date.now()),
    };
  }

  function mergeTrackerData(localData, remoteData) {
    const local = localData || { deposits: {}, unlocks: {} };
    const remote = remoteData || { deposits: {}, unlocks: {} };

    const mergeSubState = (localSub = {}, remoteSub = {}) => {
      const merged = {};
      const allIds = new Set([...Object.keys(localSub), ...Object.keys(remoteSub)]);

      allIds.forEach(id => {
        const l = localSub[id];
        const r = remoteSub[id];
        if (l && r) {
          const lUp = l.updatedAt || 0;
          const rUp = r.updatedAt || 0;
          merged[id] = rUp > lUp ? { ...r } : { ...l };
        } else if (l) {
          merged[id] = { ...l };
        } else if (r) {
          merged[id] = { ...r };
        }
      });
      return merged;
    };

    return {
      deposits: mergeSubState(local.deposits, remote.deposits),
      unlocks:  mergeSubState(local.unlocks, remote.unlocks),
      updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0, Date.now()),
    };
  }

  // --------------------------------------------------------------------------
  // Core Sync Engine (Pull & Push)
  // --------------------------------------------------------------------------

  async function pullRemoteState(options = {}) {
    const session = getSession();
    if (!session || !session.token) return;

    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');

    try {
      const workerUrl = window.CLOUDFLARE_WORKER_URL || 'https://osro-push-worker.osro-push-worker.workers.dev';
      const res = await fetch(`${workerUrl}/sync?app=mr`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
        },
      });

      if (res.status === 401) {
        console.warn('[Sync] Session invalid or expired. Unlinking.');
        setSession(null);
        setSyncStatus('error', 'Session expired. Please sign in or re-enter your code.');
        return;
      }

      if (!res.ok) {
        throw new Error(`Sync pull failed with status ${res.status}`);
      }

      const { keys = {} } = await res.json();
      const meta = window.osroStore ? osroStore.getMeta() : { updatedAt: {} };
      const changedKeys = [];

      for (const [key, remoteEntry] of Object.entries(keys)) {
        if (!remoteEntry) continue;
        const remoteVal = remoteEntry.value;
        const remoteUpdated = Number(remoteEntry.updatedAt) || 0;
        const localUpdated = Number(meta.updatedAt[key]) || 0;
        const isRemoteDeleted = !!remoteEntry.deleted;

        if (isRemoteDeleted) {
          if (remoteUpdated >= localUpdated) {
            const hadLocal = (window.osroStore ? osroStore.getItem(key) : localStorage.getItem(key)) !== null;
            if (window.osroStore) {
              osroStore.applyRemoteUpdate(key, null, remoteUpdated);
            }
            if (hadLocal) {
              changedKeys.push(key);
            }
          } else {
            // Local is newer than the remote deletion tombstone; re-upload
            if (window.osroStore) {
              osroStore.markDirty(key, localUpdated);
            }
          }
          continue;
        }

        let finalValue = remoteVal;
        let finalUpdated = remoteUpdated;

        if (key === LOCAL_STORAGE.lab_gem || key === LOCAL_STORAGE.lab_credit) {
          const localVal = window.osroStore ? osroStore.getJson(key, { timers: [] }) : null;
          finalValue = mergeTimerArrays(localVal, remoteVal);
          finalUpdated = Math.max(localUpdated, remoteUpdated);
          if (window.osroStore) {
            const hasLocalChanged = JSON.stringify(finalValue) !== JSON.stringify(localVal);
            osroStore.applyRemoteUpdate(key, finalValue, finalUpdated);
            if (hasLocalChanged) {
              changedKeys.push(key);
            }
            // If merged result differs from remote, local had additions or updates to push back
            if (JSON.stringify(finalValue) !== JSON.stringify(remoteVal)) {
              osroStore.markDirty(key, finalUpdated);
            }
          }
        } else if (key === LOCAL_STORAGE.lab_tracker) {
          const localVal = window.osroStore ? osroStore.getJson(key, { deposits: {}, unlocks: {} }) : null;
          finalValue = mergeTrackerData(localVal, remoteVal);
          finalUpdated = Math.max(localUpdated, remoteUpdated);
          if (window.osroStore) {
            const hasLocalChanged = JSON.stringify(finalValue) !== JSON.stringify(localVal);
            osroStore.applyRemoteUpdate(key, finalValue, finalUpdated);
            if (hasLocalChanged) {
              changedKeys.push(key);
            }
            // If merged result differs from remote, local had additions or updates to push back
            if (JSON.stringify(finalValue) !== JSON.stringify(remoteVal)) {
              osroStore.markDirty(key, finalUpdated);
            }
          }
        } else {
          // General LWW merge
          if (remoteUpdated >= localUpdated) {
            const localVal = window.osroStore ? osroStore.getItem(key) : null;
            const remoteStr = typeof remoteVal === 'string' ? remoteVal : JSON.stringify(remoteVal);
            if (window.osroStore) {
              osroStore.applyRemoteUpdate(key, remoteVal, remoteUpdated);
              if (localVal !== remoteStr) {
                changedKeys.push(key);
              }
            }
          } else {
            // Local is newer than remote; flag dirty to push to cloud
            if (window.osroStore) {
              osroStore.markDirty(key, localUpdated);
            }
          }
        }
      }

      // If local has keys that remote does not have yet, flag them dirty so they upload
      const syncList = (typeof SYNC_KEYS !== 'undefined' && Array.isArray(SYNC_KEYS)) ? SYNC_KEYS : [];
      for (const key of syncList) {
        if (!(key in keys)) {
          const localVal = window.osroStore ? osroStore.getItem(key) : null;
          if (localVal !== null && !meta.deleted?.[key]) {
            osroStore.markDirty(key);
          }
        }
      }

      localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
      setSyncStatus('synced');

      const dirtyAfter = Object.keys(window.osroStore ? osroStore.getMeta().dirty || {} : {});
      if (dirtyAfter.length > 0) {
        window.osroSyncNotifyChange();
      }

      if (changedKeys.length > 0) {
        if (typeof window.osroOnSyncedDataChanged === 'function') {
          try {
            window.osroOnSyncedDataChanged(changedKeys);
          } catch (e) {
            console.error('[Sync] osroOnSyncedDataChanged error:', e);
          }
        }
        if (window.osroStore) {
          osroStore.notifyRemoteChange(changedKeys);
        }
      }
    } catch (err) {
      console.error('[Sync Pull Error]', err);
      setSyncStatus('error', err.message);
    }
  }

  async function pushLocalChanges(forceAll = false) {
    const session = getSession();
    if (!session || !session.token) return;

    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    const meta = window.osroStore ? osroStore.getMeta() : { dirty: {}, updatedAt: {} };
    const dirtyKeys = Object.keys(meta.dirty || {});

    if (!forceAll && dirtyKeys.length === 0) {
      setSyncStatus('synced');
      return;
    }

    const keysToPush = forceAll ? (window.SYNC_KEYS || []) : dirtyKeys;
    const changes = {};
    const pushTimestamps = {};

    keysToPush.forEach(key => {
      pushTimestamps[key] = meta.dirty[key] || Date.now();
      const val = window.osroStore ? osroStore.getJson(key) : null;
      if (val === null && !meta.deleted?.[key]) {
        return;
      }
      changes[key] = {
        value: val,
        updatedAt: meta.updatedAt[key] || Date.now(),
        deleted: !!meta.deleted?.[key],
      };
    });

    if (Object.keys(changes).length === 0) {
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');

    try {
      const workerUrl = window.CLOUDFLARE_WORKER_URL || 'https://osro-push-worker.osro-push-worker.workers.dev';
      const res = await fetch(`${workerUrl}/sync?app=mr`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          app: 'mr',
          changes,
        }),
      });

      if (res.status === 401) {
        setSession(null);
        setSyncStatus('error', 'Session expired. Please sign in or re-enter your code.');
        return;
      }

      if (!res.ok) {
        throw new Error(`Sync push failed with status ${res.status}`);
      }

      if (window.osroStore) {
        osroStore.clearDirty(keysToPush, pushTimestamps);
      }

      localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
      setSyncStatus('synced');
    } catch (err) {
      console.error('[Sync Push Error]', err);
      setSyncStatus('error', err.message);
    }
  }

  function flushPushKeepAlive() {
    const session = getSession();
    if (!session || !session.token) return;

    const meta = window.osroStore ? osroStore.getMeta() : { dirty: {}, updatedAt: {} };
    const dirtyKeys = Object.keys(meta.dirty || {});
    if (dirtyKeys.length === 0) return;

    const changes = {};
    dirtyKeys.forEach(key => {
      const val = window.osroStore ? osroStore.getJson(key) : null;
      if (val === null && !meta.deleted?.[key]) return;
      changes[key] = {
        value: val,
        updatedAt: meta.updatedAt[key] || Date.now(),
        deleted: !!meta.deleted?.[key],
      };
    });

    if (Object.keys(changes).length === 0) return;

    const workerUrl = window.CLOUDFLARE_WORKER_URL || 'https://osro-push-worker.osro-push-worker.workers.dev';
    try {
      const bodyStr = JSON.stringify({ app: 'mr', changes });
      const useKeepalive = bodyStr.length < 60000;
      fetch(`${workerUrl}/sync?app=mr`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: bodyStr,
        keepalive: useKeepalive,
      });
    } catch (e) {
      // keepalive best effort
    }
  }

  // --------------------------------------------------------------------------
  // Device Registration
  // --------------------------------------------------------------------------

  async function registerDevicePush() {
    const session = getSession();
    if (!session || !session.token) return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;

      const deviceId = getDeviceId();
      const workerUrl = window.CLOUDFLARE_WORKER_URL || 'https://osro-push-worker.osro-push-worker.workers.dev';

      await fetch(`${workerUrl}/devices`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          deviceId,
          subscription: sub.toJSON(),
          label: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
        }),
      });
    } catch (e) {
      console.warn('[Sync] Device registration failed:', e);
    }
  }

  // --------------------------------------------------------------------------
  // Authentication Actions
  // --------------------------------------------------------------------------

  window.osroSyncLoginWithCode = async function(rawCode) {
    const code = (rawCode || '').trim();
    if (!code) throw new Error('Please enter a sync code');

    const workerUrl = window.CLOUDFLARE_WORKER_URL || 'https://osro-push-worker.osro-push-worker.workers.dev';
    const res = await fetch(`${workerUrl}/auth/code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to authenticate with sync code');
    }

    setSession({
      token: data.token,
      accountId: data.accountId,
      email: data.email,
      method: 'code',
      code: code.toUpperCase(),
    });

    await handleFirstSyncDialog();
    await registerDevicePush();
  };

  window.osroSyncCreateCode = async function() {
    const workerUrl = window.CLOUDFLARE_WORKER_URL || 'https://osro-push-worker.osro-push-worker.workers.dev';
    const res = await fetch(`${workerUrl}/auth/code/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to generate sync code');
    }

    setSession({
      token: data.token,
      accountId: data.accountId,
      email: null,
      method: 'code',
      code: data.code,
    });

    // Mark all existing local data dirty so it uploads to initialize the new cloud profile
    const syncList = (typeof SYNC_KEYS !== 'undefined' && Array.isArray(SYNC_KEYS)) ? SYNC_KEYS : [];
    syncList.forEach(k => {
      const v = window.osroStore ? osroStore.getItem(k) : localStorage.getItem(k);
      if (v !== null) {
        osroStore.markDirty(k);
      }
    });

    // Upload local data immediately to initialize the new cloud profile
    await pushLocalChanges();
    await registerDevicePush();
    return data.code;
  };

  window.osroSyncLoginWithGoogle = async function(idToken) {
    if (!idToken) throw new Error('Missing Google credentials');

    const workerUrl = window.CLOUDFLARE_WORKER_URL || 'https://osro-push-worker.osro-push-worker.workers.dev';
    const res = await fetch(`${workerUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google sign-in failed');
    }

    setSession({
      token: data.token,
      accountId: data.accountId,
      email: data.email,
      method: 'google',
    });

    await handleFirstSyncDialog();
    await registerDevicePush();
  };

  window.osroSyncLinkGoogle = async function(idToken) {
    const session = getSession();
    if (!session || !session.token) throw new Error('Not linked to any profile');

    const workerUrl = window.CLOUDFLARE_WORKER_URL || 'https://osro-push-worker.osro-push-worker.workers.dev';
    const res = await fetch(`${workerUrl}/auth/link-google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
      },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to link Google account');
    }

    session.email = data.email;
    session.method = 'google';
    setSession(session);
  };

  window.osroSyncUnlink = async function() {
    const session = getSession();
    if (session && session.token) {
      // Remove this device registration
      try {
        const workerUrl = window.CLOUDFLARE_WORKER_URL || 'https://osro-push-worker.osro-push-worker.workers.dev';
        const deviceId = getDeviceId();
        await fetch(`${workerUrl}/devices/${deviceId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${session.token}` },
        });
      } catch (e) {
        // ignore device delete error on unlink
      }
    }
    setSession(null);
    setSyncStatus('idle');
  };

  window.osroSyncDeleteCloudData = async function() {
    const session = getSession();
    if (!session || !session.token) return;

    if (!confirm('Are you sure you want to delete ALL your cloud sync data? This cannot be undone.')) {
      return;
    }

    try {
      const workerUrl = window.CLOUDFLARE_WORKER_URL || 'https://osro-push-worker.osro-push-worker.workers.dev';
      await fetch(`${workerUrl}/sync?app=mr`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.token}` },
      });
      setSession(null);
      setSyncStatus('idle');
      if (typeof showToast === 'function') showToast('Cloud data deleted successfully', 'success');
    } catch (err) {
      console.error('[Delete Cloud Data Error]', err);
      if (typeof showToast === 'function') showToast('Failed to delete cloud data', 'error');
    }
  };

  function showSyncResolutionDialog() {
    return new Promise((resolve) => {
      let modal = document.getElementById('syncConflictModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'syncConflictModal';
        modal.className = 'sync-modal-backdrop';
        modal.innerHTML = `
          <div class="sync-modal-card">
            <div class="sync-modal-title">Cloud Sync Conflict</div>
            <div class="sync-modal-desc">
              Data was found both on this device and in your cloud profile. Choose how to synchronize them:
            </div>
            <div class="sync-modal-options">
              <button class="btn btn-primary sync-modal-btn" data-action="merge">
                <span class="sync-modal-btn-title">Merge (Recommended)</span>
                <span class="sync-modal-btn-sub">Combine data from both places, keeping the newest changes</span>
              </button>
              <button class="btn sync-modal-btn" data-action="cloud">
                <span class="sync-modal-btn-title">Keep Cloud Data</span>
                <span class="sync-modal-btn-sub">Replace data on this device with your cloud profile</span>
              </button>
              <button class="btn sync-modal-btn" data-action="local">
                <span class="sync-modal-btn-title">Keep Device Data</span>
                <span class="sync-modal-btn-sub">Overwrite your cloud profile with data from this device</span>
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      modal.style.display = 'flex';

      const onClick = (e) => {
        const btn = e.target.closest('[data-action]');
        if (btn) {
          const action = btn.getAttribute('data-action');
          modal.style.display = 'none';
          modal.removeEventListener('click', onClick);
          resolve(action);
        }
      };

      modal.addEventListener('click', onClick);
    });
  }

  async function handleFirstSyncDialog() {
    const session = getSession();
    if (!session || !session.token) return;

    const workerUrl = window.CLOUDFLARE_WORKER_URL || 'https://osro-push-worker.osro-push-worker.workers.dev';
    let remoteKeys = {};
    try {
      const res = await fetch(`${workerUrl}/sync?app=mr`, {
        headers: { 'Authorization': `Bearer ${session.token}` },
      });
      if (res.ok) {
        const body = await res.json();
        remoteKeys = body.keys || {};
      }
    } catch (e) {
      console.warn('[Sync] Could not inspect remote state during first link:', e);
    }

    const syncList = (typeof SYNC_KEYS !== 'undefined' && Array.isArray(SYNC_KEYS)) ? SYNC_KEYS : [];
    const hasRemoteData = Object.values(remoteKeys).some(entry => entry && entry.value !== null && entry.value !== undefined);
    const hasLocalData = syncList.some(k => localStorage.getItem(k) !== null);

    if (hasRemoteData && hasLocalData) {
      const choice = await showSyncResolutionDialog();
      if (choice === 'cloud') {
        // Keep cloud: overwrite local storage with remote values
        const changedKeys = [];
        for (const [key, remoteEntry] of Object.entries(remoteKeys)) {
          if (!remoteEntry) continue;
          if (window.osroStore) {
            osroStore.applyRemoteUpdate(key, remoteEntry.value, Number(remoteEntry.updatedAt) || Date.now());
          }
          changedKeys.push(key);
        }
        // Remove local synced keys not present in remote
        syncList.forEach(k => {
          if (!(k in remoteKeys) && localStorage.getItem(k) !== null) {
            if (window.osroStore) {
              osroStore.applyRemoteUpdate(k, null, Date.now());
            }
            changedKeys.push(k);
          }
        });
        if (window.osroStore) {
          osroStore.clearDirty();
        }
        localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
        setSyncStatus('synced');
        if (changedKeys.length > 0) {
          if (typeof window.osroOnSyncedDataChanged === 'function') {
            window.osroOnSyncedDataChanged(changedKeys);
          }
          if (window.osroStore) osroStore.notifyRemoteChange(changedKeys);
        }
        return;
      } else if (choice === 'local') {
        // Keep local: mark all local keys dirty and push to cloud, ensuring ts beats remote
        syncList.forEach(k => {
          const remoteTs = Number(remoteKeys[k]?.updatedAt) || 0;
          const ts = Math.max(Date.now(), remoteTs + 1000);
          if (localStorage.getItem(k) !== null) {
            if (window.osroStore) osroStore.markDirty(k, ts);
          } else if (k in remoteKeys) {
            if (window.osroStore) osroStore.removeItem(k, { updatedAt: ts });
          }
        });
        await pushLocalChanges();
        return;
      }
      // 'merge' or default: fall through to standard pullRemoteState + pushLocalChanges
    } else if (!hasRemoteData && hasLocalData) {
      // Remote is empty, local has data: mark local keys dirty so they upload
      syncList.forEach(k => {
        if (localStorage.getItem(k) !== null) {
          if (window.osroStore) osroStore.markDirty(k);
        }
      });
    }

    // Default flow: pull and merge, then push any local additions
    await pullRemoteState();
    await pushLocalChanges();
  }

  // --------------------------------------------------------------------------
  // Status & Notification Change Hooks
  // --------------------------------------------------------------------------

  function setSyncStatus(status, error = null) {
    syncState.status = status;
    syncState.error = error;
    updateStatusUI();
  }

  window.osroSyncNotifyChange = function(key) {
    if (!window.osroSyncIsLinked()) return;

    setSyncStatus('pending');
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      pushLocalChanges();
    }, 3000); // 3 second debounce
  };

  // --------------------------------------------------------------------------
  // UI Rendering & Settings Panel
  // --------------------------------------------------------------------------

  function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Never';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  }

  function updateStatusUI() {
    const statusDot = document.getElementById('syncStatusIndicator');
    const statusText = document.getElementById('syncStatusText');
    const session = getSession();

    if (statusDot) {
      statusDot.className = 'sync-status-indicator ' + (session ? `status--${syncState.status}` : 'status--unlinked');
      statusDot.title = session
        ? `Cloud Sync: ${syncState.status}${syncState.error ? ` (${syncState.error})` : ''}`
        : 'Cloud Sync: Not linked';
    }

    if (statusText) {
      if (!session) {
        statusText.textContent = 'Not linked';
      } else if (syncState.status === 'syncing') {
        statusText.textContent = 'Syncing...';
      } else if (syncState.status === 'pending') {
        statusText.textContent = 'Changes pending...';
      } else if (syncState.status === 'offline') {
        statusText.textContent = 'Offline';
      } else if (syncState.status === 'error') {
        statusText.textContent = 'Sync error';
      } else {
        const lastSync = localStorage.getItem(LAST_SYNC_KEY);
        statusText.textContent = `Synced ${formatTimeAgo(Number(lastSync))}`;
      }
    }

    renderSyncSettingsPanel();
  }

  function renderSyncSettingsPanel() {
    const container = document.getElementById('cloudSyncSection');
    if (!container) return;

    const session = getSession();

    if (!session) {
      container.innerHTML = `
        <div class="settings-sync-box">
          <div class="settings-sync-header">
            <span class="settings-label">Cloud Sync</span>
            <span class="sync-badge sync-badge--gray">Not Linked</span>
          </div>
          <div class="settings-sublabel" style="margin-bottom: 8px;">
            Sync unlocks, bookmarks, and timers across devices. Push notifications will reach all your linked devices.
          </div>
          
          <div class="sync-action-buttons">
            <button class="btn btn-sm btn-primary" onclick="window.osroSyncPromptCreateCode()">Create Sync Code</button>
            <button class="btn btn-sm" onclick="window.osroSyncPromptEnterCode()">Enter Sync Code</button>
          </div>

          <div id="googleSignInContainer" style="margin-top: 8px;"></div>
        </div>
      `;

      // Render Google Sign-In if client ID is configured
      initGoogleSignIn();
    } else {
      const isGoogle = session.method === 'google';
      const accountLabel = (isGoogle && session.email) ? `<strong>${escapeHtml(session.email)}</strong>` : '';

      container.innerHTML = `
        <div class="settings-sync-box">
          <div class="settings-sync-header">
            <span class="settings-label">Cloud Sync</span>
            <span class="sync-badge sync-badge--green">Linked</span>
          </div>
          ${accountLabel ? `<div class="settings-sublabel" style="margin-bottom: 8px;">${accountLabel}</div>` : ''}
          <div id="syncStatusText" class="settings-sublabel" style="margin-bottom: 10px;"></div>

          <div class="sync-action-buttons">
            <button class="btn btn-sm btn-primary" onclick="window.osroSyncTriggerSync()">Sync Now</button>
            ${!isGoogle ? `<button class="btn btn-sm" onclick="window.osroSyncShowQrModal()">Show QR / Code</button>` : ''}
            <button class="btn btn-sm" onclick="window.osroSyncUnlink()">Unlink</button>
            <button class="btn btn-sm btn-danger" onclick="window.osroSyncDeleteCloudData()">Delete Cloud Data</button>
          </div>
        </div>
      `;
    }
  }

  function initGoogleSignIn() {
    const clientId = window.GOOGLE_CLIENT_ID;
    if (!clientId) return; // Client ID not yet configured

    // Dynamically load Google Identity Services if not already present
    if (!window.google || !window.google.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setupGoogleButton(clientId);
      document.head.appendChild(script);
    } else {
      setupGoogleButton(clientId);
    }
  }

  function setupGoogleButton(clientId) {
    const container = document.getElementById('googleSignInContainer');
    if (!container || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response && response.credential) {
          window.osroSyncLoginWithGoogle(response.credential)
            .then(() => {
              if (typeof showToast === 'function') showToast('Signed in with Google successfully!', 'success');
            })
            .catch(err => {
              if (typeof showToast === 'function') showToast(err.message, 'error');
            });
        }
      },
    });

    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'medium',
      text: 'signin_with',
      shape: 'rectangular',
    });
  }

  // --------------------------------------------------------------------------
  // Global Window Helpers for UI Prompts
  // --------------------------------------------------------------------------

  function showSyncQrModal(code) {
    let modal = document.getElementById('syncQrModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'syncQrModal';
      modal.className = 'sync-modal-backdrop';
      document.body.appendChild(modal);
    }

    const qrUrl = `${window.location.origin}${window.location.pathname}?sync_code=${encodeURIComponent(code)}`;
    let qrSvgHtml = '';
    if (typeof qrcode === 'function') {
      try {
        const qr = qrcode(0, 'M');
        qr.addData(qrUrl);
        qr.make();
        qrSvgHtml = qr.createSvgTag(4, 8);
      } catch (e) {
        console.warn('[Sync] QR generation error:', e);
      }
    }

    modal.innerHTML = `
      <div class="sync-modal-card sync-qr-card">
        <div class="sync-modal-title">Sync Profile Link</div>
        <div class="sync-modal-desc">
          Scan this QR code with your phone camera or enter the code on another device:
        </div>
        ${qrSvgHtml ? `<div class="sync-qr-wrapper">${qrSvgHtml}</div>` : ''}
        <div class="sync-code-display">
          <code>${escapeHtml(code)}</code>
        </div>
        <div class="sync-qr-actions">
          <button class="btn btn-primary" id="syncQrCopyBtn">Copy Code</button>
          <button class="btn" id="syncQrCloseBtn">Close</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';

    document.getElementById('syncQrCopyBtn').onclick = () => {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code);
        if (typeof showToast === 'function') showToast('Sync code copied to clipboard!', 'success');
      } else {
        prompt('Copy your sync code:', code);
      }
    };

    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = 'none';
    };

    document.getElementById('syncQrCloseBtn').onclick = () => {
      modal.style.display = 'none';
    };
  }

  window.osroSyncShowQrModal = function() {
    const session = getSession();
    if (!session || !session.code) return;
    showSyncQrModal(session.code);
  };

  window.osroSyncTriggerSync = async function() {
    if (typeof showToast === 'function') showToast('Syncing with cloud...', 'info', 1500);
    await pullRemoteState();
    await pushLocalChanges();
    if (syncState.status === 'error') {
      if (typeof showToast === 'function') showToast(`Sync failed: ${syncState.error || 'Network error'}`, 'error', 3000);
    } else {
      if (typeof showToast === 'function') showToast('Sync complete!', 'success', 2000);
    }
  };

  window.osroSyncPromptCreateCode = async function() {
    try {
      const code = await window.osroSyncCreateCode();
      showSyncQrModal(code);
    } catch (err) {
      alert(`Error creating code: ${err.message}`);
    }
  };

  window.osroSyncPromptEnterCode = function() {
    const code = prompt('Enter your 16-character sync code (e.g. XXXX-XXXX-XXXX-XXXX):');
    if (!code) return;

    window.osroSyncLoginWithCode(code)
      .then(() => {
        if (typeof showToast === 'function') showToast('Device linked and synced!', 'success');
      })
      .catch(err => {
        alert(err.message);
      });
  };

  window.osroSyncCopyCode = function() {
    const session = getSession();
    if (!session || !session.code) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(session.code);
      if (typeof showToast === 'function') showToast('Sync code copied to clipboard!', 'success');
    } else {
      prompt('Copy your sync code:', session.code);
    }
  };

  async function checkUrlSyncCode() {
    try {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('sync_code');
      if (codeParam) {
        // Clean sync_code parameter while preserving any other existing parameters
        params.delete('sync_code');
        const remainingQuery = params.toString() ? '?' + params.toString() : '';
        const cleanUrl = window.location.pathname + remainingQuery + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);

        if (!window.osroSyncIsLinked()) {
          await window.osroSyncLoginWithCode(codeParam);
          if (typeof showToast === 'function') {
            showToast('Device linked and synced via QR code!', 'success', 3000);
          }
        }
      }
    } catch (err) {
      console.warn('[Sync] Auto-linking via URL sync code failed:', err);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --------------------------------------------------------------------------
  // Lifecycle Initialization
  // --------------------------------------------------------------------------

  window.addEventListener('DOMContentLoaded', () => {
    checkUrlSyncCode();
    updateStatusUI();

    // Pull when page loads if linked
    if (window.osroSyncIsLinked()) {
      pullRemoteState().then(() => {
        // Also push if any local changes were waiting
        pushLocalChanges();
        registerDevicePush();
      });
    }

    // Unload flush using keepalive fetch
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushPushKeepAlive();
      }
    });

    window.addEventListener('online', () => {
      if (window.osroSyncIsLinked()) {
        pullRemoteState();
        pushLocalChanges();
      }
    });

    window.addEventListener('offline', () => {
      setSyncStatus('offline');
    });

    // Cross-tab session sync: update UI if another tab links or unlinks
    window.addEventListener('storage', (event) => {
      if (event.key === SESSION_KEY) {
        updateStatusUI();
      }
    });
  });
})();
