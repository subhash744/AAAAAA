# Prompt Archive - Vercel Deployment Guide

This folder contains everything needed to deploy the **landing page + license verification API** to Vercel.

## 📁 Folder Structure

```
vercel/
├── api/
│   └── verify.js          # License verification endpoint
├── index.html             # Landing page (aesthetic dark theme)
├── package.json           # Dependencies
├── vercel.json            # Vercel configuration
├── .env.example           # Environment variables template
└── README.md              # This file
```

## 🚀 Quick Deploy (Step 2 of 2)

### Step 1: Prepare Your Files

1. **Update `index.html`** - Replace these placeholders:
   - `YOUR_CHROME_EXTENSION_STORE_URL` → Your Chrome Web Store link
   - `YOUR_DODO_CHECKOUT_URL` → Your Dodo Payments checkout URL
   - `support@yourdomain.com` → Your support email

2. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

### Step 2: Deploy to Vercel

```bash
cd vercel
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (select your account)
- Link to existing project? **N**
- Project name? (e.g., `prompt-archive`)
- Directory? `./` (current)

### Step 3: Add Environment Variables

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `DODO_API_KEY` = Your Dodo API key (from Dodo dashboard)

### Step 4: Update Extension Config

In your extension's `src/config.js`, update:

```javascript
VERCEL_API_URL: "https://your-project.vercel.app/api/verify"
```

## 🔗 How It All Connects

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Extension     │────▶│   Vercel API    │────▶│  Dodo Payments  │
│   (Chrome)      │     │   (/api/verify) │     │   (License)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
   User enters key      Secure validation      License status
   → Stored locally      (API key hidden)       → Valid/Invalid
```

## 🎨 Landing Page Sections

The `index.html` includes:

1. **Navigation** - Logo + links
2. **Hero** - Main value prop + CTA buttons
3. **Features Grid** - 6 feature cards with icons
4. **How It Works** - 3-step process
5. **Pricing** - $3 one-time card with feature list
6. **FAQ** - 6 common questions
7. **CTA** - Final call-to-action
8. **Footer** - Links + copyright

## 🔧 API Endpoint

### POST /api/verify

**Request:**
```json
{
  "license_key": "XXXX-XXXX-XXXX-XXXX"
}
```

**Response (Success):**
```json
{
  "pro": true,
  "activation_count": 1,
  "activation_limit": 5
}
```

**Response (Invalid):**
```json
{
  "pro": false,
  "error": "Invalid license key",
  "retry": true
}
```

## 🧪 Testing

1. **Test API manually:**
   ```bash
   curl -X POST https://your-project.vercel.app/api/verify \
     -H "Content-Type: application/json" \
     -d '{"license_key":"test-key"}'
   ```

2. **Test landing page:**
   - Visit `https://your-project.vercel.app`
   - Check all sections render correctly
   - Verify links work

3. **Test full flow:**
   - Make test payment on Dodo
   - Get license key
   - Enter in extension
   - Should activate Pro

## 📋 Pre-Deployment Checklist

- [ ] Updated `index.html` with your URLs
- [ ] Got Dodo API key from dashboard
- [ ] Added `DODO_API_KEY` to Vercel env vars
- [ ] Updated extension `VERCEL_API_URL`
- [ ] Tested API endpoint works
- [ ] Checked landing page on mobile
- [ ] Verified Chrome Web Store link works

## 🚨 Troubleshooting

**API returns 500:**
- Check Dodo API key is set in Vercel env vars
- Check Dodo API key is correct (test vs live)

**CORS errors:**
- Already configured in `vercel.json`
- Should work out of the box

**Extension can't connect:**
- Verify `VERCEL_API_URL` in extension config
- Check URL includes `https://`
- Test API with curl first

## 💰 Dodo Payments Setup

1. Go to [Dodo Dashboard](https://dashboard.dodopayments.com)
2. Create a product ($3, one-time)
3. Enable **License Keys** in product settings
4. Get your **API Key** from Settings
5. Add webhook (optional): `https://your-project.vercel.app/api/webhook`

## 📝 Next Steps After Deploy

1. **Submit extension** to Chrome Web Store
2. **Update landing page** with store URL
3. **Test purchase flow** end-to-end
4. **Set up analytics** (Google Analytics, etc.)
5. **Configure custom domain** (optional)

## 🆘 Support

If you get stuck:
1. Check browser console for errors
2. Check Vercel function logs (Dashboard → Functions)
3. Verify Dodo license key is generated on purchase
4. Test API directly with curl

---

**You're now ready to deploy! 🚀**
