// popup.js — v3.0 — clean rewrite

(function () {
  "use strict";

  const ALL_SITES = [
    "chatgpt","claude","gemini","grok","metaai","deepseek","perplexity",
    "copilot","mistral","youcom","pi","huggingchat","cohere","groq",
    "openrouter","aistudio","notebooklm","midjourney","leonardo","ideogram",
    "reve","dreamstudio","designer","freepik","nightcafe","krea","firefly",
    "stability","playground","lexica","tensor","bingimage","runway","sora",
    "heygen","synthesia","pika","kling","invideo","hailuo","luma","pictory",
    "veed","capcut","descript","fliki","clipchamp","kaiber",
    "lovable","bolt","cursor","emergent","v0","anything","rork","poe"
  ];

  const SITE_LABELS = {
    chatgpt:"ChatGPT", claude:"Claude", gemini:"Gemini", grok:"Grok",
    copilot:"Copilot", deepseek:"DeepSeek", perplexity:"Perplexity",
    metaai:"Meta AI", mistral:"Mistral", youcom:"You.com", pi:"Pi",
    huggingchat:"HuggingChat", cohere:"Cohere", groq:"Groq",
    openrouter:"OpenRouter", aistudio:"AI Studio", notebooklm:"NotebookLM",
    midjourney:"Midjourney", leonardo:"Leonardo", ideogram:"Ideogram",
    reve:"Reve", dreamstudio:"DreamStudio", designer:"Designer",
    freepik:"Freepik", nightcafe:"NightCafe", krea:"Krea",
    firefly:"Firefly", stability:"Stability", playground:"Playground",
    lexica:"Lexica", tensor:"Tensor.art", bingimage:"Bing Image",
    runway:"Runway", sora:"Sora", heygen:"HeyGen", synthesia:"Synthesia",
    pika:"Pika", kling:"Kling", invideo:"InVideo", hailuo:"Hailuo",
    luma:"Luma", pictory:"Pictory", veed:"Veed", capcut:"CapCut",
    descript:"Descript", fliki:"Fliki", clipchamp:"Clipchamp", kaiber:"Kaiber",
    lovable:"Lovable", bolt:"Bolt", cursor:"Cursor", emergent:"Emergent",
    v0:"v0", anything:"Anything", rork:"Rork", poe:"Poe"
  };

  const PACKS = {
    founders: [
      { text: "Write a cold outreach email for [product] targeting [role]. Max 80 words. One pain point only.", tag: "email" },
      { text: "Give me 5 different value propositions for [product]. Each one sentence. Different angles.", tag: "startup" },
      { text: "Write a 60-second elevator pitch for [startup]. Include problem, solution, and traction.", tag: "pitch" },
      { text: "What are the top 3 objections to [product] and how should I handle each one?", tag: "sales" },
      { text: "Write a product launch tweet that feels authentic, not marketing. Under 200 chars.", tag: "launch" },
    ],
    writing: [
      { text: "Write a Twitter thread with 7 tweets about [topic]. Hook in tweet 1. Value in 2-6. CTA in 7.", tag: "twitter" },
      { text: "Write a LinkedIn post about [topic]. Personal story angle. End with a controversial take.", tag: "linkedin" },
      { text: "Rewrite this paragraph to be 50% shorter. Keep the core idea. Remove all filler.", tag: "edit" },
      { text: "Write 5 headline variations for [article topic]. Mix curiosity, number, and how-to formats.", tag: "headline" },
      { text: "Write an Instagram caption for [topic/photo]. Conversational, 2-3 lines. 5 hashtags max.", tag: "instagram" },
    ],
    dev: [
      { text: "Review this code for bugs, security issues, and performance bottlenecks. Be blunt.", tag: "review" },
      { text: "Write unit tests for this function. Cover edge cases, null inputs, and error scenarios.", tag: "test" },
      { text: "Explain what this code does in plain English. Assume the reader is non-technical.", tag: "explain" },
      { text: "Write a clear PR description for this change. Include: what changed, why, how to test.", tag: "pr" },
      { text: "Debug this error: [paste error]. Give me the most likely causes and exact fixes.", tag: "debug" },
    ],
    marketing: [
      { text: "Write 3 Facebook ad variations for [product]. Hook + body + CTA. Conversational tone.", tag: "ads" },
      { text: "Write a 5-email welcome sequence for [product]. One goal per email. Short and punchy.", tag: "email-seq" },
      { text: "Write landing page hero copy for [product]. Headline, subheadline, and 3 bullet benefits.", tag: "landing" },
      { text: "Write a Google Ads headline and 3 descriptions for [product/keyword]. Max character limits.", tag: "google-ads" },
      { text: "Write a product description for [product] for [platform]. Focus on benefits, not features.", tag: "copy" },
    ],
  };

  // ── DOM refs ───────────────────────────────────────────────────
  var tblBody        = document.getElementById("tbl-body");
  var emptyState     = document.getElementById("empty-state");
  var newPromptEl    = document.getElementById("new-prompt");
  var tagInputEl     = document.getElementById("tag-input");
  var saveBtnEl      = document.getElementById("save-btn");
  var countPill      = document.getElementById("count-pill");
  var limitBanner    = document.getElementById("limit-banner");
  var limitLabel     = document.getElementById("limit-label");
  var limitFill      = document.getElementById("limit-fill");
  var charCntEl      = document.getElementById("char-cnt");
  var toastEl        = document.getElementById("toast");
  var importResultEl = document.getElementById("import-result");
  var siteHint       = document.getElementById("site-hint");

  var prompts    = [];
  var sortKey    = "uses";
  var sortDir    = "desc";
  var filterSite = "all";
  var addSites   = [];
  var currentScope = "all";

  // ── Toast ──────────────────────────────────────────────────────
  function showToast(msg, type) {
    toastEl.textContent = msg;
    toastEl.className = "toast" + (type ? " " + type : "") + " show";
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function() { toastEl.className = "toast"; }, 2500);
  }

  // ── Tabs ───────────────────────────────────────────────────────
  document.querySelectorAll(".tab").forEach(function(tab) {
    tab.addEventListener("click", function() { switchTab(tab.dataset.tab); });
  });
  function switchTab(name) {
    document.querySelectorAll(".tab, .panel").forEach(function(el) { el.classList.remove("active"); });
    document.querySelector('[data-tab="' + name + '"]').classList.add("active");
    document.getElementById("panel-" + name).classList.add("active");
  }

  // ── Onboarding (slim welcome) ──────────────────────────────────
  function showOnboarding() {
    document.getElementById("onboarding").style.display = "flex";
  }
  function closeOnboarding() {
    document.getElementById("onboarding").style.display = "none";
    Storage.setMeta({ onboarded: true });
  }
  document.getElementById("btn-onb-done") && document.getElementById("btn-onb-done").addEventListener("click", closeOnboarding);
  document.getElementById("btn-onb-howto") && document.getElementById("btn-onb-howto").addEventListener("click", function() {
    closeOnboarding();
    openHowItWorks();
  });

  // ── How It Works manual ────────────────────────────────────────
  function openHowItWorks() {
    var el = document.getElementById("hiw-overlay");
    if (el) el.classList.add("open");
  }
  function closeHowItWorks() {
    var el = document.getElementById("hiw-overlay");
    if (el) el.classList.remove("open");
  }
  document.getElementById("hiw-close") && document.getElementById("hiw-close").addEventListener("click", closeHowItWorks);
  document.getElementById("hiw-upgrade-btn") && document.getElementById("hiw-upgrade-btn").addEventListener("click", function() {
    chrome.tabs.create({ url: CONFIG.STORE_URL });
    closeHowItWorks();
  });
  // Close on overlay click
  document.getElementById("hiw-overlay") && document.getElementById("hiw-overlay").addEventListener("click", function(e) {
    if (e.target === document.getElementById("hiw-overlay")) closeHowItWorks();
  });

  // ── Site selector (Add tab) ────────────────────────────────────
  document.querySelectorAll(".scope-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      document.querySelectorAll(".scope-btn").forEach(function(b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentScope = btn.dataset.scope;
      var sel = document.getElementById("site-selector");
      var block = sel ? sel.closest("div") : null;
      if (currentScope === "pick") {
        if (block) block.style.display = "";
      } else {
        if (block) block.style.display = "none";
        document.querySelectorAll("#site-selector .site-pill").forEach(function(p) { p.classList.remove("active"); });
        addSites = [];
      }
      updateSiteHint();
    });
  });
  (function() {
    var sel = document.getElementById("site-selector");
    if (sel) { var b = sel.closest("div"); if (b) b.style.display = "none"; }
  })();
  document.querySelectorAll("#site-selector .site-pill").forEach(function(pill) {
    pill.addEventListener("click", function() {
      pill.classList.toggle("active");
      addSites = Array.from(document.querySelectorAll("#site-selector .site-pill.active")).map(function(p) { return p.dataset.site; });
      updateSiteHint();
    });
  });
  function updateSiteHint() {
    if (currentScope === "all") {
      siteHint.textContent = "All sites (default)";
      siteHint.style.color = "var(--muted)";
    } else if (currentScope === "this") {
      siteHint.textContent = "Current site only";
      siteHint.style.color = "var(--text)";
    } else {
      if (!addSites.length) {
        siteHint.textContent = "Pick sites above";
        siteHint.style.color = "var(--muted)";
      } else {
        siteHint.textContent = addSites.map(function(s) { return SITE_LABELS[s] || s; }).join(", ") + " only";
        siteHint.style.color = "var(--text)";
      }
    }
  }

  // ── Filter pills ───────────────────────────────────────────────
  document.querySelectorAll(".filter-pill").forEach(function(pill) {
    pill.addEventListener("click", function() {
      document.querySelectorAll(".filter-pill").forEach(function(p) { p.classList.remove("active"); });
      pill.classList.add("active");
      filterSite = pill.dataset.filter;
      renderTable();
    });
  });

  // ── Sort headers ───────────────────────────────────────────────
  document.querySelectorAll(".tbl-head-cell.sort").forEach(function(cell) {
    cell.addEventListener("click", function() {
      var key = cell.dataset.sort;
      if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
      else { sortKey = key; sortDir = key === "uses" ? "desc" : "asc"; }
      updateArrows();
      renderTable();
    });
  });
  function updateArrows() {
    ["text","tag","uses"].forEach(function(k) {
      var el = document.getElementById("sa-" + k);
      if (el) el.textContent = sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "";
    });
  }

  // ── Filter + sort ──────────────────────────────────────────────
  function filteredSorted() {
    var list = prompts;
    if (filterSite !== "all") {
      list = list.filter(function(p) {
        if (!p.sites || !p.sites.length) return true;
        return p.sites.includes(filterSite);
      });
    }
    function cmp(a, b) {
      var va, vb;
      if (sortKey === "text")     { va = a.text.toLowerCase();      vb = b.text.toLowerCase(); }
      else if (sortKey === "tag") { va = (a.tag||"").toLowerCase(); vb = (b.tag||"").toLowerCase(); }
      else                        { va = a.uses||0;                 vb = b.uses||0; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    }
    var pinned   = list.filter(function(p) { return p.pinned; });
    var unpinned = list.filter(function(p) { return !p.pinned; });
    return pinned.sort(cmp).concat(unpinned.sort(cmp));
  }

  // ── Site dots helper ───────────────────────────────────────────
  function makeSiteDots(sites) {
    var wrap = document.createElement("div");
    wrap.className = "cell-sites";
    if (!sites || !sites.length) {
      var lbl = document.createElement("span");
      lbl.className = "site-mini-all";
      lbl.textContent = "All";
      wrap.appendChild(lbl);
    } else {
      sites.forEach(function(s) {
        var dot = document.createElement("span");
        dot.className = "site-mini-dot";
        dot.dataset.site = s;
        dot.title = SITE_LABELS[s] || s;
        wrap.appendChild(dot);
      });
    }
    return wrap;
  }

  function makeSitePillsEditor(currentSites) {
    var wrap = document.createElement("div");
    wrap.className = "site-row";
    wrap.style.marginTop = "2px";
    var lbl = document.createElement("span");
    lbl.className = "site-row-label";
    lbl.textContent = "Show on:";
    wrap.appendChild(lbl);
    ALL_SITES.forEach(function(s) {
      var pill = document.createElement("button");
      pill.type = "button";
      pill.className = "site-pill" + (currentSites.includes(s) ? " active" : "");
      pill.dataset.site = s;
      pill.innerHTML = '<span class="site-dot"></span>' + (SITE_LABELS[s] || s);
      pill.addEventListener("click", function(e) { e.stopPropagation(); pill.classList.toggle("active"); });
      wrap.appendChild(pill);
    });
    wrap.getSelected = function() {
      return Array.from(wrap.querySelectorAll(".site-pill.active")).map(function(p) { return p.dataset.site; });
    };
    return wrap;
  }

  // ── Render table ───────────────────────────────────────────────
  function renderTable() {
    tblBody.innerHTML = "";
    var rows = filteredSorted();
    emptyState.style.display = rows.length ? "none" : "block";

    rows.forEach(function(p) {
      var wrap = document.createElement("div");
      wrap.className = "tbl-row-wrap" + (p.pinned ? " pinned-row" : "");

      var row = document.createElement("div");
      row.className = "tbl-row tbl-cols";

      // Pin or Checkbox (for bulk mode)
      var pinC = document.createElement("button");
      pinC.type = "button";
      if (bulkMode) {
        // Show checkbox instead of pin in bulk mode
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.style.cssText = "width:16px;height:16px;cursor:pointer;";
        checkbox.checked = selectedPrompts.has(p.id);
        checkbox.addEventListener("change", function(e) {
          e.stopPropagation();
          if (e.target.checked) {
            selectedPrompts.add(p.id);
          } else {
            selectedPrompts.delete(p.id);
          }
        });
        pinC = checkbox;
      } else {
        // Normal pin button
        pinC.className = "cell-pin" + (p.pinned ? " is-pinned" : "");
        pinC.textContent = "⭐";
        pinC.title = p.pinned ? "Unpin" : "Pin to top";
        pinC.addEventListener("click", async function(e) {
          e.stopPropagation();
          await Storage.togglePin(p.id);
          await load();
        });
      }
      row.appendChild(pinC);

      // Prompt text
      var promptC = document.createElement("div");
      promptC.className = "cell-prompt";
      var pText = document.createElement("div");
      pText.className = "cell-prompt-text";
      pText.textContent = p.text;
      pText.title = "Click to expand";
      pText.addEventListener("click", function(e) {
        e.stopPropagation();
        if (wrap.classList.contains("editing")) return;
        wrap.classList.toggle("expanded");
      });
      var ta = document.createElement("textarea");
      ta.className = "cell-edit-ta";
      ta.value = p.text; ta.rows = 3;
      ta.addEventListener("input", function() {
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
      });
      promptC.appendChild(pText);
      promptC.appendChild(ta);
      row.appendChild(promptC);

      // Tag
      var tagC = document.createElement("div");
      if (p.tag) {
        var tagPill = document.createElement("span");
        tagPill.className = "cell-tag-pill";
        tagPill.textContent = p.tag;
        tagC.appendChild(tagPill);
      }
      row.appendChild(tagC);

      // Sites
      row.appendChild(makeSiteDots(p.sites || []));

      // Uses
      var usesC = document.createElement("div");
      usesC.className = "cell-uses" + ((p.uses||0) === 0 ? " zero" : "");
      usesC.textContent = (p.uses||0) === 0 ? "—" : p.uses;
      row.appendChild(usesC);

      // Actions
      var actC = document.createElement("div");
      actC.className = "cell-actions";
      var editBtn = document.createElement("button");
      editBtn.type = "button"; editBtn.className = "btn-icon"; editBtn.title = "Edit";
      editBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      var delBtn = document.createElement("button");
      delBtn.type = "button"; delBtn.className = "btn-icon del"; delBtn.title = "Delete";
      delBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
      actC.appendChild(editBtn);
      actC.appendChild(delBtn);
      row.appendChild(actC);

      // Edit bar
      var editBar = document.createElement("div");
      editBar.className = "edit-bar";

      // Tag input in edit bar
      var tagRow = document.createElement("div");
      tagRow.style.cssText = "display:flex;align-items:center;gap:6px;";
      var tagLbl = document.createElement("span");
      tagLbl.style.cssText = "font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0;";
      tagLbl.textContent = "Tag:";
      var tagIn = document.createElement("input");
      tagIn.type = "text";
      tagIn.style.cssText = "flex:1;max-width:120px;padding:4px 8px;border:1px solid rgba(0,0,0,0.15);border-radius:6px;font-size:11.5px;font-family:inherit;outline:none;";
      tagIn.value = p.tag || "";
      tagIn.placeholder = "e.g. email";
      tagIn.maxLength = 30;
      tagRow.appendChild(tagLbl);
      tagRow.appendChild(tagIn);
      editBar.appendChild(tagRow);

      // Site pills
      var sitePillsEditor = makeSitePillsEditor(p.sites || []);
      editBar.appendChild(sitePillsEditor);

      // Version history chips
      if (p.history && p.history.length > 0) {
        var histRow = document.createElement("div");
        histRow.style.cssText = "display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:2px;padding-top:4px;border-top:1px solid rgba(0,0,0,0.06);";
        var histLbl = document.createElement("span");
        histLbl.style.cssText = "font-size:10px;font-weight:700;color:rgba(0,0,0,0.35);text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0;";
        histLbl.textContent = "History:";
        histRow.appendChild(histLbl);
        p.history.forEach(function(h, idx) {
          var chip = document.createElement("button");
          chip.type = "button";
          chip.style.cssText = "padding:2px 8px;border:1px solid rgba(0,0,0,0.12);border-radius:20px;font-size:10.5px;cursor:pointer;background:rgba(0,0,0,0.03);color:rgba(0,0,0,0.5);font-family:inherit;white-space:nowrap;";
          var d = new Date(h.saved_at);
          chip.textContent = "v" + (p.history.length - idx) + " · " + d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
          chip.title = h.text;
          chip.addEventListener("click", async function(e) {
            e.stopPropagation();
            var preview = h.text.length > 100 ? h.text.slice(0, 100) + "…" : h.text;
            if (!confirm("Restore this version?\n\n" + preview)) return;
            var r = await Storage.restoreVersion(p.id, idx);
            if (r.ok) { await load(); showToast("✓ Version restored"); }
            else showToast("Could not restore", "error");
          });
          histRow.appendChild(chip);
        });
        editBar.appendChild(histRow);
      }

      // Save / Cancel buttons
      var btns = document.createElement("div");
      btns.className = "edit-bar-btns";
      var saveB   = document.createElement("button"); saveB.type = "button"; saveB.className = "btn btn-primary btn-sm"; saveB.textContent = "Save";
      var cancelB = document.createElement("button"); cancelB.type = "button"; cancelB.className = "btn btn-ghost btn-sm"; cancelB.textContent = "Cancel";
      btns.appendChild(saveB); btns.appendChild(cancelB);
      editBar.appendChild(btns);

      // Edit button
      editBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        tblBody.querySelectorAll(".tbl-row-wrap.editing").forEach(function(w) { w.classList.remove("editing", "expanded"); });
        wrap.classList.remove("expanded");
        wrap.classList.add("editing");
        ta.value = p.text;
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
        requestAnimationFrame(function() { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); });
      });

      saveB.addEventListener("click", async function(e) {
        e.stopPropagation();
        var newText  = ta.value.trim();
        var newTag   = tagIn.value.trim();
        var newSites = sitePillsEditor.getSelected();
        if (!newText) { showToast("Cannot be empty", "error"); return; }
        var r = await Storage.update(p.id, newText, newTag, newSites);
        if (r.ok) {
          await load();
          showToast("✓ Updated");
        } else if (r.reason === "toolong") {
          showToast("Too long (max " + r.limit + " chars)", "error");
        } else {
          showToast("Could not save", "error");
        }
      });

      cancelB.addEventListener("click", function(e) {
        e.stopPropagation();
        wrap.classList.remove("editing");
        ta.value = p.text;
      });

      delBtn.addEventListener("click", async function(e) {
        e.stopPropagation();
        await Storage.remove(p.id);
        await load();
        showToast("Deleted");
      });

      wrap.appendChild(row);
      wrap.appendChild(editBar);
      tblBody.appendChild(wrap);
    });
  }

  // ── Render meta / stats ────────────────────────────────────────
  async function renderMeta() {
    var MAX = Storage.MAX_PROMPTS;
    var full = prompts.length >= MAX;
    var pct  = Math.round((prompts.length / MAX) * 100);

    countPill.textContent = prompts.length + " / " + MAX;
    countPill.classList.toggle("full", full);

    if (full) {
      limitBanner.innerHTML = "<strong>" + prompts.length + "/" + MAX + " prompts saved.</strong> Delete some to free up space.";
      limitBanner.classList.add("show");
    } else {
      limitBanner.classList.remove("show");
    }

    limitLabel.textContent = prompts.length + " of " + MAX + " saved";
    limitFill.style.width  = pct + "%";
    limitFill.classList.toggle("full", full);
    saveBtnEl.disabled = full;

    var meta      = await Storage.getMeta();
    var totalUses = meta.totalUses || 0;
    var mostUsed  = prompts.length
      ? prompts.slice().sort(function(a, b) { return (b.uses||0) - (a.uses||0); })[0]
      : null;

    document.getElementById("stat-count").textContent = prompts.length;
    document.getElementById("stat-uses").textContent  = totalUses;
    document.getElementById("stat-most").textContent  =
      mostUsed && (mostUsed.uses||0) > 0
        ? mostUsed.text.slice(0, 38) + (mostUsed.text.length > 38 ? "…" : "")
        : "—";
  }

  // ── Load ───────────────────────────────────────────────────────
  async function load() {
    prompts = await Storage.getAll();
    await renderMeta();
    renderTable();
    updateArrows();
  }

  // ── Char counter ───────────────────────────────────────────────
  newPromptEl.addEventListener("input", function() {
    var len  = newPromptEl.value.length;
    charCntEl.textContent = len + " chars";
    saveBtnEl.disabled = prompts.length >= Storage.MAX_PROMPTS || !newPromptEl.value.trim();
  });

  // ── Save prompt ────────────────────────────────────────────────
  saveBtnEl.addEventListener("click", async function() {
    var text = newPromptEl.value.trim();
    var tag  = tagInputEl.value.trim();
    if (!text) { showToast("Enter a prompt first", "error"); return; }

    var simBanner = document.getElementById("sim-banner");
    if (simBanner) simBanner.remove();

    var sitesToSave = [];
    if (currentScope === "all") {
      sitesToSave = [];
    } else if (currentScope === "this") {
      var meta = await Storage.getMeta();
      sitesToSave = meta.lastSite ? [meta.lastSite] : [];
    } else {
      sitesToSave = addSites;
    }

    var r = await Storage.save(text, tag, sitesToSave);

    if (r.ok) {
      newPromptEl.value = ""; tagInputEl.value = "";
      charCntEl.textContent = "0 chars";
      charCntEl.classList.remove("warn");
      await load();
      showToast("✓ Saved");
      switchTab("prompts");
      // Review nudge — show after 3 days from install AND at least 1 use
      var metaCheck = await Storage.getMeta();
      var installAge = Date.now() - (metaCheck.firstInstall || Date.now());
      var threeDays  = CONFIG.REVIEW_NUDGE_DAYS * 24 * 60 * 60 * 1000;
      if (installAge >= threeDays && (metaCheck.totalUses || 0) >= 1 && !metaCheck.reviewNudgeSent) {
        Storage.setMeta({ reviewNudgeSent: true });
        setTimeout(showReviewNudge, 1000);
      }

    } else if (r.reason === "duplicate") {
      showToast("Already saved", "error");

    } else if (r.reason === "similar") {
      var banner = document.createElement("div");
      banner.id = "sim-banner";
      banner.style.cssText = "font-size:11.5px;background:rgba(255,200,0,0.08);border:1px solid rgba(200,150,0,0.2);border-radius:9px;padding:9px 11px;line-height:1.5;margin-top:4px";
      
      // Create warning text safely
      var warningStrong = document.createElement("strong");
      warningStrong.style.color = "#7a5000";
      warningStrong.textContent = "⚠️ Similar exists:";
      banner.appendChild(warningStrong);
      
      var br = document.createElement("br");
      banner.appendChild(br);
      
      // Create preview text safely
      var previewSpan = document.createElement("span");
      previewSpan.style.cssText = "color:rgba(0,0,0,0.45);font-size:11px";
      var prev = r.match.text.slice(0, 80) + (r.match.text.length > 80 ? "…" : "");
      previewSpan.textContent = prev;
      banner.appendChild(previewSpan);
      
      // Create button container
      var btnDiv = document.createElement("div");
      btnDiv.style.cssText = "display:flex;gap:6px;margin-top:8px";
      
      // Save anyway button
      var saveBtn = document.createElement("button");
      saveBtn.className = "btn btn-primary btn-sm";
      saveBtn.id = "sim-y";
      saveBtn.textContent = "Save anyway";
      
      // Cancel button
      var cancelBtn = document.createElement("button");
      cancelBtn.className = "btn btn-ghost btn-sm";
      cancelBtn.id = "sim-n";
      cancelBtn.textContent = "Cancel";
      
      btnDiv.appendChild(saveBtn);
      btnDiv.appendChild(cancelBtn);
      banner.appendChild(btnDiv);
      
      document.querySelector(".add-area").appendChild(banner);
      document.getElementById("sim-y").onclick = async function() {
        banner.remove();
        var r2 = await Storage.forceSave(text, tag, sitesToSave);
        if (r2.ok) {
          newPromptEl.value = ""; tagInputEl.value = "";
          charCntEl.textContent = "0 chars";
          await load(); showToast("✓ Saved"); switchTab("prompts");
        } else showToast("Could not save", "error");
      };
      document.getElementById("sim-n").onclick = function() { banner.remove(); };

    } else if (r.reason === "limit") {
      showToast("25 prompt limit reached — delete some or upgrade to Pro", "error");
    }
  });

  newPromptEl.addEventListener("keydown", function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") saveBtnEl.click();
  });

  // ── Review nudge ───────────────────────────────────────────────
  function showReviewNudge() {
    var nudge = document.createElement("div");
    nudge.style.cssText = "position:fixed;bottom:50px;left:50%;transform:translateX(-50%);background:#0a0a0a;color:#fff;font-size:12px;padding:10px 16px;border-radius:12px;z-index:9998;white-space:nowrap;display:flex;align-items:center;gap:10px;box-shadow:0 4px 14px rgba(0,0,0,0.2);font-family:-apple-system,sans-serif;";
    nudge.innerHTML = '<span>⭐ Enjoying Prompt Autocomplete?</span><button id="nudge-rate" style="padding:4px 12px;background:#f59e0b;color:#fff;border:none;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">Rate it ⭐</button><button id="nudge-close" style="background:none;border:none;color:rgba(255,255,255,0.5);cursor:pointer;font-size:14px;padding:0 4px;">×</button>';
    document.body.appendChild(nudge);
    document.getElementById("nudge-rate").addEventListener("click", function() {
      chrome.tabs.create({ url: CONFIG.STORE_URL });
      nudge.remove();
    });
    document.getElementById("nudge-close").addEventListener("click", function() { nudge.remove(); });
    setTimeout(function() { if (nudge.parentNode) nudge.remove(); }, 8000);
  }

  // ── Import / Packs ─────────────────────────────────────────────
  var importDrop = document.getElementById("import-drop");
  var importFile = document.getElementById("import-file");

  importDrop.addEventListener("click", function() { importFile.click(); });
  importDrop.addEventListener("dragover", function(e) { e.preventDefault(); importDrop.classList.add("drag-over"); });
  importDrop.addEventListener("dragleave", function() { importDrop.classList.remove("drag-over"); });
  importDrop.addEventListener("drop", function(e) {
    e.preventDefault(); importDrop.classList.remove("drag-over");
    var f = e.dataTransfer.files[0]; if (f) readFile(f);
  });
  importFile.addEventListener("change", function(e) {
    if (e.target.files[0]) readFile(e.target.files[0]);
    importFile.value = "";
  });

  function readFile(file) {
    var reader = new FileReader();
    reader.onload = async function(e) {
      try {
        var raw = JSON.parse(e.target.result);
        await doImport(Array.isArray(raw) ? raw : (raw.prompts || []));
      } catch (_) { showImportResult("❌ Invalid JSON file", false); }
    };
    reader.readAsText(file);
  }

  document.getElementById("import-url-btn").addEventListener("click", async function() {
    var url = document.getElementById("import-url").value.trim();
    if (!url) return;
    
    // URL validation - only allow http/https protocols
    try {
      var urlObj = new URL(url);
      if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
        showImportResult("❌ Only HTTP/HTTPS URLs are allowed", false);
        return;
      }
      // Block localhost and private IPs
      var hostname = urlObj.hostname.toLowerCase();
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.")) {
        showImportResult("❌ Cannot fetch from private networks", false);
        return;
      }
    } catch (e) {
      showImportResult("❌ Invalid URL", false);
      return;
    }
    
    showImportResult("Loading…", true);
    
    // Create abort controller for timeout
    var controller = new AbortController();
    var timeoutId = setTimeout(function() {
      controller.abort();
    }, 10000); // 10 second timeout
    
    try {
      var raw;
      if (url.includes("?data=")) {
        var b64 = url.split("?data=")[1];
        if (!b64 || b64.length > 100000) { // Limit size
          throw new Error("Invalid data parameter");
        }
        // Validate base64 before decoding
        if (!/^[A-Za-z0-9+/=_-]+$/.test(b64)) {
          throw new Error("Invalid base64 data");
        }
        raw = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), function(c) { return c.charCodeAt(0); })));
      } else {
        var resp = await fetch(url, {
          signal: controller.signal,
          headers: { "Accept": "application/json" }
        });
        clearTimeout(timeoutId);
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        // Validate content type
        var contentType = resp.headers.get("content-type");
        if (contentType && !contentType.includes("json")) {
          console.warn("Unexpected content-type:", contentType);
        }
        raw = await resp.json();
      }
      clearTimeout(timeoutId);
      await doImport(Array.isArray(raw) ? raw : (raw.prompts || []));
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        showImportResult("❌ Request timed out", false);
      } else {
        showImportResult("❌ " + err.message, false);
      }
    }
  });

  document.querySelectorAll(".pack-load-btn").forEach(function(btn) {
    btn.addEventListener("click", async function() {
      await doImport(PACKS[btn.closest(".pack-item").dataset.pack] || []);
    });
  });

  async function doImport(items) {
    if (!items || !items.length) { showImportResult("❌ No prompts found", false); return; }
    var result = await Storage.importPack(items);
    await load();
    var msg = result.added
      ? "✓ Added " + result.added + " prompt" + (result.added === 1 ? "" : "s") + (result.skipped ? " (" + result.skipped + " skipped)" : "")
      : "Nothing new — all already exist or limit reached";
    showImportResult(msg, result.added > 0);
    if (result.added > 0) setTimeout(function() { switchTab("prompts"); }, 1400);
  }

  function showImportResult(msg, ok) {
    importResultEl.textContent = msg;
    importResultEl.className = "import-result show " + (ok ? "ok" : "err");
    clearTimeout(importResultEl._t);
    importResultEl._t = setTimeout(function() { importResultEl.classList.remove("show"); }, 4000);
  }

  // ── Footer buttons ─────────────────────────────────────────────
  document.getElementById("btn-rate") && document.getElementById("btn-rate").addEventListener("click", function() {
    chrome.tabs.create({ url: CONFIG.STORE_URL });
  });
  document.getElementById("btn-feedback") && document.getElementById("btn-feedback").addEventListener("click", function() {
    chrome.tabs.create({ url: CONFIG.FEEDBACK_URL });
  });
  document.getElementById("btn-how-it-works") && document.getElementById("btn-how-it-works").addEventListener("click", function() {
    openHowItWorks();
  });

  // ── Export functionality ───────────────────────────────────────
  async function exportPrompts() {
    try {
      var exportData = await Storage.exportAll();
      var json = JSON.stringify(exportData, null, 2);
      var blob = new Blob([json], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      
      var a = document.createElement("a");
      a.href = url;
      a.download = "prompt-autocomplete-backup-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      Analytics.trackExport(prompts.length);
      showToast("✓ Exported " + prompts.length + " prompts");
    } catch (err) {
      showToast("Export failed", "error");
    }
  }

  // Add export button listener if element exists
  document.getElementById("btn-export") && document.getElementById("btn-export").addEventListener("click", exportPrompts);

  // ── Search functionality ────────────────────────────────────────
  var searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", function() {
      renderTable();
    });
  }

  // Update filteredSorted to include search
  var originalFilteredSorted = filteredSorted;
  filteredSorted = function() {
    var list = prompts;
    
    // Apply site filter
    if (filterSite !== "all") {
      list = list.filter(function(p) {
        if (!p.sites || !p.sites.length) return true;
        return p.sites.includes(filterSite);
      });
    }
    
    // Apply search filter
    if (searchInput && searchInput.value.trim()) {
      var query = searchInput.value.trim().toLowerCase();
      list = list.filter(function(p) {
        return p.text.toLowerCase().includes(query) || 
               (p.tag && p.tag.toLowerCase().includes(query));
      });
    }
    
    function cmp(a, b) {
      var va, vb;
      if (sortKey === "text")     { va = a.text.toLowerCase();      vb = b.text.toLowerCase(); }
      else if (sortKey === "tag") { va = (a.tag||"").toLowerCase(); vb = (b.tag||"").toLowerCase(); }
      else                        { va = a.uses||0;                 vb = b.uses||0; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    }
    var pinned   = list.filter(function(p) { return p.pinned; });
    var unpinned = list.filter(function(p) { return !p.pinned; });
    return pinned.sort(cmp).concat(unpinned.sort(cmp));
  };

  // ── Bulk operations ─────────────────────────────────────────────
  var selectedPrompts = new Set();
  var bulkMode = false;

  function toggleBulkMode() {
    bulkMode = !bulkMode;
    selectedPrompts.clear();
    renderTable();
    
    var bulkBar = document.getElementById("bulk-bar");
    if (bulkBar) {
      bulkBar.style.display = bulkMode ? "flex" : "none";
    }
    
    if (bulkMode) {
      showToast("Select prompts to delete (use checkboxes)");
    }
  }

  async function deleteSelected() {
    if (selectedPrompts.size === 0) {
      showToast("No prompts selected", "error");
      return;
    }
    
    if (!confirm("Delete " + selectedPrompts.size + " selected prompt" + (selectedPrompts.size === 1 ? "" : "s") + "?")) {
      return;
    }
    
    var result = await Storage.removeMultiple(Array.from(selectedPrompts));
    if (result.ok) {
      selectedPrompts.clear();
      await load();
      showToast("✓ Deleted " + result.removed + " prompts");
      if (bulkMode) toggleBulkMode();
    } else {
      showToast("Delete failed", "error");
    }
  }

  document.getElementById("btn-bulk-mode") && document.getElementById("btn-bulk-mode").addEventListener("click", toggleBulkMode);
  document.getElementById("btn-bulk-delete") && document.getElementById("btn-bulk-delete").addEventListener("click", deleteSelected);
  document.getElementById("btn-bulk-cancel") && document.getElementById("btn-bulk-cancel").addEventListener("click", toggleBulkMode);

  // ── Backup / Restore ──────────────────────────────────────────
  async function createBackup() {
    var result = await Storage.createBackup();
    if (result.ok) {
      Analytics.trackBackupCreated(prompts.length);
      showToast("✓ Backup created to sync storage");
    } else {
      showToast("Backup failed: " + result.reason, "error");
    }
  }

  async function restoreBackup() {
    var result = await Storage.restoreFromBackup();
    if (result.ok) {
      Analytics.trackBackupRestored(result.restored);
      await load();
      showToast("✓ Restored " + result.restored + " prompts from backup");
    } else {
      showToast("Restore failed: " + result.reason, "error");
    }
  }

  document.getElementById("btn-backup") && document.getElementById("btn-backup").addEventListener("click", createBackup);
  document.getElementById("btn-restore") && document.getElementById("btn-restore").addEventListener("click", restoreBackup);

  // ── Keyboard navigation ─────────────────────────────────────────
  var focusedRowIndex = -1;
  
  document.addEventListener("keydown", function(e) {
    // Only handle keyboard nav when prompts panel is active
    var promptsPanel = document.getElementById("panel-prompts");
    if (!promptsPanel || !promptsPanel.classList.contains("active")) return;
    
    var rows = tblBody.querySelectorAll(".tbl-row-wrap");
    if (!rows.length) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusedRowIndex = Math.min(focusedRowIndex + 1, rows.length - 1);
      if (focusedRowIndex < 0) focusedRowIndex = 0;
      focusRow(rows[focusedRowIndex]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusedRowIndex = Math.max(focusedRowIndex - 1, 0);
      focusRow(rows[focusedRowIndex]);
    } else if (e.key === "Enter" && focusedRowIndex >= 0) {
      e.preventDefault();
      // Toggle expand on the focused row
      rows[focusedRowIndex].classList.toggle("expanded");
    } else if (e.key === "Delete" && focusedRowIndex >= 0 && !bulkMode) {
      e.preventDefault();
      // Trigger delete on focused row
      var delBtn = rows[focusedRowIndex].querySelector(".btn-icon.del");
      if (delBtn) delBtn.click();
    } else if (e.key === "Escape") {
      // Close any editing mode
      if (bulkMode) {
        toggleBulkMode();
      } else {
        // Close any expanded rows
        rows.forEach(function(row) { row.classList.remove("expanded", "editing"); });
      }
      focusedRowIndex = -1;
    }
  });

  function focusRow(row) {
    // Remove focus from all rows
    tblBody.querySelectorAll(".tbl-row-wrap").forEach(function(r) {
      r.style.background = "";
    });
    // Add focus indicator
    row.style.background = "rgba(0,0,0,0.03)";
    row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Reset focused index when switching tabs
  document.querySelectorAll(".tab").forEach(function(tab) {
    tab.addEventListener("click", function() {
      focusedRowIndex = -1;
    });
  });

  // ── Pro License & Paywall ─────────────────────────────────────
  
  // License modal elements
  var licenseModal = document.getElementById("license-modal");
  var licenseKeyInput = document.getElementById("license-key-input");
  var licenseError = document.getElementById("license-error");
  var licenseSuccess = document.getElementById("license-success");
  var proBadge = document.getElementById("pro-badge");
  
  // Paywall elements
  var paywallModal = document.getElementById("paywall-modal");
  
  // Check Pro status and update UI
  async function checkProStatus() {
    var isPro = await License.isPro();
    if (isPro) {
      proBadge.style.display = "block";
      // Hide paywall triggers
      paywallModal.style.display = "none";
      // Show backup/restore buttons for Pro users
      var btnBackup = document.getElementById("btn-backup");
      var btnRestore = document.getElementById("btn-restore");
      if (btnBackup) {
        btnBackup.style.display = "inline-flex";
      }
      if (btnRestore) {
        btnRestore.style.display = "inline-flex";
      }
    } else {
      proBadge.style.display = "none";
      // Hide backup/restore buttons for free users
      var btnBackup = document.getElementById("btn-backup");
      var btnRestore = document.getElementById("btn-restore");
      if (btnBackup) {
        btnBackup.style.display = "none";
      }
      if (btnRestore) {
        btnRestore.style.display = "none";
      }
    }
    return isPro;
  }
  
  // Show paywall when hitting 25 prompt limit
  function showPaywall() {
    paywallModal.style.display = "flex";
    Analytics.trackPaywallShown();
  }
  
  function hidePaywall() {
    paywallModal.style.display = "none";
  }
  
  // Show license activation modal
  function showLicenseModal() {
    licenseModal.style.display = "flex";
    licenseKeyInput.value = "";
    licenseError.style.display = "none";
    licenseSuccess.style.display = "none";
    licenseKeyInput.focus();
  }
  
  function hideLicenseModal() {
    licenseModal.style.display = "none";
  }
  
  // Activate license with retry support
  async function activateLicense() {
    var key = licenseKeyInput.value.trim();
    if (!key) return;
    
    // Show loading state
    var btn = document.getElementById("btn-activate-license");
    var originalText = btn.textContent;
    btn.textContent = "Verifying...";
    btn.disabled = true;
    
    var result = await License.activate(key);
    
    // Restore button
    btn.textContent = originalText;
    btn.disabled = false;
    
    if (result.success) {
      licenseError.style.display = "none";
      licenseSuccess.style.display = "block";
      proBadge.style.display = "block";
      Analytics.trackLicenseActivated();
      
      // Show full success screen
      setTimeout(function() {
        hideLicenseModal();
        showSuccessScreen();
        load(); // Reload to unlock Pro features
      }, 1000);
    } else {
      licenseSuccess.style.display = "none";
      
      // Show error with retry button if needed
      if (result.retry) {
        licenseError.innerHTML = result.message + '<br><button id="btn-retry-activate" style="margin-top:8px;padding:6px 12px;font-size:11px;border-radius:6px;border:none;background:#10a37f;color:#fff;cursor:pointer;">Retry</button>';
        document.getElementById("btn-retry-activate")?.addEventListener("click", activateLicense);
      } else {
        licenseError.textContent = result.message;
      }
      licenseError.style.display = "block";
    }
  }
  
  // Restore existing license (for returning users)
  async function restoreLicense() {
    var btn = document.getElementById("btn-restore-license");
    var originalText = btn.textContent;
    btn.textContent = "Restoring...";
    btn.disabled = true;
    
    var result = await License.restoreLicense();
    
    btn.textContent = originalText;
    btn.disabled = false;
    
    if (result.success) {
      licenseError.style.display = "none";
      licenseSuccess.textContent = "✓ " + result.message;
      licenseSuccess.style.display = "block";
      proBadge.style.display = "block";
      
      setTimeout(function() {
        hideLicenseModal();
        load();
      }, 1500);
    } else {
      licenseSuccess.style.display = "none";
      
      if (result.retry) {
        licenseError.innerHTML = result.message + '<br><button id="btn-retry-restore" style="margin-top:8px;padding:6px 12px;font-size:11px;border-radius:6px;border:none;background:#10a37f;color:#fff;cursor:pointer;">Retry</button>';
        document.getElementById("btn-retry-restore")?.addEventListener("click", restoreLicense);
      } else {
        licenseError.textContent = result.message;
      }
      licenseError.style.display = "block";
    }
  }
  
  // Show post-payment success screen
  function showSuccessScreen() {
    var successScreen = document.getElementById("success-screen");
    if (successScreen) {
      successScreen.style.display = "flex";
    }
  }
  
  // Close success screen
  function hideSuccessScreen() {
    var successScreen = document.getElementById("success-screen");
    if (successScreen) {
      successScreen.style.display = "none";
    }
  }
  
  // Event listeners for license modal
  document.getElementById("btn-activate-license") && document.getElementById("btn-activate-license").addEventListener("click", activateLicense);
  document.getElementById("btn-cancel-license") && document.getElementById("btn-cancel-license").addEventListener("click", hideLicenseModal);
  document.getElementById("btn-restore-license") && document.getElementById("btn-restore-license").addEventListener("click", restoreLicense);
  document.getElementById("link-buy-pro") && document.getElementById("link-buy-pro").addEventListener("click", function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: CONFIG.DODO_CHECKOUT_URL });
    Analytics.trackCheckoutOpened();
  });
  
  // Paywall event listeners
  document.getElementById("btn-upgrade-pro") && document.getElementById("btn-upgrade-pro").addEventListener("click", function() {
    chrome.tabs.create({ url: CONFIG.DODO_CHECKOUT_URL });
    Analytics.trackCheckoutOpened();
    hidePaywall();
  });
  document.getElementById("btn-dismiss-paywall") && document.getElementById("btn-dismiss-paywall").addEventListener("click", hidePaywall);
  document.getElementById("link-have-license") && document.getElementById("link-have-license").addEventListener("click", function(e) {
    e.preventDefault();
    hidePaywall();
    showLicenseModal();
  });
  
  // Close modals on Escape
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      hideLicenseModal();
      hidePaywall();
    }
  });
  
  // Click outside to close
  licenseModal && licenseModal.addEventListener("click", function(e) {
    if (e.target === licenseModal) hideLicenseModal();
  });
  paywallModal && paywallModal.addEventListener("click", function(e) {
    if (e.target === paywallModal) hidePaywall();
  });
  
  // Success screen close button
  document.getElementById("btn-close-success") && document.getElementById("btn-close-success").addEventListener("click", hideSuccessScreen);
  
  // ── Gate Pro Features ─────────────────────────────────────────
  
  // Add upgrade nudge in footer before hitting limit
  function updateUpgradeNudge() {
    var nudgeEl = document.getElementById('upgrade-nudge');
    if (!nudgeEl) {
      nudgeEl = document.createElement('div');
      nudgeEl.id = 'upgrade-nudge';
      nudgeEl.style.cssText = 'text-align:center;padding:8px 12px;font-size:11px;color:#64748b;background:#f8fafc;border-radius:8px;margin:8px 16px 12px;';
      var footer = document.querySelector('.footer');
      if (footer) footer.insertBefore(nudgeEl, footer.firstChild);
    }
    
    Storage.getAll().then(function(prompts) {
      var count = prompts.length;
      if (count < CONFIG.MAX_PROMPTS_FREE && count >= 20) {
        nudgeEl.innerHTML = 'Saving prompt ' + count + ' of 25 free. <a href="#" id="link-go-unlimited" style="color:#10a37f;font-weight:600;">Go unlimited for $7 →</a>';
        nudgeEl.style.display = 'block';
        document.getElementById('link-go-unlimited')?.addEventListener('click', function(e) {
          e.preventDefault();
          showPaywall();
        });
      } else if (count >= CONFIG.MAX_PROMPTS_FREE) {
        nudgeEl.innerHTML = '<strong>25 prompts saved.</strong> You\'ve hit the free limit. <a href="#" id="link-go-unlimited" style="color:#10a37f;font-weight:600;">Go unlimited for $7 →</a>';
        nudgeEl.style.display = 'block';
        document.getElementById('link-go-unlimited')?.addEventListener('click', function(e) {
          e.preventDefault();
          showPaywall();
        });
      } else {
        nudgeEl.style.display = 'none';
      }
    });
  }
  
  // Override save to show paywall at 25 prompts for free users
  var originalSaveHandler = saveBtnEl.onclick;
  saveBtnEl.addEventListener("click", async function(e) {
    var prompts = await Storage.getAll();
    var maxPrompts = await Storage.getMaxPrompts();
    
    if (prompts.length >= CONFIG.MAX_PROMPTS_FREE && !(await License.isPro())) {
      // Show paywall immediately when limit reached
      showPaywall();
      // Also show toast for feedback
      showToast("You've saved 25 prompts. Upgrade for unlimited.", "error");
      return;
    }
    
    // Continue with original save logic (handled by existing listener)
  });
  
  // Update Pro badge display
  async function updateProBadge() {
    var badge = document.getElementById('pro-badge');
    if (!badge) return;
    
    if (await License.isPro()) {
      badge.style.display = 'block';
      badge.innerHTML = '⚡ Pro · Unlimited · Chrome Synced';
      badge.style.fontSize = '9px';
      badge.style.padding = '3px 8px';
    } else {
      badge.style.display = 'none';
    }
  }
  
  // Export button (Pro feature)
  document.getElementById("btn-export") && document.getElementById("btn-export").addEventListener("click", function() {
    exportPrompts();
  });
  
  // Backup button (Pro feature - instant Chrome sync backup)
  document.getElementById("btn-backup") && document.getElementById("btn-backup").addEventListener("click", function() {
    createBackup();
  });
  
  // Restore button (Pro feature - restore from Chrome sync)
  document.getElementById("btn-restore") && document.getElementById("btn-restore").addEventListener("click", function() {
    restoreBackup();
  });
  
  // ── Init ───────────────────────────────────────────────────────
  Storage.maybeInit().then(async function() {
    await checkProStatus();
    await load();
    await updateProBadge();
    updateUpgradeNudge();

    // Show onboarding on first install
    var meta = await Storage.getMeta();
    if (meta.onboarded === false) {
      showOnboarding();
    }
  });

})();
