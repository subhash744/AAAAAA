// config.js

const CONFIG = {

  // ── Website ───────────────────────────────────────────────────
  WEBSITE_URL: "https://suggestio.vercel.app",

  // ── Chrome Web Store ─────────────────────────────────────────
  EXTENSION_ID: "gjcncbhaoclpoopeanbbjeoegllnpdpe",
  STORE_URL: "https://chromewebstore.google.com/detail/gjcncbhaoclpoopeanbbjeoegllnpdpe",
  FEEDBACK_URL: "https://tally.so/r/xXQX95",

  // ── Prompt Limit ─────────────────────────────────────────────
  // Free tier: 25 prompts
  // Pro tier: Unlimited (checked dynamically via License.isPro())
  MAX_PROMPTS_FREE: 25,
  MAX_PROMPTS_PRO: Infinity,

  // ── Dodo Payments (LIVE) ─────────────────────────────────────────────────
  // Live checkout — payments go to your bank account
  PRO_PRICE: "$7",
  PRO_PRICE_CENTS: 700,
  DODO_CHECKOUT_URL: "https://checkout.dodopayments.com/buy/pdt_0NcTg2hCATkECb0P9XqtZ?quantity=1",

  // ── Dodo API Key ──────────────────────────────────────────────────────────
  // Used directly from the extension to call Dodo's license API (no backend).
  // Get this from: https://app.dodopayments.com → Settings → API Keys
  // ⚠️  Replace with your real key before publishing.
  DODO_API_KEY: "Gp4MYQruPCnS8gDB.Ll36tm_cK78mXnxZl2mZuGKe4z-18t5DAiw2_8NLw3yHP52q",

  // ── License ───────────────────────────────────────────────────────────────
  LICENSE_VALIDATION_CACHE_HOURS: 24, // Re-validate every 24 hours
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  
  // ── Pro Features ─────────────────────────────────────────────
  PRO_FEATURES: [
    "Unlimited prompts",
    "Sync across all devices",
    "Import / Export",
    "Prompt variables ({{name}})"
  ],

  // ── Review nudge — days after install before asking ──────────
  REVIEW_NUDGE_DAYS: 3,

};

// Helper to get max prompts (will be overridden by License module when available)
CONFIG.getMaxPrompts = async function() {
  if (typeof License !== 'undefined') {
    return await License.getMaxPrompts();
  }
  return CONFIG.MAX_PROMPTS_FREE;
};

// Check if Pro is active
CONFIG.isPro = async function() {
  if (typeof License !== 'undefined') {
    return await License.isPro();
  }
  return false;
};
