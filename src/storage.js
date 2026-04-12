// storage.js — v5.0 (fully free, no Pro tiers)
// Added: proper error handling, caching, backup/restore, chrome.storage.sync support

const Storage = (() => {
  const KEY      = "pa_prompts";
  const META_KEY = "pa_meta";
  
  // In-memory cache
  let cache = null;
  let cacheTimestamp = 0;
  const CACHE_TTL = 5000; // 5 second cache TTL

  const ALL_SITES = [
    "chatgpt","claude","gemini","grok","metaai","deepseek","perplexity",
    "copilot","mistral","notebooklm","aistudio","lovable","bolt","cursor",
    "emergent","v0","anything","rork","youcom","pi","poe","huggingchat","cohere","groq",
    "openrouter","midjourney","leonardo","ideogram","reve","dreamstudio",
    "designer","freepik","nightcafe","krea","firefly","stability","playground",
    "lexica","tensor","bingimage","runway","sora","heygen","synthesia","pika",
    "kling","invideo","hailuo","luma","pictory","veed","capcut","descript",
    "fliki","clipchamp","kaiber"
  ];
  
  // Storage area preference (local or sync)
  let useSyncStorage = false;
  
  function getStorageArea() {
    return useSyncStorage ? chrome.storage.sync : chrome.storage.local;
  }
  
  // Check if sync storage is available
  async function checkSyncAvailability() {
    return new Promise((resolve) => {
      if (!chrome.storage.sync) {
        resolve(false);
        return;
      }
      chrome.storage.sync.getBytesInUse(null, (bytes) => {
        if (chrome.runtime.lastError) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
  
  // Initialize with sync preference
  async function initStoragePreference() {
    const syncAvailable = await checkSyncAvailability();
    if (syncAvailable) {
      const meta = await getMeta();
      if (meta.useSyncStorage === true) {
        useSyncStorage = true;
      }
    }
  }
  
  // Toggle sync storage
  async function setUseSyncStorage(enabled) {
    const syncAvailable = await checkSyncAvailability();
    if (enabled && !syncAvailable) {
      return { ok: false, reason: "sync_not_available" };
    }
    useSyncStorage = enabled;
    await setMeta({ useSyncStorage: enabled });
    // Clear cache when switching
    cache = null;
    cacheTimestamp = 0;
    return { ok: true };
  }
  
  function handleError(operation, err) {
    console.error("[Storage] " + operation + " failed:", err);
    if (chrome.runtime.lastError) {
      console.error("[Storage] Runtime error:", chrome.runtime.lastError.message);
    }
  }

  function generateId() {
    return "p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  }

  async function getMeta() {
    return new Promise((resolve) => {
      chrome.storage.local.get([META_KEY], (d) => {
        if (chrome.runtime.lastError) {
          handleError("getMeta", chrome.runtime.lastError);
          resolve({});
          return;
        }
        resolve(d[META_KEY] || {});
      });
    });
  }
  
  async function setMeta(patch) {
    const cur = await getMeta();
    return new Promise((resolve) => {
      chrome.storage.local.set({ [META_KEY]: { ...cur, ...patch } }, () => {
        if (chrome.runtime.lastError) {
          handleError("setMeta", chrome.runtime.lastError);
        }
        resolve();
      });
    });
  }
  
  // Invalidate cache
  function invalidateCache() {
    cache = null;
    cacheTimestamp = 0;
  }

  async function maybeInit() {
    await initStoragePreference();
    const meta = await getMeta();
    if (meta.initialized) {
      // Migration: if old content.js wrote lastSite to wrong key, pull it over once
      if (!meta._migrated_v2) {
        await new Promise((resolve) => {
          chrome.storage.local.get(["__pa_meta__"], async (d) => {
            if (chrome.runtime.lastError) {
              handleError("migration", chrome.runtime.lastError);
              resolve();
              return;
            }
            if (d["__pa_meta__"] && d["__pa_meta__"].lastSite && !meta.lastSite) {
              await setMeta({ lastSite: d["__pa_meta__"].lastSite });
            }
            await setMeta({ _migrated_v2: true });
            chrome.storage.local.remove(["__pa_meta__"], () => {
              if (chrome.runtime.lastError) {
                handleError("cleanup", chrome.runtime.lastError);
              }
              resolve();
            });
          });
        });
      }
      return;
    }
    await setMeta({ 
      initialized: true, 
      firstInstall: Date.now(), 
      sessions: 0, 
      totalUses: 0, 
      onboarded: false, 
      _migrated_v2: true 
    });
  }

  async function trackSession() {
    const meta = await getMeta();
    const now = Date.now();
    if (now - (meta.lastSession || 0) > 30 * 60 * 1000) {
      await setMeta({ sessions: (meta.sessions || 0) + 1, lastSession: now });
    }
  }

  async function incrementUse(id) {
    const prompts = await getAll();
    const i = prompts.findIndex((p) => p.id === id);
    if (i !== -1) { 
      prompts[i].uses = (prompts[i].uses || 0) + 1; 
      await _set(prompts); 
    }
    const meta = await getMeta();
    await setMeta({ totalUses: (meta.totalUses || 0) + 1 });
  }

  async function shouldShowReminder() {
    const meta = await getMeta();
    const prompts = await getAll();
    if (!prompts.length) return false;
    const sinceReminder = Date.now() - (meta.lastReminder || 0);
    if ((meta.sessions || 0) >= 3 && (meta.totalUses || 0) === 0 && sinceReminder > 7 * 24 * 3600 * 1000) {
      await setMeta({ lastReminder: Date.now() });
      return { show: true, count: prompts.length };
    }
    return false;
  }

  async function snoozeReminder() {
    await setMeta({ lastReminder: Date.now() - 4 * 24 * 3600 * 1000 });
  }

  async function getAll() {
    // Return cached data if fresh
    const now = Date.now();
    if (cache && (now - cacheTimestamp) < CACHE_TTL) {
      return [...cache]; // Return copy to prevent mutation
    }
    
    return new Promise((resolve) => {
      getStorageArea().get([KEY], (d) => {
        if (chrome.runtime.lastError) {
          handleError("getAll", chrome.runtime.lastError);
          resolve(cache || []); // Fallback to cache on error
          return;
        }
        const result = d[KEY] || [];
        cache = result;
        cacheTimestamp = now;
        resolve([...result]); // Return copy
      });
    });
  }
  
  function _set(data) {
    invalidateCache();
    return new Promise((resolve) => {
      getStorageArea().set({ [KEY]: data }, () => {
        if (chrome.runtime.lastError) {
          handleError("_set", chrome.runtime.lastError);
        }
        resolve();
      });
    });
  }

  function _normSites(sites) {
    if (!Array.isArray(sites) || !sites.length) return [];
    return sites.filter((s) => ALL_SITES.includes(s));
  }
  
  function _matchesSite(prompt, site) {
    if (!prompt.sites || !prompt.sites.length) return true;
    return prompt.sites.includes(site);
  }

  async function save(text, tag = "", sites = []) {
    text = text.trim();
    if (!text) return { ok: false, reason: "empty" };
    const prompts = await getAll();
    const maxPrompts = await CONFIG.getMaxPrompts();
    if (prompts.length >= maxPrompts) return { ok: false, reason: "limit" };
    if (prompts.some((p) => p.text.toLowerCase() === text.toLowerCase()))
      return { ok: false, reason: "duplicate" };
    const sim = _findSimilar(text, prompts);
    if (sim) return { ok: false, reason: "similar", match: sim };
    const p = {
      id: generateId(), text, tag: tag.trim(),
      sites: _normSites(sites), pinned: false, uses: 0,
      history: [], created_at: Date.now()
    };
    prompts.unshift(p);
    await _set(prompts);
    return { ok: true, prompt: p };
  }

  async function forceSave(text, tag = "", sites = []) {
    text = text.trim();
    if (!text) return { ok: false };
    const prompts = await getAll();
    const maxPrompts = await CONFIG.getMaxPrompts();
    if (prompts.length >= maxPrompts) return { ok: false, reason: "limit" };
    if (prompts.some((p) => p.text.toLowerCase() === text.toLowerCase()))
      return { ok: false, reason: "duplicate" };
    const p = {
      id: generateId(), text, tag: tag.trim(),
      sites: _normSites(sites), pinned: false, uses: 0,
      history: [], created_at: Date.now()
    };
    prompts.unshift(p);
    await _set(prompts);
    return { ok: true, prompt: p };
  }

  async function importPack(items) {
    if (!Array.isArray(items)) return { added: 0, skipped: 0 };
    const prompts = await getAll();
    const existing = new Set(prompts.map((p) => p.text.toLowerCase()));
    let added = 0, skipped = 0;
    for (const item of items) {
      const text = String(item.text || "").trim();
      const tag = String(item.tag || "").trim();
      const sites = _normSites(item.sites || []);
      if (!text || existing.has(text.toLowerCase())) { skipped++; continue; }
      const maxPrompts = await CONFIG.getMaxPrompts();
      if (prompts.length >= maxPrompts) { skipped++; continue; }
      prompts.unshift({ 
        id: generateId(), text, tag, sites, pinned: false, uses: 0, history: [], created_at: Date.now() 
      });
      existing.add(text.toLowerCase());
      added++;
    }
    if (added > 0) await _set(prompts);
    return { added, skipped };
  }

  async function togglePin(id) {
    const prompts = await getAll();
    const i = prompts.findIndex((p) => p.id === id);
    if (i === -1) return { ok: false };
    prompts[i].pinned = !prompts[i].pinned;
    await _set(prompts);
    return { ok: true, pinned: prompts[i].pinned };
  }

  async function update(id, newText, newTag = "", newSites = null) {
    newText = newText.trim();
    if (!newText) return { ok: false };
    const p = await getAll();
    const i = p.findIndex((x) => x.id === id);
    if (i === -1) return { ok: false };
    if (p[i].text !== newText) {
      const history = p[i].history || [];
      history.unshift({ text: p[i].text, saved_at: Date.now() });
      p[i].history = history.slice(0, 5);
    }
    p[i].text = newText;
    p[i].tag = newTag.trim();
    if (newSites !== null) p[i].sites = _normSites(newSites);
    await _set(p);
    return { ok: true };
  }

  async function restoreVersion(id, historyIndex) {
    const p = await getAll();
    const i = p.findIndex((x) => x.id === id);
    if (i === -1) return { ok: false };
    const history = p[i].history || [];
    if (!history[historyIndex]) return { ok: false };
    const oldText = p[i].text;
    p[i].text = history[historyIndex].text;
    history.splice(historyIndex, 1);
    history.unshift({ text: oldText, saved_at: Date.now() });
    p[i].history = history.slice(0, 5);
    await _set(p);
    return { ok: true };
  }

  async function remove(id) {
    const p = await getAll();
    await _set(p.filter((x) => x.id !== id));
  }
  
  // Bulk remove operation
  async function removeMultiple(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return { ok: false, removed: 0 };
    const p = await getAll();
    const idSet = new Set(ids);
    const newPrompts = p.filter((x) => !idSet.has(x.id));
    const removed = p.length - newPrompts.length;
    await _set(newPrompts);
    return { ok: true, removed };
  }

  function _findSimilar(text, prompts) {
    const aW = new Set(text.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    if (aW.size < 4) return null;
    for (const p of prompts) {
      const bW = new Set(p.text.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
      if (bW.size < 4) continue;
      const inter = [...aW].filter((w) => bW.has(w)).length;
      const union = new Set([...aW, ...bW]).size;
      if (inter / union > 0.65) return p;
    }
    return null;
  }

  async function exactAlias(query, currentSite = null) {
    if (!query.startsWith(";") || query.length < 2) return null;
    const alias = query.slice(1).toLowerCase();
    const all = await getAll();
    return all.find((p) =>
      p.tag && p.tag.toLowerCase() === alias &&
      (!currentSite || _matchesSite(p, currentSite))
    ) || null;
  }

  async function search(query, currentSite = null) {
    if (!query || query.length < 1) return [];
    const all = await getAll();
    const prompts = currentSite ? all.filter((p) => _matchesSite(p, currentSite)) : all;
    const q = query.toLowerCase();
    if (query.startsWith(";")) {
      const tag = query.slice(1).toLowerCase();
      if (!tag) return _sort(prompts).slice(0, 5);
      return _sort(prompts.filter((p) => p.tag && p.tag.toLowerCase().includes(tag))).slice(0, 5);
    }
    const sw = [], has = [];
    for (const p of prompts) {
      const t = p.text.toLowerCase();
      if (t.startsWith(q)) sw.push(p);
      else if (t.includes(q)) has.push(p);
    }
    return _sort([...sw, ...has]).slice(0, 5);
  }

  function _sort(list) {
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.uses || 0) - (a.uses || 0);
    });
  }

  async function getStats() {
    const [meta, prompts] = await Promise.all([getMeta(), getAll()]);
    const totalUses = meta.totalUses || 0;
    const timeSec = totalUses * 15;
    const timeSaved = timeSec < 60 ? timeSec + "s" : Math.round(timeSec / 60) + "m";
    const mostUsed = prompts.length ? [...prompts].sort((a, b) => (b.uses || 0) - (a.uses || 0))[0] : null;
    return { count: prompts.length, totalUses, timeSaved, mostUsed };
  }
  
  // Export functionality
  async function exportAll() {
    const prompts = await getAll();
    const meta = await getMeta();
    return {
      version: 1,
      exportDate: Date.now(),
      prompts: prompts,
      stats: {
        totalUses: meta.totalUses || 0,
        sessions: meta.sessions || 0
      }
    };
  }
  
  // Backup to sync storage (if available)
  async function createBackup() {
    const syncAvailable = await checkSyncAvailability();
    if (!syncAvailable) {
      return { ok: false, reason: "sync_not_available" };
    }
    const prompts = await getAll();
    const backup = {
      timestamp: Date.now(),
      prompts: prompts
    };
    return new Promise((resolve) => {
      chrome.storage.sync.set({ ["pa_backup"]: backup }, () => {
        if (chrome.runtime.lastError) {
          handleError("createBackup", chrome.runtime.lastError);
          resolve({ ok: false, reason: chrome.runtime.lastError.message });
        } else {
          resolve({ ok: true });
        }
      });
    });
  }
  
  // Restore from sync storage backup
  async function restoreFromBackup() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["pa_backup"], (d) => {
        if (chrome.runtime.lastError) {
          handleError("restoreFromBackup", chrome.runtime.lastError);
          resolve({ ok: false, reason: chrome.runtime.lastError.message });
          return;
        }
        const backup = d["pa_backup"];
        if (!backup || !backup.prompts) {
          resolve({ ok: false, reason: "no_backup_found" });
          return;
        }
        _set(backup.prompts).then(() => {
          resolve({ ok: true, restored: backup.prompts.length, timestamp: backup.timestamp });
        });
      });
    });
  }

  return {
    maybeInit, getAll, save, forceSave, importPack,
    remove, removeMultiple, update, restoreVersion, togglePin, incrementUse,
    exactAlias, search,
    trackSession, getMeta, setMeta, getStats,
    shouldShowReminder, snoozeReminder,
    ALL_SITES,
    // Get dynamic max prompts (25 for free, Infinity for Pro)
    getMaxPrompts: CONFIG.getMaxPrompts,
    // New exports
    exportAll,
    createBackup,
    restoreFromBackup,
    setUseSyncStorage,
    getUseSyncStorage: () => useSyncStorage,
    invalidateCache
  };
})();
