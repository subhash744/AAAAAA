# License Verification Fix

## What Was Wrong

The license verification was failing because:

1. **Wrong Dodo API Endpoint**: Was using `/v1/licenses/activate` (for activating licenses) instead of `/v1/licenses/{key}` (for verifying/checking a license)
2. **Poor Error Messages**: Generic errors didn't help identify the real issue
3. **Missing Debug Logging**: Hard to diagnose what's happening

## What Was Fixed

### 1. Updated `vercel/api/verify.js`
- ✅ Changed from `POST /v1/licenses/activate` to `GET /v1/licenses/{license_key}`
- ✅ Added detailed logging to see exactly what Dodo returns
- ✅ Better error handling with specific messages
- ✅ Checks multiple status values: `active`, `valid`, `succeeded`, `paid`

### 2. Enhanced `src/license.js`
- ✅ Added detailed console logging for debugging
- ✅ Shows API URL being called
- ✅ Logs response status and errors
- ✅ Better error messages for users

### 3. Created Test Script
- ✅ `vercel/test-dodo.js` - Test your Dodo API key and license locally

## How to Deploy the Fix

### Step 1: Deploy to Vercel
```bash
cd vercel
vercel --prod
```

Or push to your Git repository if you have Vercel connected to Git.

### Step 2: Test Your License Key

Run the test script to verify your Dodo API is working:

```bash
cd vercel
node test-dodo.js YOUR_LICENSE_KEY_HERE
```

This will show you:
- If your API key works
- If the license exists in Dodo
- What status the license has
- All licenses in your Dodo account

### Step 3: Test in Browser

1. Open your Chrome extension popup
2. Open DevTools (F12)
3. Go to Console tab
4. Enter a license key and click "Activate"
5. Watch the console logs - you'll see:
   ```
   [License] Verifying with Vercel API...
   [License] API URL: https://aaaaaa-alpha-inky.vercel.app/api/verify
   [License] Response status: 200
   [License] Vercel response: { pro: true }
   ```

## Common Issues & Solutions

### Issue: "Invalid license key"
**Cause**: The license key doesn't exist in your Dodo account

**Solution**:
1. Run `node test-dodo.js YOUR_KEY` to check
2. Verify the customer received the key from Dodo after payment
3. Check your Dodo dashboard → Licenses

### Issue: "Verification service unavailable"
**Cause**: Dodo API is returning an error (401, 500, etc.)

**Solution**:
1. Check your Vercel logs: `vercel logs`
2. Verify `DODO_API_KEY` environment variable is set in Vercel
3. Run the test script to check API key validity

### Issue: "Connection failed"
**Cause**: Network error or CORS issue

**Solution**:
1. Check browser console for network errors
2. Verify Vercel deployment is live: `https://aaaaaa-alpha-inky.vercel.app/api/verify`
3. Check if CORS headers are set (already done in verify.js)

## Testing Checklist

- [ ] Dodo API key is set in Vercel environment variables
- [ ] Vercel deployment is updated with new code
- [ ] Test script runs successfully: `node test-dodo.js KEY`
- [ ] Browser console shows successful verification
- [ ] License activates and shows "Pro activated" message
- [ ] Pro features unlock (unlimited prompts, etc.)

## How It Works Now

```
User enters key → Extension calls Vercel API → Vercel calls Dodo API
                                              ↓
                   Extension ← Vercel response ← Dodo returns license data
                   checks { pro: true/false }
                                              ↓
                   If pro=true → Store locally → Unlock Pro features
```

## API Flow

1. **Extension** (`src/license.js`):
   - Calls `https://aaaaaa-alpha-inky.vercel.app/api/verify`
   - Sends: `{ license_key: "XXXX-XXXX-XXXX" }`
   - Receives: `{ pro: true }` or `{ pro: false, error: "..." }`

2. **Vercel** (`vercel/api/verify.js`):
   - Receives POST request from extension
   - Calls Dodo: `GET https://api.dodopayments.com/v1/licenses/{key}`
   - Uses `DODO_API_KEY` from environment (never exposed to client)
   - Returns `{ pro: true }` if license is valid

3. **Dodo Payments**:
   - Returns license data if key exists
   - Returns 404 if key doesn't exist
   - License must have status: `active`, `valid`, or `succeeded`

## Need Help?

Check the console logs in:
1. **Browser DevTools** → Console (for extension logs)
2. **Vercel Dashboard** → Logs (for API logs)
3. **Test script output** (for Dodo API diagnostics)

The logs will show exactly where the verification is failing.
