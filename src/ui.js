// ui.js — all injected UI

const UI = (() => {
  let activeIndex = -1;
  let currentSuggestions = [];
  let onSelectCb = null;

  /* ── Highlight ───────────────────────────────────────────────── */
  function highlight(text, query) {
    const frag = document.createDocumentFragment();
    if (!query || query.startsWith(";")) { frag.appendChild(document.createTextNode(text)); return frag; }
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) { frag.appendChild(document.createTextNode(text)); return frag; }
    frag.appendChild(document.createTextNode(text.slice(0, idx)));
    const m = document.createElement("mark"); m.className = "pa-hl"; m.textContent = text.slice(idx, idx + query.length);
    frag.appendChild(m);
    frag.appendChild(document.createTextNode(text.slice(idx + query.length)));
    return frag;
  }

  /* ── Dropdown ────────────────────────────────────────────────── */
  function getDD() {
    let dd = document.getElementById("pa-dropdown");
    if (!dd) { dd = document.createElement("div"); dd.id = "pa-dropdown"; dd.setAttribute("role","listbox"); document.body.appendChild(dd); }
    return dd;
  }

  function positionDropdown(inputEl) {
    const dd = getDD(), r = inputEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const h = Math.min(300, dd.scrollHeight || 280);
    const top = spaceBelow >= h + 8 ? r.bottom + window.scrollY + 6 : r.top + window.scrollY - h - 6;
    dd.style.top   = top + "px";
    dd.style.left  = (r.left + window.scrollX) + "px";
    dd.style.width = Math.max(r.width, 340) + "px";
  }

  function renderDropdown(suggestions, query, inputEl, onSelect) {
    const dd = getDD();
    onSelectCb = onSelect; currentSuggestions = suggestions; activeIndex = -1;
    if (!suggestions.length) { hideDropdown(); return; }
    dd.innerHTML = "";

    const hdr = document.createElement("div"); hdr.className = "pa-dd-hdr";
    if (query.startsWith(";"))   hdr.textContent = "; tag filter · " + suggestions.length + " found";
    else if (!query)             hdr.textContent = "⭐ Pinned  ·  🔥 Most Used";
    else                         hdr.textContent = "Saved Prompts";
    dd.appendChild(hdr);

    suggestions.forEach((p, i) => {
      const item = document.createElement("div");
      item.className = "pa-item" + (p.pinned ? " pa-pinned" : "");
      item.setAttribute("role","option"); item.dataset.index = i;

      if (p.pinned) { const s = document.createElement("span"); s.className = "pa-pin"; s.textContent = "⭐"; item.appendChild(s); }

      const body = document.createElement("div"); body.className = "pa-ibody";
      const txt  = document.createElement("span"); txt.className = "pa-itext"; txt.appendChild(highlight(p.text, query)); body.appendChild(txt);
      if (p.tag) { const tg = document.createElement("span"); tg.className = "pa-itag"; tg.textContent = "#" + p.tag; body.appendChild(tg); }
      item.appendChild(body);

      if ((p.uses || 0) > 0) { const b = document.createElement("span"); b.className = "pa-uses"; b.textContent = p.uses + "×"; item.appendChild(b); }

      // Quick-edit pencil
      const editBtn = document.createElement("button"); editBtn.className = "pa-edit-btn"; editBtn.title = "Quick edit";
      editBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      editBtn.addEventListener("mousedown", (e) => { e.stopPropagation(); e.preventDefault(); showInlineEdit(item, p); });
      item.appendChild(editBtn);

      item.addEventListener("mousedown", (e) => {
        if (e.target.closest(".pa-edit-btn") || e.target.closest(".pa-inline-editor")) return;
        e.preventDefault(); selectItem(i);
      });
      dd.appendChild(item);
    });

    positionDropdown(inputEl);
    dd.classList.add("pa-visible");
  }

  function showInlineEdit(item, p) {
    document.querySelectorAll(".pa-inline-editor").forEach(e => e.remove());
    const ed  = document.createElement("div"); ed.className = "pa-inline-editor";
    const inp = document.createElement("textarea"); inp.className = "pa-inline-input"; inp.value = p.text; inp.rows = 3;
    const row = document.createElement("div"); row.className = "pa-inline-row";
    const saveB   = document.createElement("button"); saveB.className   = "pa-inline-save";   saveB.textContent = "Save";
    const cancelB = document.createElement("button"); cancelB.className = "pa-inline-cancel"; cancelB.textContent = "Cancel";
    row.appendChild(saveB); row.appendChild(cancelB); ed.appendChild(inp); ed.appendChild(row);
    saveB.addEventListener("mousedown", async (e) => {
      e.preventDefault(); e.stopPropagation();
      const t = inp.value.trim(); if (!t) return;
      await Storage.update(p.id, t, p.tag);
      hideDropdown(); showToast("✓ Updated");
    });
    cancelB.addEventListener("mousedown", (e) => { e.preventDefault(); ed.remove(); });
    item.appendChild(ed);
    requestAnimationFrame(() => { inp.focus(); inp.select(); });
  }

  function selectItem(i) {
    if (i < 0 || i >= currentSuggestions.length) return;
    const p = currentSuggestions[i];
    hideDropdown();
    if (onSelectCb) onSelectCb(p);
  }

  function hideDropdown() {
    const dd = document.getElementById("pa-dropdown");
    if (dd) { dd.classList.remove("pa-visible"); dd.innerHTML = ""; }
    activeIndex = -1; currentSuggestions = [];
  }

  function navigateDropdown(dir) {
    const dd = document.getElementById("pa-dropdown");
    if (!dd || !dd.classList.contains("pa-visible")) return false;
    const items = dd.querySelectorAll(".pa-item");
    if (!items.length) return false;
    if (activeIndex >= 0) items[activeIndex].classList.remove("pa-active");
    activeIndex = (activeIndex + dir + items.length) % items.length;
    items[activeIndex].classList.add("pa-active");
    return true;
  }

  function confirmSelection() {
    if (activeIndex >= 0) { selectItem(activeIndex); return true; }
    return false;
  }

  function isVisible() {
    const dd = document.getElementById("pa-dropdown");
    return !!(dd && dd.classList.contains("pa-visible"));
  }

  /* ── Limit reached notice (replaces old paywall modal) ─────── */
  function showPaywall() {
    // No paywall — everything is free. Just inform the user they hit the limit.
    showToast("Prompt limit reached (" + CONFIG.MAX_PROMPTS + " max). Delete some to add more.");
  }

  /* ── Similar confirm ─────────────────────────────────────────── */
  function showSimilarConfirm(match, onConfirm) {
    if (document.getElementById("pa-modal")) return;
    
    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "pa-modal";
    
    // Create modal box
    const box = document.createElement("div");
    box.className = "pa-modal-box";
    
    // Icon
    const icon = document.createElement("div");
    icon.className = "pa-modal-icon";
    icon.style.fontSize = "22px";
    icon.textContent = "⚠️";
    
    // Title
    const title = document.createElement("div");
    title.className = "pa-modal-title";
    title.textContent = "Similar prompt exists";
    
    // Body
    const body = document.createElement("div");
    body.className = "pa-modal-body";
    body.textContent = "You already have a similar prompt:";
    
    // Preview (safe text insertion)
    const preview = document.createElement("em");
    preview.className = "pa-similar-preview";
    const previewText = match.text.slice(0, 120) + (match.text.length > 120 ? "…" : "");
    preview.textContent = previewText;
    body.appendChild(preview);
    
    // Button row
    const row = document.createElement("div");
    row.className = "pa-modal-row";
    
    // Save anyway button
    const saveBtn = document.createElement("button");
    saveBtn.className = "pa-modal-cta";
    saveBtn.id = "pa-sim-y";
    saveBtn.textContent = "Save anyway";
    saveBtn.addEventListener("click", () => { 
      overlay.remove(); 
      if (onConfirm) onConfirm(); 
    });
    
    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "pa-modal-later";
    cancelBtn.id = "pa-sim-n";
    cancelBtn.style.cssText = "flex:1;text-align:center";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => overlay.remove());
    
    row.appendChild(saveBtn);
    row.appendChild(cancelBtn);
    
    // Assemble
    box.appendChild(icon);
    box.appendChild(title);
    box.appendChild(body);
    box.appendChild(row);
    overlay.appendChild(box);
    
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("pa-modal-show"));
  }

  /* ── Soft reminder bar ───────────────────────────────────────── */
  function showReminder(count) {
    if (document.getElementById("pa-reminder")) return;
    const r = document.createElement("div"); r.id = "pa-reminder";
    r.innerHTML = `
      <span class="pa-rem-text">💡 You have <strong>${count}</strong> saved prompt${count===1?"":"s"}. Press <kbd>Ctrl+Space</kbd> to use them.</span>
      <button class="pa-rem-snooze" id="pa-rem-snooze">Later</button>
      <button class="pa-rem-x" id="pa-rem-x">✕</button>`;
    r.querySelector("#pa-rem-x").addEventListener("click", () => {
      r.classList.remove("pa-rem-show"); setTimeout(() => r.remove(), 350);
    });
    r.querySelector("#pa-rem-snooze").addEventListener("click", async () => {
      await Storage.snoozeReminder();
      r.classList.remove("pa-rem-show"); setTimeout(() => r.remove(), 350);
    });
    document.body.appendChild(r);
    requestAnimationFrame(() => r.classList.add("pa-rem-show"));
    // Auto-hide after 10 sec
    setTimeout(() => {
      if (document.getElementById("pa-reminder")) {
        r.classList.remove("pa-rem-show"); setTimeout(() => r.remove(), 400);
      }
    }, 10000);
  }

  /* ── Inline save chip (after send) ──────────────────────────── */
  let chipTimer = null;
  function showSaveChip(text, inputEl) {
    removeSaveChip();
    const chip = document.createElement("div"); chip.id = "pa-save-chip";
    chip.innerHTML = `<span class="pa-chip-icon">✅</span><span class="pa-chip-text">Save this prompt?</span><button class="pa-chip-yes">Save</button><button class="pa-chip-no">✕</button>`;
    chip.querySelector(".pa-chip-yes").addEventListener("click", async () => {
      removeSaveChip();
      const r = await Storage.save(text);
      if (r.ok)                          showToast("✓ Saved");
      else if (r.reason === "duplicate") showToast("Already saved");
      else if (r.reason === "similar")   showSimilarConfirm(r.match, async () => { await Storage.forceSave(text); showToast("✓ Saved"); });
      else if (r.reason === "limit")     showPaywall();
    });
    chip.querySelector(".pa-chip-no").addEventListener("click", removeSaveChip);
    document.body.appendChild(chip);
    const rect = inputEl.getBoundingClientRect();
    chip.style.left = (rect.left + window.scrollX + 12) + "px";
    chip.style.top  = (rect.top  + window.scrollY - 48) + "px";
    requestAnimationFrame(() => chip.classList.add("pa-chip-show"));
    chipTimer = setTimeout(removeSaveChip, 4500);
  }

  function removeSaveChip() {
    clearTimeout(chipTimer);
    const c = document.getElementById("pa-save-chip");
    if (c) { c.classList.remove("pa-chip-show"); setTimeout(() => c.remove(), 250); }
  }

  /* ── Save button group (click to save, drag handle to move) ──── */
  function createSaveButton(onClick) {
    // Wrapper group
    const group = document.createElement("div");
    group.id = "pa-btn-group";

    // Save part — click only
    const saveBtn = document.createElement("button");
    saveBtn.id = "pa-save-btn";
    saveBtn.title = "Save this prompt";
    saveBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save`;
    saveBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      onClick(e);
    });

    // Drag handle — drag only
    const handle = document.createElement("div");
    handle.id = "pa-drag-handle";
    handle.title = "Drag to move";
    handle.innerHTML = `<svg width="10" height="14" viewBox="0 0 10 16" fill="currentColor"><circle cx="3" cy="2" r="1.2"/><circle cx="7" cy="2" r="1.2"/><circle cx="3" cy="6" r="1.2"/><circle cx="7" cy="6" r="1.2"/><circle cx="3" cy="10" r="1.2"/><circle cx="7" cy="10" r="1.2"/><circle cx="3" cy="14" r="1.2"/><circle cx="7" cy="14" r="1.2"/></svg>`;

    group.appendChild(saveBtn);
    group.appendChild(handle);

    // Drag logic — only on handle
    _makeDraggableHandle(group, handle);

    return group;
  }

  function _makeDraggableHandle(group, handle) {
    let down = false, ox = 0, oy = 0, didDrag = false;
    handle.addEventListener("mousedown", function(e) {
      if (e.button !== 0) return;
      down = true; didDrag = false;
      ox = e.clientX - group.getBoundingClientRect().left;
      oy = e.clientY - group.getBoundingClientRect().top;
      group.style.transition = "none";
      e.preventDefault();
      e.stopPropagation();
    });
    document.addEventListener("mousemove", function(e) {
      if (!down) return;
      if (Math.abs(e.movementX) + Math.abs(e.movementY) < 2) return;
      didDrag = true;
      group.dataset.dragged = "1";
      group.style.left = (e.clientX - ox + window.scrollX) + "px";
      group.style.top  = (e.clientY - oy + window.scrollY) + "px";
      // Move nav button alongside if it exists
      var nav = document.getElementById("pa-nav-btn");
      if (nav) {
        nav.style.left = (e.clientX - ox + window.scrollX + group.offsetWidth + 6) + "px";
        nav.style.top  = (e.clientY - oy + window.scrollY) + "px";
      }
    });
    document.addEventListener("mouseup", function() {
      if (down) { down = false; group.style.transition = ""; }
    });
  }

  /* ── Toast ───────────────────────────────────────────────────── */
  function showToast(msg, type = "success") {
    const old = document.getElementById("pa-toast"); if (old) old.remove();
    const t = document.createElement("div"); t.id = "pa-toast";
    t.className = "pa-toast pa-toast-" + type; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("pa-toast-show"));
    setTimeout(() => { t.classList.remove("pa-toast-show"); setTimeout(() => t.remove(), 300); }, 2400);
  }

  return {
    renderDropdown, hideDropdown, navigateDropdown, confirmSelection, isVisible,
    positionDropdown, createSaveButton,
    showPaywall, showSimilarConfirm, showReminder,
    showSaveChip, removeSaveChip, showToast,
  };
})();
