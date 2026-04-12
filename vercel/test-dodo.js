/**
 * Test script to verify Dodo API integration
 * Run this locally to test your Dodo API key and endpoint
 * 
 * Usage: node test-dodo.js YOUR_LICENSE_KEY
 */

const DODO_API_KEY = process.env.DODO_API_KEY || 'Gp4MYQruPCnS8gDB.Ll36tm_cK78mXnxZl2mZuGKe4z-18t5DAiw2_8NLw3yHP52q';
const LICENSE_KEY = process.argv[2];

if (!LICENSE_KEY) {
  console.error('❌ Please provide a license key as argument');
  console.error('Usage: node test-dodo.js YOUR_LICENSE_KEY');
  process.exit(1);
}

async function testDodoAPI() {
  console.log('🔍 Testing Dodo API...');
  console.log('📝 License Key:', LICENSE_KEY.slice(0, 8) + '...');
  console.log('');

  try {
    // Test 1: Try to get specific license
    console.log('Test 1: GET /v1/licenses/{license_key}');
    const response1 = await fetch(
      `https://api.dodopayments.com/v1/licenses/${encodeURIComponent(LICENSE_KEY.trim())}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DODO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Status:', response1.status);
    const data1 = await response1.json();
    console.log('Response:', JSON.stringify(data1, null, 2));
    console.log('');

    // Test 2: Try to list all licenses
    console.log('Test 2: GET /v1/licenses (list all)');
    const response2 = await fetch(
      'https://api.dodopayments.com/v1/licenses',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DODO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Status:', response2.status);
    const data2 = await response2.json();
    console.log('Response (first 500 chars):', JSON.stringify(data2).slice(0, 500));
    console.log('');

    // Analyze results
    if (response1.ok) {
      console.log('✅ License found!');
      console.log('License Data:', data1);
      
      if (data1.status === 'active' || data1.status === 'valid' || data1.paid === true) {
        console.log('✅ License is VALID/ACTIVE');
      } else {
        console.log('⚠️  License status:', data1.status);
      }
    } else if (response1.status === 404) {
      console.log('❌ License NOT FOUND in Dodo');
      console.log('This means the license key is not in your Dodo account');
    } else {
      console.log('❌ API Error:', response1.status);
    }

    // Check if we got any licenses in the list
    if (data2.data && data2.data.length > 0) {
      console.log(`\n📊 Total licenses in Dodo: ${data2.data.length}`);
      console.log('Sample licenses:');
      data2.data.slice(0, 3).forEach((lic, i) => {
        console.log(`  ${i+1}. Key: ${lic.license_key?.slice(0, 12)}... | Status: ${lic.status}`);
      });
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
}

testDodoAPI();
