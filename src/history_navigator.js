// history_navigator.js — v3.2
// Left side, draggable, updated selectors for 2025 AI site DOM

(function () {
  "use strict";

  var h = location.hostname.replace(/^www\./, "");
  var p = location.pathname;

  var SITE = null;
  if      (h === "chatgpt.com" || h === "chat.openai.com")                SITE = "chatgpt";
  else if (h === "claude.ai")                                             SITE = "claude";
  else if (h === "gemini.google.com")                                     SITE = "gemini";
  else if (h === "grok.com" || (h === "x.com" && p.startsWith("/i/grok"))) SITE = "grok";
  else if (h === "copilot.microsoft.com")                                 SITE = "copilot";
  else if (h === "chat.deepseek.com")                                     SITE = "deepseek";
  else if (h === "perplexity.ai")                                         SITE = "perplexity";
  else if (h === "chat.mistral.ai")                                       SITE = "mistral";
  else if (h === "meta.ai" || h === "www.meta.ai")                        SITE = "metaai";
  else if (h === "aistudio.google.com")                                   SITE = "aistudio";
  else if (h === "lovable.dev" || h === "app.lovable.dev")                SITE = "lovable";
  else if (h === "bolt.new" || h === "stackblitz.com")                    SITE = "bolt";
  else if (h === "app.emergent.sh")                                       SITE = "emergent";
  else if (h === "anything.com" || h === "www.anything.com")              SITE = "anything";
  else if (h === "rork.com")                                              SITE = "rork";
  else if (h === "v0.dev" || h === "v0.app")                              SITE = "v0";

  if (!SITE) return;

  // ── Selectors — multiple fallbacks per site, most-specific first ──
  var SELECTORS = {
    chatgpt: [
      '[data-message-author-role="user"]',
      'div[class*="ConversationItem"][class*="user"]',
      'article[data-testid*="conversation-turn"] div[class*="user"]',
      '.text-base:has(.whitespace-pre-wrap)'
    ],
    claude: [
      '[data-testid="human-turn"]',
      '.human-turn',
      'div[class*="HumanTurn"]',
      '[class*="humanTurn"]',
      'div[class*="Human"]',
      'div[class*="human"]'
    ],
    gemini: [
      'user-query',
      '.user-query',
      'message-content.user-query',
      '[class*="user-query-bubble"]',
      'div[class*="userQuery"]',
      '.query-text'
    ],
    grok: [
      '[data-testid="userMessage"]',
      'div[class*="UserMessage"]',
      'div[class*="userMessage"]',
      '[class*="message-bubble"][class*="user"]'
    ],
    perplexity: [
      // 2025 Perplexity DOM
      'div[data-testid="user-message"]',
      'div[class*="UserMessage"]',
      'div[class*="userMessage"]',
      '.my-md',
      '[data-message-sender="user"]',
      'div[class*="user"][class*="message"]'
    ],
    deepseek: [
      // DeepSeek — avoid hashed class names, use structural/role selectors
      'div[class*="user-message"]',
      'div[class*="userMessage"]',
      'div[class*="UserMessage"]',
      '[class*="chat-message"][class*="user"]',
      'div[class*="message"][class*="human"]',
      'div[role="row"][class*="user"]',
      // last-resort: any short-ish non-code block that looks like user input
    ],
    copilot: [
      'cib-chat-turn[source-attribution-type="user"] .bubble-content',
      'div[class*="userMessage"]',
      '[data-content="user"]',
      '.user-message',
      'div[class*="user-bubble"]'
    ],
    mistral: [
      'div[class*="UserMessage"]',
      'div[class*="userMessage"]',
      'div[class*="conversationTurn"][class*="human"]',
      'div[class*="user"][class*="bubble"]',
      '.user-message'
    ],
    // ── NEW SITES ────────────────────────────────────────────────
    metaai: [
      // Meta AI (meta.ai)
      'div[aria-label*="You said"]',
      'div[class*="UserMessage"]',
      'div[class*="userMessage"]',
      'div[class*="outgoing"]',
      'div[class*="sent"]',
      '[data-testid*="user"][class*="message"]',
      'div[data-sender="user"]',
      'div[class*="human"]'
    ],
    aistudio: [
      // Google AI Studio (aistudio.google.com)
      'user-turn',
      '.user-turn',
      'ms-chat-turn[role="user"]',
      'div[class*="user-turn"]',
      'div[class*="userTurn"]',
      'div[class*="UserTurn"]',
      '[class*="human-turn"]',
      'div[data-turn-role="user"]',
      'div[class*="turn"][class*="user"]'
    ],
    lovable: [
      // Lovable (lovable.dev / app.lovable.dev)
      'div[data-role="user"]',
      'div[class*="UserMessage"]',
      'div[class*="userMessage"]',
      'div[class*="user-message"]',
      'div[class*="outgoing"]',
      'div[class*="HumanMessage"]',
      '[class*="chat"][class*="user"]'
    ],
    bolt: [
      // Bolt (bolt.new / stackblitz.com)
      'div[data-role="user"]',
      'div[class*="UserMessage"]',
      'div[class*="userMessage"]',
      'div[class*="user-message"]',
      'div[class*="HumanMessage"]',
      'div[class*="human-message"]',
      '[class*="message"][class*="user"]'
    ],
    emergent: [
      // Emergent (app.emergent.sh)
      'div[data-role="user"]',
      'div[class*="UserMessage"]',
      'div[class*="userMessage"]',
      'div[class*="user-message"]',
      'div[class*="HumanMessage"]',
      '[class*="message"][class*="user"]',
      'div[class*="prompt"]'
    ],
    anything: [
      // Anything (anything.com)
      'div[data-role="user"]',
      'div[class*="UserMessage"]',
      'div[class*="userMessage"]',
      'div[class*="user-message"]',
      'div[class*="human"]',
      '[class*="message"][class*="user"]'
    ],
    rork: [
      // Rork (rork.com)
      'div[data-role="user"]',
      'div[class*="UserMessage"]',
      'div[class*="userMessage"]',
      'div[class*="user-message"]',
      'div[class*="HumanMessage"]',
      '[class*="message"][class*="user"]'
    ],
    v0: [
      // v0 (v0.dev / v0.app)
      'div[data-role="user"]',
      '[data-message-author-role="user"]',
      'div[class*="UserMessage"]',
      'div[class*="userMessage"]',
      'div[class*="user-message"]',
      'div[class*="HumanMessage"]',
      '[class*="chat"][class*="user"]'
    ]
  };

  function getUserMessages() {
    var selectorList = SELECTORS[SITE] || [];

    // Try each selector
    for (var i = 0; i < selectorList.length; i++) {
      try {
        var els = document.querySelectorAll(selectorList[i]);
        var valid = Array.from(els).filter(function(el) {
          var text = (el.innerText || el.textContent || "").trim();
          // Must have text, not too short (avoid empty divs), not too long (avoid full page matches)
          return text.length > 2 && text.length < 8000;
        });
        if (valid.length > 0) return valid;
      } catch (e) {}
    }

    // ── Universal fallback ────────────────────────────────────────
    // If no selector matched, try to find user messages by structure:
    // Look for elements that contain short-to-medium text and are
    // siblings/near AI response elements
    try {
      var candidates = [];

      // Strategy: find all article or div elements with role="presentation" or similar
      // that contain conversational text blocks
      var allBlocks = document.querySelectorAll(
        'article, [role="row"], [class*="message"], [class*="Message"], [class*="turn"], [class*="Turn"]'
      );

      allBlocks.forEach(function(block) {
        var text = (block.innerText || block.textContent || "").trim();
        if (text.length < 5 || text.length > 5000) return;

        // Skip if it contains markdown code blocks or AI response markers
        if (block.querySelector('pre code') && text.length > 200) return;

        // Check if it looks like a user message (shorter, no code blocks typically)
        var hasUserIndicator =
          block.getAttribute('data-message-author-role') === 'user' ||
          block.className.toLowerCase().includes('user') ||
          block.getAttribute('data-testid') && block.getAttribute('data-testid').toLowerCase().includes('human');

        if (hasUserIndicator) candidates.push(block);
      });

      if (candidates.length > 0) return candidates;
    } catch (e) {}

    return [];
  }

  // ── Inject styles ─────────────────────────────────────────────
  var style = document.createElement("style");
  style.textContent = [
    "#pa-nav-btn{",
      "display:inline-flex;align-items:center;justify-content:center;",
      "position:absolute;z-index:99999;",
      "width:30px;height:30px;border-radius:50%;",
      "background:#fff;border:1px solid rgba(0,0,0,0.12);",
      "box-shadow:0 1px 6px rgba(0,0,0,0.08);",
      "cursor:pointer;color:rgba(0,0,0,0.55);",
      "transition:background 0.1s,transform 0.08s;",
      "font-family:-apple-system,sans-serif;user-select:none;",
    "}",
    "#pa-nav-btn:hover{background:#f5f5f5;transform:translateY(-1px);}",
    "#pa-nav-btn.open{background:rgba(200,80,10,0.08);border-color:rgba(200,80,10,0.3);color:#c8500a;}",
    ".pa-nav-badge{",
      "position:absolute;top:-4px;right:-4px;",
      "background:#c8500a;color:#fff;font-size:8px;font-weight:700;",
      "min-width:14px;height:14px;border-radius:7px;",
      "display:none;align-items:center;justify-content:center;padding:0 3px;pointer-events:none;",
    "}",
    "#pa-nav-panel{",
      "position:fixed;",
      "top:0;right:0;",
      "z-index:2147483641;background:#fff;",
      "border-left:1px solid rgba(0,0,0,0.1);",
      "box-shadow:-4px 0 24px rgba(0,0,0,0.15);",
      "display:flex;flex-direction:column;",
      "width:320px;height:100vh;",
      "opacity:0;transform:translateX(100%);pointer-events:none;",
      "transition:transform 0.3s ease,opacity 0.3s ease;",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;",
    "}",
    "#pa-nav-panel.open{opacity:1;transform:translateX(0);pointer-events:auto;}",
    "#pa-nav-hdr{",
      "padding:13px 14px;border-bottom:1px solid rgba(0,0,0,0.07);",
      "display:flex;align-items:center;justify-content:space-between;flex-shrink:0;",
    "}",
    "#pa-nav-title{font-size:13px;font-weight:700;color:#0a0a0a;letter-spacing:-0.01em;}",
    "#pa-nav-close{",
      "width:24px;height:24px;border-radius:6px;background:none;border:none;",
      "cursor:pointer;display:flex;align-items:center;justify-content:center;",
      "color:rgba(0,0,0,0.38);font-size:15px;transition:background 0.1s;",
    "}",
    "#pa-nav-close:hover{background:rgba(0,0,0,0.06);color:#0a0a0a;}",
    "#pa-nav-list{flex:1;overflow-y:auto;padding:6px 0;}",
    "#pa-nav-list::-webkit-scrollbar{width:3px;}",
    "#pa-nav-list::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.1);border-radius:3px;}",
    ".pa-nav-item{",
      "padding:9px 14px;cursor:pointer;display:flex;align-items:flex-start;",
      "gap:9px;border-bottom:1px solid rgba(0,0,0,0.04);transition:background 0.1s;",
    "}",
    ".pa-nav-item:hover{background:rgba(0,0,0,0.03);}",
    ".pa-nav-item:last-child{border-bottom:none;}",
    ".pa-nav-num{",
      "flex-shrink:0;min-width:20px;height:20px;border-radius:50%;",
      "background:rgba(0,0,0,0.06);display:flex;align-items:center;",
      "justify-content:center;font-size:9px;font-weight:700;color:rgba(0,0,0,0.4);margin-top:1px;",
    "}",
    ".pa-nav-text{",
      "font-size:12px;color:#0a0a0a;line-height:1.45;flex:1;min-width:0;",
      "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
    "}",
    ".pa-nav-item:hover .pa-nav-text{white-space:normal;overflow:visible;}",
    ".pa-nav-empty{padding:28px 14px;text-align:center;font-size:12.5px;color:rgba(0,0,0,0.35);line-height:1.65;}",
    "#pa-nav-overlay{position:fixed;inset:0;z-index:2147483639;display:none;}",
    "#pa-nav-overlay.open{display:block;}"
  ].join("");
  document.head.appendChild(style);

  // ── Build UI ───────────────────────────────────────────────────
  var btn = document.createElement("button");
  btn.id = "pa-nav-btn";
  btn.title = "Chat History — click to browse your questions";
  btn.innerHTML =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' +
    '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>' +
    '<line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>' +
    '</svg><span class="pa-nav-badge" id="pa-nav-badge"></span>';

  var panel = document.createElement("div");
  panel.id = "pa-nav-panel";
  panel.innerHTML =
    '<div id="pa-nav-hdr"><span id="pa-nav-title">💬 Chat History</span><button id="pa-nav-close">✕</button></div>' +
    '<div id="pa-nav-list"></div>';

  var overlay = document.createElement("div");
  overlay.id = "pa-nav-overlay";

  // Wait for body to be ready
  function inject() {
    if (!document.body) { setTimeout(inject, 200); return; }
    // Remove any existing instances
    var old = document.getElementById("pa-nav-btn");
    if (old) old.remove();
    var oldP = document.getElementById("pa-nav-panel");
    if (oldP) oldP.remove();
    var oldO = document.getElementById("pa-nav-overlay");
    if (oldO) oldO.remove();

    document.body.appendChild(btn);
    document.body.appendChild(panel);
    document.body.appendChild(overlay);
    wireEvents();
  }

  function wireEvents() {
    btn.addEventListener("click", function() {
      if (isOpen) closePanel(); else openPanel();
    });

    document.getElementById("pa-nav-close").addEventListener("click", closePanel);
    overlay.addEventListener("click", closePanel);

    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && isOpen) closePanel();
    });
  }

  // ── Panel open/close ───────────────────────────────────────────
  var isOpen = false;

  function openPanel() {
    renderList(getUserMessages());
    // Sidebar slides in from left - no positioning needed
    panel.classList.add("open");
    overlay.classList.add("open");
    btn.classList.add("open");
    isOpen = true;
  }

  function closePanel() {
    panel.classList.remove("open");
    overlay.classList.remove("open");
    btn.classList.remove("open");
    isOpen = false;
  }

  // ── Render list ────────────────────────────────────────────────
  function renderList(msgs) {
    var list = document.getElementById("pa-nav-list");
    if (!list) return;
    list.innerHTML = "";

    if (!msgs || !msgs.length) {
      list.innerHTML = '<div class="pa-nav-empty">No messages found yet.<br/>Send a message first, then click here.</div>';
      return;
    }

    msgs.forEach(function(el, idx) {
      var text = (el.innerText || el.textContent || "").trim();
      if (!text) return;

      var item = document.createElement("div");
      item.className = "pa-nav-item";

      var num = document.createElement("span");
      num.className = "pa-nav-num";
      num.textContent = idx + 1;

      var txt = document.createElement("span");
      txt.className = "pa-nav-text";
      txt.textContent = text.slice(0, 80) + (text.length > 80 ? "…" : "");
      txt.title = text;

      item.appendChild(num);
      item.appendChild(txt);

      item.addEventListener("click", function() {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        var prev = el.style.outline;
        el.style.outline = "2px solid rgba(200,80,10,0.6)";
        el.style.borderRadius = "6px";
        setTimeout(function() {
          el.style.outline = prev;
          el.style.borderRadius = "";
        }, 1800);
        closePanel();
      });

      list.appendChild(item);
    });
  }

  // ── Badge update ───────────────────────────────────────────────
  function updateBadge() {
    var badge = document.getElementById("pa-nav-badge");
    if (!badge) return;
    var msgs = getUserMessages();
    if (msgs.length > 0) {
      badge.textContent = msgs.length;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
    if (isOpen) renderList(msgs);
  }

  // ── MutationObserver — watch for new messages ──────────────────
  var _debounce = null;
  var obs = new MutationObserver(function() {
    clearTimeout(_debounce);
    _debounce = setTimeout(updateBadge, 800);
  });

  function startObserving() {
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  // ── Init ───────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      inject();
      startObserving();
      setTimeout(updateBadge, 2000);
      setTimeout(updateBadge, 5000);
    });
  } else {
    inject();
    startObserving();
    setTimeout(updateBadge, 2000);
    setTimeout(updateBadge, 5000);
  }

})();
