/**
 * search-worker.js - Dedicated background Web Worker for OSRO Quests (HR)
 * Offloads full-text indexing, prefix search, phrase matching, and exclusion logic.
 */

// Load vendored MiniSearch library
importScripts('lib/minisearch.min.js');

let miniSearch = null;
let itemsMetaMap = new Map(); // id -> { nameLower, descLower, idStr, name }
let allItemIdsSorted = [];     // for fallback or empty searches if ever needed
let isInitialized = false;

function tokenizeRO(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const tokens = [];
  // Match slot patterns like [1], [2], [4] and standard alphanumeric tokens
  const regex = /\[(\d+)\]|[\w]+/g;
  let m;
  while ((m = regex.exec(lower)) !== null) {
    if (m[1]) {
      tokens.push('[' + m[1] + ']');
      tokens.push(m[1]);
    } else {
      tokens.push(m[0]);
    }
  }
  return tokens;
}

function initIndex(items) {
  if (!items || typeof items !== 'object') {
    self.postMessage({ type: 'READY', count: 0 });
    return;
  }

  itemsMetaMap.clear();

  const docs = [];
  const entries = Object.entries(items);

  for (let i = 0; i < entries.length; i++) {
    const id = Number(entries[i][0]);
    const it = entries[i][1] || {};
    const idStr = String(id);
    const name = it.name || '';
    const cleanDesc = (it.desc || '').replace(/\^[0-9A-Fa-f]{6}/g, '');
    const nameLower = name.toLowerCase();
    const descLower = cleanDesc.toLowerCase();

    itemsMetaMap.set(id, {
      id,
      idStr,
      name,
      nameLower,
      descLower
    });

    docs.push({
      id,
      idStr,
      name,
      cleanDesc
    });
  }

  miniSearch = new MiniSearch({
    fields: ['name', 'cleanDesc', 'idStr'],
    storeFields: ['id'],
    idField: 'id',
    tokenize: tokenizeRO,
    searchOptions: {
      boost: { name: 3, idStr: 2, cleanDesc: 1 },
      prefix: true,
      tokenize: tokenizeRO,
      combineWith: 'AND'
    }
  });

  miniSearch.addAll(docs);
  isInitialized = true;

  self.postMessage({ type: 'READY', count: docs.length });
}

function searchItems(query, searchDescriptions) {
  if (!isInitialized || !miniSearch) return [];
  const q = (query || '').trim();
  if (!q) return [];

  const fields = searchDescriptions ? ['name', 'cleanDesc', 'idStr'] : ['name', 'idStr'];

  // Pure numeric query -> exact ID first, then substring matches
  if (/^\d+$/.test(q)) {
    const num = parseInt(q, 10);
    const results = [];
    if (itemsMetaMap.has(num)) {
      results.push(num);
    }
    for (const [id, meta] of itemsMetaMap) {
      if (id !== num && meta.idStr.includes(q)) {
        results.push(id);
      }
    }
    return results;
  }

  // Parse quoted phrases and negative exclusions
  const includePhrases = [];
  const includeWords = [];
  const excludePhrases = [];
  const excludeWords = [];

  const remaining = q.replace(/-?"([^"]+)"/g, (match, phrase) => {
    if (match.startsWith('-')) {
      excludePhrases.push(phrase.toLowerCase());
    } else {
      includePhrases.push(phrase.toLowerCase());
    }
    return '';
  });

  remaining.split(/\s+/).forEach(w => {
    if (w.length > 0) {
      if (w.startsWith('-') && w.length > 1) {
        excludeWords.push(w.substring(1).toLowerCase());
      } else if (!w.startsWith('-')) {
        includeWords.push(w.toLowerCase());
      }
    }
  });

  const positiveQuery = [...includeWords, ...includePhrases].join(' ');
  let candidates;

  if (positiveQuery.length > 0) {
    // Search via MiniSearch inverted index
    candidates = miniSearch.search(positiveQuery, {
      fields,
      prefix: true,
      combineWith: 'AND'
    });
  } else {
    // If only exclude tokens were provided, consider all items as initial candidates
    candidates = [];
    for (const [id] of itemsMetaMap) {
      candidates.push({ id });
    }
  }

  // Apply phrase verification and exclude checks
  const matchingIds = [];
  for (let i = 0; i < candidates.length; i++) {
    const id = candidates[i].id;
    const meta = itemsMetaMap.get(id);
    if (!meta) continue;

    const nameLower = meta.nameLower;
    const descLower = meta.descLower;

    // Check include phrases
    let phraseMismatch = false;
    for (let p = 0; p < includePhrases.length; p++) {
      const phrase = includePhrases[p];
      const match = nameLower.includes(phrase) || (searchDescriptions && descLower.includes(phrase));
      if (!match) {
        phraseMismatch = true;
        break;
      }
    }
    if (phraseMismatch) continue;

    // Check exclude words
    let excludeHit = false;
    for (let e = 0; e < excludeWords.length; e++) {
      const exWord = excludeWords[e];
      const match = nameLower.includes(exWord) || (searchDescriptions && descLower.includes(exWord));
      if (match) {
        excludeHit = true;
        break;
      }
    }
    if (excludeHit) continue;

    // Check exclude phrases
    for (let ep = 0; ep < excludePhrases.length; ep++) {
      const exPhrase = excludePhrases[ep];
      const match = nameLower.includes(exPhrase) || (searchDescriptions && descLower.includes(exPhrase));
      if (match) {
        excludeHit = true;
        break;
      }
    }
    if (excludeHit) continue;

    matchingIds.push(id);
  }

  return matchingIds;
}

function suggestItems(query, limit = 10) {
  if (!isInitialized || !miniSearch) return [];
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  // Pure numeric query
  if (/^\d+$/.test(q)) {
    const num = parseInt(q, 10);
    const results = [];
    if (itemsMetaMap.has(num)) {
      const meta = itemsMetaMap.get(num);
      results.push({ id: meta.id, name: meta.name });
    }
    for (const [id, meta] of itemsMetaMap) {
      if (results.length >= limit) break;
      if (id !== num && (meta.idStr.includes(q) || meta.nameLower.includes(q))) {
        results.push({ id: meta.id, name: meta.name });
      }
    }
    return results;
  }

  // Text search
  const candidates = miniSearch.search(q, {
    fields: ['name', 'idStr'],
    prefix: true,
    combineWith: 'AND'
  });

  const results = [];
  for (let i = 0; i < candidates.length && results.length < limit; i++) {
    const id = candidates[i].id;
    const meta = itemsMetaMap.get(id);
    if (meta) {
      results.push({ id: meta.id, name: meta.name });
    }
  }

  return results;
}

self.onmessage = function (e) {
  const msg = e.data || {};

  switch (msg.type) {
    case 'INIT':
      initIndex(msg.items);
      break;

    case 'SEARCH': {
      const matchingIds = searchItems(msg.query, msg.searchDescriptions);
      self.postMessage({
        type: 'SEARCH_RESULTS',
        reqId: msg.reqId,
        query: msg.query,
        matchingIds
      });
      break;
    }

    case 'SUGGEST': {
      const matches = suggestItems(msg.query, msg.limit);
      self.postMessage({
        type: 'SUGGEST_RESULTS',
        reqId: msg.reqId,
        query: msg.query,
        matches
      });
      break;
    }

    default:
      console.warn('[search-worker] Unknown message type:', msg.type);
  }
};
