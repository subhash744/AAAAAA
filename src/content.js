// content.js — 50 AI sites

(function () {
  "use strict";

  let inputEl       = null;
  let debounceTimer = null;
  let injected      = false;
  let lastSentText  = "";

  /* ── Detect current site ──────────────────────────────────────── */
  function getSite() {
    const h = location.hostname.replace(/^www\./, "");
    const p = location.pathname;

    // AI Chat
    if (h === "claude.ai")                      return "claude";
    if (h === "gemini.google.com")              return "gemini";
    if (h === "grok.com" || (h === "x.com" && p.startsWith("/i/grok"))) return "grok";
    if (h === "copilot.microsoft.com")          return "copilot";
    if (h === "chat.deepseek.com")              return "deepseek";
    if (h === "perplexity.ai")                  return "perplexity";
    if (h === "meta.ai" || h === "www.meta.ai") return "metaai";
    if (h === "chat.mistral.ai")                return "mistral";
    if (h === "you.com")                        return "youcom";
    if (h === "pi.ai")                          return "pi";
    if (h === "huggingface.co")                 return "huggingchat";
    if (h === "coral.cohere.com")               return "cohere";
    if (h === "groq.com")                       return "groq";
    if (h === "openrouter.ai")                  return "openrouter";
    if (h === "aistudio.google.com")            return "aistudio";
    if (h === "notebooklm.google.com")          return "notebooklm";

    // Image Gen
    if (h === "midjourney.com")                 return "midjourney";
    if (h === "leonardo.ai")                    return "leonardo";
    if (h === "ideogram.ai")                    return "ideogram";
    if (h === "reve.art")                       return "reve";
    if (h === "dreamstudio.stability.ai")       return "dreamstudio";
    if (h === "designer.microsoft.com")         return "designer";
    if (h === "freepik.com")                    return "freepik";
    if (h === "nightcafe.studio")               return "nightcafe";
    if (h === "krea.ai")                        return "krea";
    if (h === "firefly.adobe.com")              return "firefly";
    if (h === "stability.ai")                   return "stability";
    if (h === "playground.com")                 return "playground";
    if (h === "lexica.art")                     return "lexica";
    if (h === "tensor.art")                     return "tensor";
    if (h === "bing.com" && p.includes("/images/create")) return "bingimage";

    // Video Gen
    if (h === "runwayml.com")                   return "runway";
    if (h === "sora.com")                       return "sora";
    if (h === "heygen.com")                     return "heygen";
    if (h === "synthesia.io")                   return "synthesia";
    if (h === "pika.art")                       return "pika";
    if (h === "klingai.com")                    return "kling";
    if (h === "invideo.ai")                     return "invideo";
    if (h === "hailuoai.com")                   return "hailuo";
    if (h === "lumalabs.ai")                    return "luma";
    if (h === "pictory.ai")                     return "pictory";
    if (h === "veed.io")                        return "veed";
    if (h === "capcut.com")                     return "capcut";
    if (h === "descript.com")                   return "descript";
    if (h === "fliki.ai")                       return "fliki";
    if (h === "clipchamp.com")                  return "clipchamp";
    if (h === "kaiber.ai")                      return "kaiber";

    // AI Dev / Vibe Coding
    if (h === "lovable.dev" || h === "app.lovable.dev") return "lovable";
    if (h === "bolt.new" || h === "stackblitz.com")     return "bolt";
    if (h === "app.emergent.sh")                        return "emergent";
    if (h === "v0.dev" || h === "v0.app")               return "v0";
    if (h === "anything.com" || h === "www.anything.com")  return "anything";
    if (h === "rork.com")                                  return "rork";

    // Fallback to chatgpt if no match - track this for debugging
    const detectedHostname = location.hostname.replace(/^www\./, "");
    Analytics.trackSessionStart(0, 0); // Track that we had to fallback
    console.warn("[Prompt Autocomplete] Unknown site detected, falling back to chatgpt mode:", detectedHostname);
    
    return "chatgpt"; // chat.openai.com / chatgpt.com fallback
  }

  const SITE = getSite();
  // Store current site so popup can use it for "This Site" scope
  // Must use "pa_meta" — same key Storage.js uses
  chrome.storage.local.get(["pa_meta"], d => {
    const meta = d["pa_meta"] || {};
    chrome.storage.local.set({ "pa_meta": { ...meta, lastSite: SITE } });
  });

  /* ── Find the prompt input for each site ─────────────────────── */
  function findComposer() {
    // ── Claude ──
    if (SITE === "claude") {
      return (
        document.querySelector('[data-testid="chat-input"]') ||
        document.querySelector(".ProseMirror[contenteditable='true']") ||
        document.querySelector("div[contenteditable='true'][data-placeholder]") ||
        document.querySelector("div[contenteditable='true']")
      );
    }
    // ── Gemini ──
    if (SITE === "gemini") {
      return (
        document.querySelector("rich-textarea div[contenteditable='true']") ||
        document.querySelector("div[aria-label='Enter a prompt here']") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── AI Studio — consolidated (home search + playground) ──
    if (SITE === "aistudio") {
      return (
        // Home/search page inputs
        document.querySelector("input[placeholder*='Start a chat' i]") ||
        document.querySelector("input[placeholder*='vibe code' i]") ||
        document.querySelector("input[jsname]") ||
        // Playground textareas
        document.querySelector("textarea[aria-label*='prompt' i]") ||
        document.querySelector("ms-autosize-textarea textarea") ||
        document.querySelector("mat-form-field textarea") ||
        document.querySelector("textarea[placeholder*='Enter a prompt' i]") ||
        document.querySelector("textarea[placeholder*='Type something' i]") ||
        document.querySelector("textarea[placeholder*='Start typing' i]") ||
        document.querySelector(".input-area textarea") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("input[type='text']") ||
        document.querySelector("textarea")
      );
    }

    // ── NotebookLM ──
    if (SITE === "notebooklm") {
      return (
        document.querySelector("textarea[placeholder*='Ask' i]") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── Grok ──
    if (SITE === "grok") {
      return (
        document.querySelector("textarea[placeholder*='Ask']") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── Copilot ──
    if (SITE === "copilot") {
      return (
        document.querySelector("textarea[placeholder*='Message']") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── DeepSeek ──
    if (SITE === "deepseek") {
      return (
        document.querySelector("textarea[placeholder*='Send']") ||
        document.querySelector("textarea[placeholder*='Message']") ||
        document.querySelector("textarea")
      );
    }
    // ── Perplexity ──
    if (SITE === "perplexity") {
      return (
        document.querySelector("textarea[placeholder*='Ask']") ||
        document.querySelector("textarea[placeholder*='ask']") ||
        document.querySelector("textarea[placeholder*='Search']") ||
        document.querySelector("div[contenteditable='true'][tabindex]") ||
        document.querySelector("div[contenteditable='true'][aria-placeholder]") ||
        document.querySelector("div[contenteditable='true'][data-placeholder]") ||
        document.querySelector("div[contenteditable='true'][class*='grow']") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── Meta AI ──
    if (SITE === "metaai") {
      return (
        document.querySelector("div[aria-label='Message Meta AI'][contenteditable='true']") ||
        document.querySelector("div[aria-label*='Message'][contenteditable='true']") ||
        document.querySelector("div[contenteditable='true'][role='textbox']") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── Mistral ──
    if (SITE === "mistral") {
      return (
        document.querySelector("div[contenteditable='true'][data-placeholder]") ||
        document.querySelector("div[contenteditable='true'][aria-placeholder]") ||
        document.querySelector("div[contenteditable='true'][class*='input']") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea[placeholder*='Ask']") ||
        document.querySelector("textarea[placeholder*='Message']") ||
        document.querySelector("textarea")
      );
    }
    // ── Poe ──
    if (SITE === "poe") {
      return (
        document.querySelector("textarea[placeholder*='Talk to']") ||
        document.querySelector("textarea[placeholder*='Message']") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── HuggingChat ──
    if (SITE === "huggingchat") {
      return (
        document.querySelector("textarea[placeholder*='Ask']") ||
        document.querySelector("textarea[placeholder*='Message']") ||
        document.querySelector("textarea")
      );
    }
    // ── Cohere ──
    if (SITE === "cohere") {
      return (
        document.querySelector("textarea[placeholder*='Message']") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── Lovable ──
    if (SITE === "lovable") {
      return (
        document.querySelector("textarea[placeholder*='describe' i]") ||
        document.querySelector("textarea[placeholder*='what' i]") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── Bolt ──
    if (SITE === "bolt") {
      return (
        document.querySelector("textarea[placeholder*='How can' i]") ||
        document.querySelector("textarea[placeholder*='describe' i]") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── Emergent ──
    if (SITE === "emergent") {
      return (
        document.querySelector("textarea[placeholder*='describe' i]") ||
        document.querySelector("textarea[placeholder*='what' i]") ||
        document.querySelector("textarea[placeholder*='build' i]") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── Anything ──
    if (SITE === "anything") {
      return (
        document.querySelector("textarea[placeholder*='describe' i]") ||
        document.querySelector("textarea[placeholder*='build' i]") ||
        document.querySelector("textarea[placeholder*='what' i]") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── Rork ──
    if (SITE === "rork") {
      return (
        document.querySelector("textarea[placeholder*='describe' i]") ||
        document.querySelector("textarea[placeholder*='build' i]") ||
        document.querySelector("textarea[placeholder*='idea' i]") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }
    // ── v0 ──
    if (SITE === "v0") {
      return (
        document.querySelector("textarea[placeholder*='create' i]") ||
        document.querySelector("textarea[placeholder*='describe' i]") ||
        document.querySelector("textarea[placeholder*='what' i]") ||
        document.querySelector("textarea[placeholder*='build' i]") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea")
      );
    }

    // ── ChatGPT (explicit) ──
    if (SITE === "chatgpt") {
      return (
        document.querySelector("#prompt-textarea") ||
        document.querySelector("div[id='prompt-textarea']") ||
        document.querySelector("div[contenteditable='true'][tabindex='0']") ||
        document.querySelector("div[contenteditable='true'][data-id]") ||
        document.querySelector("div[contenteditable='true']") ||
        document.querySelector("textarea[data-id='root']") ||
        document.querySelector("textarea[placeholder*='Message' i]") ||
        document.querySelector("textarea")
      );
    }

    // ── Image & Video gen sites — all use textarea or input ──

    // Midjourney, Leonardo, Ideogram, Reve, DreamStudio, Designer,
    // Freepik, NightCafe, Krea, Firefly, Stability, Playground,
    // Lexica, Tensor, BingImage, Runway, Sora, HeyGen, Synthesia,
    // Pika, Kling, InVideo, Hailuo, Luma, Pictory, Veed, CapCut,
    // Descript, Fliki, Clipchamp, Kaiber, You.com, Pi, Groq,
    // OpenRouter
    return (
      document.querySelector("textarea[placeholder*='prompt' i]") ||
      document.querySelector("textarea[placeholder*='describe' i]") ||
      document.querySelector("textarea[placeholder*='imagine' i]") ||
      document.querySelector("textarea[placeholder*='generate' i]") ||
      document.querySelector("textarea[placeholder*='Ask' i]") ||
      document.querySelector("textarea[placeholder*='Message' i]") ||
      document.querySelector("textarea[placeholder*='Type' i]") ||
      document.querySelector("input[placeholder*='prompt' i]") ||
      document.querySelector("input[placeholder*='describe' i]") ||
      document.querySelector("input[placeholder*='imagine' i]") ||
      document.querySelector("div[contenteditable='true']") ||
      // ChatGPT specific
      document.querySelector("#prompt-textarea") ||
      document.querySelector("textarea")
    );
  }

  /* ── Read text ────────────────────────────────────────────────── */
  function getText(el) {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value;
    // For contenteditable — get plain text, preserve content for matching
    return (el.innerText || el.textContent || "").replace(/\n+$/, "");
  }

  /* ── Write text ───────────────────────────────────────────────── */
  function setText(el, text) {
    if (!el) return;
    try {
      el.focus();
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
        // Native input: use React-compatible setter
        const proto = el.tagName === "TEXTAREA"
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
        setter.call(el, text);
        el.dispatchEvent(new Event("input",   { bubbles: true }));
        el.dispatchEvent(new Event("change",  { bubbles: true }));
      } else {
        // contenteditable (ChatGPT, Claude, Gemini etc.)
        // Select all content then replace via execCommand for React compatibility
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
        // Try execCommand first (works on most sites)
        const ok = document.execCommand("insertText", false, text);
        if (!ok || el.innerText.trim() !== text.trim()) {
          // Fallback: direct DOM manipulation + React fiber trick
          el.innerText = "";
          el.focus();
          document.execCommand("insertText", false, text);
        }
        // Fire events so React/Vue/Angular pick up the change
        el.dispatchEvent(new InputEvent("input",  { bubbles: true, cancelable: true, data: text }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        // Move cursor to end
        const endRange = document.createRange();
        endRange.selectNodeContents(el);
        endRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(endRange);
      }
      el.focus();
    } catch (_) {}
  }

  /* ── Suggestions (site-filtered) ─────────────────────────────── */
  async function showSuggestions(query) {
    if (query.startsWith(";")) {
      const alias = await Storage.exactAlias(query, SITE);
      if (alias) {
        UI.hideDropdown();
        setText(inputEl, alias.text);
        await Storage.incrementUse(alias.id);
        UI.showToast("⚡ " + (alias.tag || "prompt") + " applied");
        return;
      }
    }
    const suggestions = await Storage.search(query, SITE);
    if (!suggestions.length) { UI.hideDropdown(); return; }
    Analytics.trackAutocompleteShown(SITE, suggestions.length);
    UI.renderDropdown(suggestions, query, inputEl, async (p) => {
      // Check for Pro variables
      if (typeof PromptVariables !== 'undefined' && PromptVariables.hasVariables(p.text)) {
        PromptVariables.showVariablePopup(p.text, inputEl, async (finalText) => {
          setText(inputEl, finalText);
          inputEl.focus();
          await Storage.incrementUse(p.id);
          const meta = await Storage.getMeta();
          Analytics.trackPromptUsed(p.id, SITE, meta.totalUses || 0);
        });
      } else {
        setText(inputEl, p.text);
        inputEl.focus();
        await Storage.incrementUse(p.id);
        const meta = await Storage.getMeta();
        Analytics.trackPromptUsed(p.id, SITE, meta.totalUses || 0);
      }
    });
  }

  /* ── Input handler ────────────────────────────────────────────── */
  function onInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const text = getText(inputEl).trim();
      if (text.length < 1) { UI.hideDropdown(); return; }
      await showSuggestions(text);
    }, 80);
  }

  /* ── Keyboard handler ─────────────────────────────────────────── */
  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      if (UI.isVisible()) {
        if (UI.confirmSelection()) { e.preventDefault(); e.stopPropagation(); }
        return;
      }
      const text = getText(inputEl);
      if (text.length > 30) {
        lastSentText = text;
        setTimeout(() => {
          if (lastSentText) { UI.showSaveChip(lastSentText, inputEl); lastSentText = ""; }
        }, 700);
      }
      return;
    }
    if (!UI.isVisible()) return;
    if      (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); UI.navigateDropdown(1); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); e.stopPropagation(); UI.navigateDropdown(-1); }
    else if (e.key === "Escape")    { UI.hideDropdown(); }
  }

  /* ── Save button ──────────────────────────────────────────────── */
  async function onSaveClick() {
    const text = getText(inputEl);
    if (!text) { UI.showToast("Type a prompt first", "error"); return; }
    const r = await Storage.save(text, "", [SITE]);
    if (r.ok) {
      UI.showToast("✓ Saved for " + _siteLabel(SITE));
    } else if (r.reason === "duplicate") {
      UI.showToast("Already saved");
    } else if (r.reason === "similar") {
      UI.showSimilarConfirm(r.match, async () => {
        const r2 = await Storage.forceSave(text, "", [SITE]);
        if (r2.ok) UI.showToast("✓ Saved");
      });
    } else if (r.reason === "limit") {
      UI.showPaywall();
    }
  }

  function _siteLabel(s) {
    const labels = {
      chatgpt:"ChatGPT", claude:"Claude", gemini:"Gemini", grok:"Grok",
      copilot:"Copilot", deepseek:"DeepSeek", perplexity:"Perplexity",
      metaai:"Meta AI", mistral:"Mistral", aistudio:"AI Studio",
      notebooklm:"NotebookLM", lovable:"Lovable", bolt:"Bolt",
      emergent:"Emergent", v0:"v0", anything:"Anything", rork:"Rork"
    };
    return labels[s] || s;
  }

  /* ── Save button group positioning ───────────────────────────── */
  function repositionSaveButton() {
    const group = document.getElementById("pa-btn-group");
    const nav   = document.getElementById("pa-nav-btn");
    if (!group || !inputEl || group.dataset.dragged) return;
    const rect = inputEl.getBoundingClientRect();
    if (!rect.width) return;
    const top  = rect.top  + window.scrollY - 38;
    const left = rect.right + window.scrollX - 120;
    group.style.top  = top + "px";
    group.style.left = left + "px";
    // Nav button sits 6px to the right of the group
    if (nav && !nav.dataset.dragged) {
      const gw = group.offsetWidth || 80;
      nav.style.top  = (top + 4) + "px";
      nav.style.left = (left + gw + 6) + "px";
    }
  }

  function injectSaveButton() {
    if (document.getElementById("pa-btn-group")) { repositionSaveButton(); return; }
    document.body.appendChild(UI.createSaveButton(onSaveClick));
    repositionSaveButton();
  }

  /* ── Inject ───────────────────────────────────────────────────── */
  function inject() {
    const el = findComposer();
    if (!el) return;
    if (inputEl !== el) {
      if (inputEl) {
        inputEl.removeEventListener("input", onInput, true);
        inputEl.removeEventListener("keydown", onKeyDown, true);
        inputEl.removeEventListener("keyup", onInput, true);
      }
      inputEl = el;
      inputEl.addEventListener("input", onInput, true);
      inputEl.addEventListener("keydown", onKeyDown, true);
      // Perplexity and some contenteditable sites don't fire 'input' reliably
      // Add keyup as fallback for contenteditable elements
      if (el.getAttribute("contenteditable") === "true") {
        inputEl.addEventListener("keyup", onInput, true);
      }
    }
    injectSaveButton();
    injected = true;
  }

  /* ── Ctrl+Space ───────────────────────────────────────────────── */
  document.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.code === "Space" && inputEl) {
      e.preventDefault();
      Analytics.trackCtrlSpaceUsed(SITE);
      const text = getText(inputEl);
      if (text.length >= 2) { await showSuggestions(text); return; }

      const all = await Storage.getAll();
      const sitePrompts = all.filter(p => !p.sites || !p.sites.length || p.sites.includes(SITE));
      if (!sitePrompts.length) { UI.showToast("No prompts for this site", "error"); return; }

      const pinned = sitePrompts.filter(p => p.pinned).slice(0, 3);
      const byUse  = [...sitePrompts].filter(p => !p.pinned)
        .sort((a,b) => (b.uses||0)-(a.uses||0)).slice(0, 5 - pinned.length);
      const list = [...pinned, ...byUse].slice(0, 5);

      UI.renderDropdown(list, "", inputEl, async (p) => {
        // Check for Pro variables
        if (typeof PromptVariables !== 'undefined' && PromptVariables.hasVariables(p.text)) {
          PromptVariables.showVariablePopup(p.text, inputEl, async (finalText) => {
            setText(inputEl, finalText);
            inputEl.focus();
            await Storage.incrementUse(p.id);
            const meta = await Storage.getMeta();
            Analytics.trackPromptUsed(p.id, SITE, meta.totalUses || 0);
          });
        } else {
          setText(inputEl, p.text);
          inputEl.focus();
          await Storage.incrementUse(p.id);
          const meta = await Storage.getMeta();
          Analytics.trackPromptUsed(p.id, SITE, meta.totalUses || 0);
        }
      });
    }
  }, true);

  /* ── Soft reminder ────────────────────────────────────────────── */
  async function checkReminder() {
    await Storage.trackSession();
    const reminder = await Storage.shouldShowReminder();
    if (reminder && reminder.show) {
      setTimeout(() => {
        if (!inputEl || document.activeElement !== inputEl) UI.showReminder(reminder.count);
      }, 3000);
    }
  }

  /* ── Outside click ────────────────────────────────────────────── */
  document.addEventListener("mousedown", (e) => {
    if (!e.target.closest("#pa-dropdown") &&
        !e.target.closest("#pa-save-chip") &&
        !e.target.closest("#pa-reminder") &&
        !e.target.closest("#pa-btn-group") &&
        e.target.id !== "pa-nav-btn") {
      UI.hideDropdown();
    }
  }, true);

  window.addEventListener("scroll", () => repositionSaveButton(), true);
  window.addEventListener("resize", () => repositionSaveButton());

  /* ── MutationObserver ─────────────────────────────────────────── */
  let rafPending = false;
  let mutationTimeout = null;
  let lastInjectCheck = 0;
  const INJECT_THROTTLE = 250; // Minimum 250ms between injection checks
  
  const obs = new MutationObserver(() => {
    // Throttle with requestAnimationFrame + time check
    if (rafPending) return;
    
    const now = Date.now();
    if (now - lastInjectCheck < INJECT_THROTTLE) {
      // Schedule a delayed check if mutations keep coming
      clearTimeout(mutationTimeout);
      mutationTimeout = setTimeout(() => {
        rafPending = false;
        obsCallback();
      }, INJECT_THROTTLE);
      return;
    }
    
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      lastInjectCheck = Date.now();
      obsCallback();
    });
  });
  
  function obsCallback() {
    const cur = findComposer();
    if (!injected || !document.getElementById("pa-btn-group") || cur !== inputEl) {
      injected = false; 
      inject();
    }
    repositionSaveButton();
    if (UI.isVisible() && inputEl) UI.positionDropdown(inputEl);
  }
  
  obs.observe(document.body, { childList: true, subtree: true });

  [500, 1500, 3000, 5000].forEach(t => setTimeout(inject, t));
  setTimeout(checkReminder, 2500);
})();
