// analytics.js — GA4 Measurement Protocol tracker
// Plain English: This file sends usage data to Google Analytics 4
// so you can see what users are doing inside the extension.

const Analytics = (() => {
  const MEASUREMENT_ID = "G-KEYGL7WDKL";
  const API_SECRET     = ""; // Leave blank — Measurement Protocol works without this for basic hits
  const GA_ENDPOINT    = "https://www.google-analytics.com/mp/collect";
  
  // Rate limiting: max 100 events per minute, max 10 duplicates
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  const MAX_EVENTS_PER_WINDOW = 100;
  const MAX_DUPLICATE_EVENTS = 10;
  
  let eventTimestamps = [];
  let recentEvents = new Map(); // eventName -> count
  
  // Check rate limits
  function checkRateLimit(eventName) {
    const now = Date.now();
    
    // Clean old timestamps
    eventTimestamps = eventTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    
    // Check overall rate
    if (eventTimestamps.length >= MAX_EVENTS_PER_WINDOW) {
      console.warn("[Analytics] Rate limit exceeded, dropping event:", eventName);
      return false;
    }
    
    // Check duplicate rate
    const duplicateCount = recentEvents.get(eventName) || 0;
    if (duplicateCount >= MAX_DUPLICATE_EVENTS) {
      console.warn("[Analytics] Duplicate limit exceeded for:", eventName);
      return false;
    }
    
    // Record event
    eventTimestamps.push(now);
    recentEvents.set(eventName, duplicateCount + 1);
    
    // Clean old duplicates every minute
    if (Math.random() < 0.01) { // 1% chance
      setTimeout(() => recentEvents.clear(), RATE_LIMIT_WINDOW);
    }
    
    return true;
  }

  // Get or create a persistent anonymous user ID
  async function getClientId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["__pa_cid__"], (d) => {
        if (chrome.runtime.lastError) {
          console.error("[Analytics] getClientId error:", chrome.runtime.lastError);
          resolve("fallback_" + Date.now());
          return;
        }
        if (d["__pa_cid__"]) return resolve(d["__pa_cid__"]);
        const cid = "ext_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
        chrome.storage.local.set({ "__pa_cid__": cid }, () => {
          if (chrome.runtime.lastError) {
            console.error("[Analytics] setClientId error:", chrome.runtime.lastError);
          }
          resolve(cid);
        });
      });
    });
  }

  // Get stored session info
  async function getSessionId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["__pa_sid__", "__pa_sid_time__"], (d) => {
        if (chrome.runtime.lastError) {
          console.error("[Analytics] getSessionId error:", chrome.runtime.lastError);
          resolve(String(Date.now()));
          return;
        }
        const now = Date.now();
        const thirtyMin = 30 * 60 * 1000;
        // Start a new session if more than 30 min since last event
        if (!d["__pa_sid__"] || (now - (d["__pa_sid_time__"] || 0)) > thirtyMin) {
          const sid = String(now);
          chrome.storage.local.set({ "__pa_sid__": sid, "__pa_sid_time__": now }, () => {
            if (chrome.runtime.lastError) {
              console.error("[Analytics] setSessionId error:", chrome.runtime.lastError);
            }
            resolve(sid);
          });
        } else {
          chrome.storage.local.set({ "__pa_sid_time__": now }, () => {
            resolve(d["__pa_sid__"]);
          });
        }
      });
    });
  }

  // Core send function with timeout
  async function send(eventName, params = {}) {
    // Check rate limits
    if (!checkRateLimit(eventName)) {
      return;
    }
    
    try {
      const clientId = await getClientId();
      const sessionId = await getSessionId();

      const payload = {
        client_id: clientId,
        non_personalized_ads: true,
        events: [{
          name: eventName,
          params: {
            session_id: sessionId,
            engagement_time_msec: "100",
            ...params
          }
        }]
      };

      const url = `${GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}`;
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000); // 5 second timeout
      
      await fetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        keepalive: true // Allow request to complete even if page unloads
      });
      
      clearTimeout(timeoutId);
    } catch (err) {
      // Silent fail — never crash the extension because of analytics
      if (err.name === "AbortError") {
        console.warn("[Analytics] Request timed out:", eventName);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // TRACKED EVENTS — each one has a plain English name
  // ─────────────────────────────────────────────────────────────

  // Fires once when someone installs the extension for the first time
  function trackInstall() {
    return send("first_install", { event_category: "lifecycle" });
  }

  // Fires every time someone opens the popup
  function trackPopupOpen(promptCount) {
    return send("popup_opened", {
      event_category: "engagement",
      prompt_count: promptCount,          // How many prompts they have saved
      is_power_user: promptCount >= 10 ? "yes" : "no"
    });
  }

  // Fires when someone saves a new prompt
  function trackPromptSaved(totalCount, tag, siteScope) {
    return send("prompt_saved", {
      event_category: "core_action",
      total_prompts: totalCount,          // Their total saved after saving
      has_tag: tag ? "yes" : "no",        // Did they use a tag?
      scope: siteScope || "all"           // All sites, this site, or picked sites
    });
  }

  // Fires when someone uses a saved prompt (clicks it from autocomplete)
  function trackPromptUsed(promptId, site, totalUses) {
    return send("prompt_used", {
      event_category: "core_action",
      site: site,                         // Which AI platform they used it on
      total_uses_lifetime: totalUses      // Their total uses ever
    });
  }

  // Fires when autocomplete dropdown appears
  function trackAutocompleteShown(site, matchCount) {
    return send("autocomplete_shown", {
      event_category: "engagement",
      site: site,                         // e.g. chatgpt, claude, gemini
      match_count: matchCount             // How many suggestions appeared
    });
  }

  // Fires when Ctrl+Space is used to browse prompts
  function trackCtrlSpaceUsed(site) {
    return send("ctrl_space_used", {
      event_category: "power_feature",
      site: site
    });
  }

  // Fires when someone loads a starter pack
  function trackPackLoaded(packName, promptsAdded) {
    return send("pack_loaded", {
      event_category: "onboarding",
      pack_name: packName,                // founders / writing / dev / marketing
      prompts_added: promptsAdded
    });
  }

  // Fires when someone hits the prompt limit (currently 25, defined in CONFIG.MAX_PROMPTS)
  function trackUpgradeWallHit(currentCount) {
    return send("limit_reached", {
      event_category: "limit",
      prompt_count: currentCount
    });
  }

  // Fires when someone clicks "Rate Extension"
  function trackRateClick() {
    return send("rate_button_clicked", {
      event_category: "growth"
    });
  }

  // Fires when someone clicks "Give Feedback"
  function trackFeedbackClick() {
    return send("feedback_button_clicked", {
      event_category: "growth"
    });
  }

  // Fires when a prompt is deleted
  function trackPromptDeleted(remainingCount) {
    return send("prompt_deleted", {
      event_category: "engagement",
      remaining_prompts: remainingCount
    });
  }

  // Fires when someone completes onboarding (dismisses welcome screen)
  function trackOnboardingCompleted(didLoadPack) {
    return send("onboarding_completed", {
      event_category: "onboarding",
      loaded_a_pack: didLoadPack ? "yes" : "no"
    });
  }

  // Fires on each session start — gives you daily/weekly active user data
  function trackSessionStart(promptCount, totalUses) {
    return send("session_start", {
      event_category: "lifecycle",
      saved_prompts: promptCount,
      lifetime_uses: totalUses,
      // Segment users by activity level
      user_tier: promptCount === 0 ? "new"
               : promptCount < 5  ? "beginner"
               : promptCount < 20 ? "regular"
               : promptCount < 50 ? "power"
               : "heavy"
    });
  }

  // Fires when someone uses the ;tag shortcut
  function trackTagShortcutUsed(site) {
    return send("tag_shortcut_used", {
      event_category: "power_feature",
      site: site
    });
  }


  // Fires when user shares prompts
  function trackShareCreated(promptCount) {
    return send("share_created", { event_category: "growth", prompt_count: promptCount });
  }

  // Fires when someone imports via a share URL
  function trackShareImported(promptCount) {
    return send("share_imported", { event_category: "growth", prompt_count: promptCount });
  }

  // Fires when version history restore is used
  function trackVersionRestored() {
    return send("version_restored", { event_category: "power_feature" });
  }

  // Fires when chat history navigator is opened
  function trackHistoryNavigatorOpened(site, messageCount) {
    return send("history_navigator_opened", {
      event_category: "engagement",
      site: site,
      message_count: messageCount
    });
  }

  // Fires when user jumps to a message via navigator
  function trackHistoryNavigatorJump(site) {
    return send("history_navigator_jump", { event_category: "engagement", site: site });
  }
  
  // Fires when user exports their prompts
  function trackExport(promptCount) {
    return send("prompts_exported", { event_category: "data_management", prompt_count: promptCount });
  }
  
  // Fires when user creates a backup
  function trackBackupCreated(promptCount) {
    return send("backup_created", { event_category: "data_management", prompt_count: promptCount });
  }
  
  // Fires when user restores from backup
  function trackBackupRestored(promptCount) {
    return send("backup_restored", { event_category: "data_management", prompt_count: promptCount });
  }

  // ── Pro Monetization ───────────────────────────────────────────
  function trackPaywallShown() {
    send("paywall_shown", { free_limit: 25 });
  }

  function trackCheckoutOpened() {
    send("checkout_opened", { price: CONFIG.PRO_PRICE_CENTS, currency: "USD" });
  }

  function trackLicenseActivated() {
    send("license_activated", { tier: "pro" });
  }

  function trackProFeatureBlocked(feature) {
    send("pro_feature_blocked", { feature: feature });
  }

  // Public API
  return {
    trackInstall,
    trackPopupOpen,
    trackPromptSaved,
    trackPromptUsed,
    trackAutocompleteShown,
    trackCtrlSpaceUsed,
    trackPackLoaded,
    trackUpgradeWallHit,
    trackRateClick,
    trackFeedbackClick,
    trackPromptDeleted,
    trackOnboardingCompleted,
    trackSessionStart,
    trackTagShortcutUsed,
    trackShareCreated,
    trackShareImported,
    trackVersionRestored,
    trackHistoryNavigatorOpened,
    trackHistoryNavigatorJump,
    trackExport,
    trackBackupCreated,
    trackBackupRestored,
    // Pro monetization
    trackPaywallShown,
    trackCheckoutOpened,
    trackLicenseActivated,
    trackProFeatureBlocked
  };
})();
