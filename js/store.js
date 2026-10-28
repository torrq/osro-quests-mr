// js/store.js — Centralized storage layer with change tracking for cloud sync
(function() {
  const META_KEY = 'osromr_sync_meta';
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  function loadMeta() {
    try {
      const data = JSON.parse(localStorage.getItem(META_KEY));
      if (data && typeof data === 'object') {
        if (!data.updatedAt) data.updatedAt = {};
        if (!data.dirty) data.dirty = {};
        if (!data.deleted) data.deleted = {};

        // Prune deleted tombstones older than 30 days
        const now = Date.now();
        let pruned = false;
        for (const [key, ts] of Object.entries(data.deleted)) {
          if (now - (data.updatedAt[key] || 0) > THIRTY_DAYS_MS) {
            delete data.deleted[key];
            delete data.updatedAt[key];
            delete data.dirty[key];
            pruned = true;
          }
        }
        if (pruned) saveMeta(data);

        return data;
      }
    } catch (e) {
      // ignore JSON parse error
    }
    return { updatedAt: {}, dirty: {}, deleted: {} };
  }

  function saveMeta(meta) {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch (e) {
      console.warn('[Store] Failed to save sync meta:', e);
    }
  }

  const changeListeners = [];

  // Cross-tab synchronization via native 'storage' event (fires only in other tabs)
  window.addEventListener('storage', (event) => {
    const key = event.key;
    if (!key) return;

    // Ignore internal sync metadata keys
    if (key === META_KEY || key === 'osromr_sync_last_time' || key === 'osromr_sync_session' || key === 'osromr_device_id') {
      return;
    }

    const syncList = (typeof SYNC_KEYS !== 'undefined' && Array.isArray(SYNC_KEYS)) ? SYNC_KEYS : [];
    if (syncList.includes(key)) {
      if (typeof window.osroOnSyncedDataChanged === 'function') {
        try { window.osroOnSyncedDataChanged([key]); } catch (e) {}
      }
      osroStore.notifyRemoteChange([key]);
    }
  });

  const osroStore = {
    getItem(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error(`[Store] Error reading key "${key}":`, e);
        return null;
      }
    },

    getJson(key, fallback = null) {
      try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : fallback;
      } catch (e) {
        console.error(`[Store] Error parsing JSON for key "${key}":`, e);
        return fallback;
      }
    },

    setItem(key, value, options = {}) {
      try {
        const strVal = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, strVal);

        const syncList = (typeof SYNC_KEYS !== 'undefined' && Array.isArray(SYNC_KEYS)) ? SYNC_KEYS : [];
        if (syncList.includes(key)) {
          const meta = loadMeta();
          const timestamp = options.updatedAt || Date.now();
          meta.updatedAt[key] = timestamp;
          delete meta.deleted[key];
          if (!options.skipMarkDirty) {
            meta.dirty[key] = timestamp;
          }
          saveMeta(meta);

          if (!options.skipNotify && typeof window.osroSyncNotifyChange === 'function') {
            window.osroSyncNotifyChange(key);
          }
        }
      } catch (e) {
        console.error(`[Store] Error setting key "${key}":`, e);
      }
    },

    removeItem(key, options = {}) {
      try {
        localStorage.removeItem(key);

        const syncList = (typeof SYNC_KEYS !== 'undefined' && Array.isArray(SYNC_KEYS)) ? SYNC_KEYS : [];
        if (syncList.includes(key)) {
          const meta = loadMeta();
          const timestamp = options.updatedAt || Date.now();
          meta.updatedAt[key] = timestamp;
          meta.deleted[key] = true;
          if (!options.skipMarkDirty) {
            meta.dirty[key] = timestamp;
          }
          saveMeta(meta);

          if (!options.skipNotify && typeof window.osroSyncNotifyChange === 'function') {
            window.osroSyncNotifyChange(key);
          }
        }
      } catch (e) {
        console.error(`[Store] Error removing key "${key}":`, e);
      }
    },

    getMeta() {
      return loadMeta();
    },

    saveMeta(meta) {
      saveMeta(meta);
    },

    clearDirty(keys, maxTimestamps = null) {
      const meta = loadMeta();
      if (maxTimestamps && typeof maxTimestamps === 'object') {
        for (const [k, ts] of Object.entries(maxTimestamps)) {
          if (meta.dirty[k] && meta.dirty[k] <= ts) {
            delete meta.dirty[k];
          }
        }
      } else if (Array.isArray(keys)) {
        keys.forEach(k => delete meta.dirty[k]);
      } else if (typeof keys === 'string') {
        delete meta.dirty[keys];
      } else {
        meta.dirty = {};
      }
      saveMeta(meta);
    },

    // Flag a key for upload without rewriting its value (e.g. after a merge
    // whose result differs from the cloud copy, or on first link).
    markDirty(key, updatedAt) {
      const meta = loadMeta();
      const ts = updatedAt || Date.now();
      meta.updatedAt[key] = ts;
      meta.dirty[key] = ts;
      delete meta.deleted[key];
      saveMeta(meta);
    },

    applyRemoteUpdate(key, value, updatedAt) {
      try {
        if (value === null || value === undefined) {
          localStorage.removeItem(key);
        } else {
          const strVal = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, strVal);
        }
        const meta = loadMeta();
        meta.updatedAt[key] = updatedAt;
        delete meta.dirty[key];
        if (value === null || value === undefined) {
          meta.deleted[key] = true;
        } else {
          delete meta.deleted[key];
        }
        saveMeta(meta);
      } catch (e) {
        console.error(`[Store] Error applying remote update for "${key}":`, e);
      }
    },

    onRemoteChange(callback) {
      if (typeof callback === 'function') {
        changeListeners.push(callback);
      }
    },

    notifyRemoteChange(changedKeys) {
      changeListeners.forEach(cb => {
        try {
          cb(changedKeys);
        } catch (err) {
          console.error('[Store] onRemoteChange listener error:', err);
        }
      });
    }
  };

  window.osroStore = osroStore;
})();
