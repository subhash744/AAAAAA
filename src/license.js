/**
 * License module — Secure Vercel API integration
 *
 * Flow:
 *   1. User enters license key → calls Vercel API (secure, no Dodo API key exposed)
 *   2. Vercel validates with Dodo → returns { pro: true/false }
 *   3. On success → store { pro: true, license_key, verifiedAt } locally
 *   4. Future access → check local storage only (no API calls)
 *
 * NO Dodo API calls from extension. All sensitive logic stays in Vercel.
 */

const License = (function () {
  'use strict';

  // ─── Storage keys ────────────────────────────────────────────────────────────
  const STORAGE_KEY     = 'pa_license';   // { key, isPro, verifiedAt }
  const PRO_STATUS_KEY  = 'pa_isPro';     // boolean shortcut

  // ─── Config ──────────────────────────────────────────────────────────────────
  // Vercel API endpoint (no API key needed - handled server-side)
  const VERCEL_API_URL = typeof CONFIG !== 'undefined' && CONFIG.VERCEL_API_URL 
    ? CONFIG.VERCEL_API_URL 
    : 'https://aaaaaa-alpha-inky.vercel.app/api/verify';

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function normalizeKey(raw) {
    if (!raw || typeof raw !== 'string') return '';
    return raw.trim();
  }

  // ─── Core Functions ─────────────────────────────────────────────────────────

  /**
   * Call Vercel API to verify license key
   * Returns { pro: true } if valid, { pro: false } otherwise
   */
  async function verifyWithVercel(licenseKey) {
    try {
      console.log('[License] Verifying with Vercel API...');
      console.log('[License] API URL:', VERCEL_API_URL);
      
      const response = await fetch(VERCEL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          license_key: normalizeKey(licenseKey)
        })
      });

      console.log('[License] Response status:', response.status);

      if (!response.ok) {
        console.error('[License] Vercel API error:', response.status);
        const errorText = await response.text().catch(() => '');
        console.error('[License] Error response:', errorText);
        return { pro: false, error: 'Verification service unavailable' };
      }

      const data = await response.json();
      console.log('[License] Vercel response:', data);
      
      return {
        pro: data.pro === true,
        error: data.error || null
      };

    } catch (err) {
      console.error('[License] Network error:', err.message);
      console.error('[License] Error details:', err);
      return { pro: false, error: 'Connection failed. Please check your internet and try again.' };
    }
  }

  /**
   * Store license in chrome.storage.local
   */
  async function storeLicense(licenseKey) {
    const licenseData = {
      key: licenseKey,
      isPro: true,
      verifiedAt: Date.now()
    };

    await chrome.storage.local.set({
      [STORAGE_KEY]: licenseData,
      [PRO_STATUS_KEY]: true
    });

    console.log('[License] Stored locally:', licenseData);
    return licenseData;
  }

  /**
   * Check if user has Pro access (from local storage only)
   * NO API calls - optimized for performance
   */
  async function isPro() {
    const stored = await chrome.storage.local.get([PRO_STATUS_KEY, STORAGE_KEY]);
    
    // If we have a valid license stored, grant access immediately
    if (stored[PRO_STATUS_KEY] === true && stored[STORAGE_KEY]) {
      const license = stored[STORAGE_KEY];
      if (license.isPro && license.key) {
        console.log('[License] Pro access granted from local cache');
        return true;
      }
    }

    return false;
  }

  /**
   * Activate a license key (called from UI)
   * Shows UI states: "Activating..." → "Pro Activated" or "Invalid key"
   */
  async function activate(licenseKey) {
    const key = normalizeKey(licenseKey);

    if (!key || key.length < 6) {
      return { 
        success: false, 
        message: 'Please enter a valid license key (at least 6 characters).' 
      };
    }

    console.log('[License] Starting activation for key:', key.slice(0, 8) + '…');

    // Call Vercel API (secure - no Dodo API key exposed)
    const result = await verifyWithVercel(key);

    if (!result.pro) {
      console.error('[License] Activation failed:', result.error);
      return {
        success: false,
        message: result.error || 'Invalid license key. Please check and try again.'
      };
    }

    // Store locally for future access (no more API calls needed)
    await storeLicense(key);

    console.log('[License] ✅ Activation successful!');

    return {
      success: true,
      message: 'Pro activated successfully! Welcome to Suggestio Pro.'
    };
  }

  /**
   * Restore license from local storage (no API call)
   */
  async function restoreLicense() {
    const stored = await chrome.storage.local.get([STORAGE_KEY]);
    const license = stored[STORAGE_KEY];

    if (!license || !license.key) {
      return { 
        success: false, 
        message: 'No saved license found. Please enter your license key.' 
      };
    }

    console.log('[License] Restoring from local cache:', license.key.slice(0, 8) + '…');

    // Just update the timestamp - no API call needed
    license.verifiedAt = Date.now();
    await chrome.storage.local.set({
      [STORAGE_KEY]: license,
      [PRO_STATUS_KEY]: true
    });

    return { 
      success: true, 
      message: 'License restored successfully!' 
    };
  }

  /**
   * Get license info for UI display
   */
  async function getLicenseInfo() {
    const stored = await chrome.storage.local.get([PRO_STATUS_KEY, STORAGE_KEY]);
    const license = stored[STORAGE_KEY];

    if (!license) {
      return { isPro: false };
    }

    return {
      isPro: stored[PRO_STATUS_KEY] === true && license.isPro === true,
      // Mask key for privacy: show first 8 chars only
      key: license.key ? license.key.slice(0, 8) + '…' : null,
      verifiedAt: license.verifiedAt
    };
  }

  /**
   * Deactivate Pro (clear local state)
   */
  async function deactivate() {
    await chrome.storage.local.remove([STORAGE_KEY, PRO_STATUS_KEY]);
    console.log('[License] Deactivated. Local data cleared.');
  }

  /**
   * Max prompts based on Pro status
   */
  async function getMaxPrompts() {
    const pro = await isPro();
    return pro ? Infinity : 25;
  }

  /**
   * Debug: check local storage status
   */
  async function debug() {
    console.log('[License] === DEBUG START ===');
    console.log('[License] Vercel API URL:', VERCEL_API_URL);

    const stored = await chrome.storage.local.get([PRO_STATUS_KEY, STORAGE_KEY]);
    console.log('[License] Local pro status:', stored[PRO_STATUS_KEY]);
    
    if (stored[STORAGE_KEY]) {
      const lic = stored[STORAGE_KEY];
      console.log('[License] Stored key:', lic.key ? lic.key.slice(0, 8) + '…' : 'none');
      console.log('[License] isPro:', lic.isPro);
      console.log('[License] Verified at:', new Date(lic.verifiedAt).toLocaleString());
    } else {
      console.log('[License] No license stored.');
    }

    console.log('[License] === DEBUG END ===');
  }

  // ─── Expose ───────────────────────────────────────────────────────────────────
  return {
    activate,           // Main activation function
    restoreLicense,     // Restore from local storage
    isPro,              // Check Pro status (local only, no API call)
    getLicenseInfo,     // Get info for UI
    deactivate,         // Clear license
    getMaxPrompts,      // Get max prompts
    debug,              // Debug info
    // Storage keys (for external use if needed)
    PRO_STATUS_KEY,
    STORAGE_KEY
  };
})();

// Make available globally for popup.js and content scripts
if (typeof window !== 'undefined') {
  window.License = License;
}
