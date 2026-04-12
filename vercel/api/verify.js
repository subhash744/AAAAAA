/**
 * Vercel API Route - License Verification
 * Securely verifies license keys via Dodo Payments
 * NO API KEYS EXPOSED - all secure logic stays server-side
 */

export default async function handler(req, res) {
  // CORS headers - allow Chrome extension to call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { license_key } = req.body;

  if (!license_key || typeof license_key !== 'string') {
    return res.status(400).json({ error: 'License key required' });
  }

  try {
    console.log('[Verify] Checking license key:', license_key.slice(0, 8) + '...');
    console.log('[Verify] DODO_API_KEY exists:', !!process.env.DODO_API_KEY);
    console.log('[Verify] DODO_API_KEY starts with:', process.env.DODO_API_KEY?.slice(0, 10) + '...');
    
    // Try multiple Dodo API endpoints
    let licenseData = null;
    let dodoResponse = null;
    
    // Approach 1: Try to get license by ID/key
    try {
      console.log('[Verify] Attempt 1: GET /v1/licenses/{key}');
      dodoResponse = await fetch(
        `https://api.dodopayments.com/v1/licenses/${encodeURIComponent(license_key.trim())}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.DODO_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('[Verify] Attempt 1 status:', dodoResponse.status);
      
      if (dodoResponse.ok) {
        licenseData = await dodoResponse.json();
        console.log('[Verify] Attempt 1 success:', JSON.stringify(licenseData).slice(0, 200));
      } else if (dodoResponse.status === 401) {
        console.error('[Verify] API KEY INVALID - Check your DODO_API_KEY');
        return res.status(200).json({
          pro: false,
          error: 'Verification service misconfigured. Please contact support.'
        });
      }
    } catch (err) {
      console.log('[Verify] Attempt 1 failed:', err.message);
    }
    
    // Approach 2: If first approach failed, try listing all licenses
    if (!licenseData) {
      try {
        console.log('[Verify] Attempt 2: GET /v1/licenses (list all)');
        dodoResponse = await fetch(
          'https://api.dodopayments.com/v1/licenses',
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.DODO_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('[Verify] Attempt 2 status:', dodoResponse.status);
        
        if (dodoResponse.ok) {
          const allLicenses = await dodoResponse.json();
          console.log('[Verify] Attempt 2 response keys:', Object.keys(allLicenses));
          
          // Check if license exists in the list
          const licenses = allLicenses.data || allLicenses.licenses || [];
          console.log('[Verify] Total licenses found:', licenses.length);
          
          licenseData = licenses.find(
            lic => lic.license_key === license_key.trim() || 
                   lic.id === license_key.trim()
          );
          
          if (licenseData) {
            console.log('[Verify] License found in list!');
          }
        }
      } catch (err) {
        console.log('[Verify] Attempt 2 failed:', err.message);
      }
    }
    
    // If we still don't have license data, return error
    if (!licenseData) {
      console.log('[Verify] License not found via any method');
      return res.status(200).json({ 
        pro: false,
        error: 'Invalid license key. Please check your email from Dodo Payments or contact support.'
      });
    }

    // Validate the license
    console.log('[Verify] Validating license:', JSON.stringify(licenseData).slice(0, 300));
    
    const isValid = licenseData.status === 'active' || 
                   licenseData.status === 'valid' ||
                   licenseData.status === 'succeeded' ||
                   licenseData.status === 'completed' ||
                   (licenseData.paid === true) ||
                   (licenseData.activated === true) ||
                   (!licenseData.status && licenseData.id); // Fallback: has ID = valid
    
    console.log('[Verify] Validation result:', { 
      status: licenseData.status,
      paid: licenseData.paid,
      activated: licenseData.activated,
      isValid 
    });
    
    if (isValid) {
      return res.status(200).json({
        pro: true
      });
    } else {
      return res.status(200).json({
        pro: false,
        error: 'License is not active. Please contact support.'
      });
    }

  } catch (err) {
    console.error('[Verify] Critical Error:', err.message);
    console.error('[Verify] Stack:', err.stack);
    
    return res.status(200).json({
      pro: false,
      error: 'Verification failed. Please check your internet connection and try again.'
    });
  }
}
