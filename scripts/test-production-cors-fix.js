const axios = require('axios');

async function testProductionCORSFix() {
  console.log('🧪 Testing Production CORS Fix...\n');
  
  const baseURL = 'https://taran-contact-directory-backend.vercel.app';
  const testOrigin = 'https://www.taran.co.in';
  
  try {
    // Test 1: OPTIONS preflight request
    console.log('1️⃣ Testing OPTIONS preflight request...');
    const optionsResponse = await axios({
      method: 'OPTIONS',
      url: `${baseURL}/api/members`,
      headers: {
        'Origin': testOrigin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('✅ OPTIONS request successful');
    console.log(`   Status: ${optionsResponse.status}`);
    console.log(`   CORS Headers:`);
    console.log(`     Access-Control-Allow-Origin: ${optionsResponse.headers['access-control-allow-origin']}`);
    console.log(`     Access-Control-Allow-Methods: ${optionsResponse.headers['access-control-allow-methods']}`);
    console.log(`     Access-Control-Allow-Headers: ${optionsResponse.headers['access-control-allow-headers']}`);
    console.log(`     Access-Control-Allow-Credentials: ${optionsResponse.headers['access-control-allow-credentials']}`);
    
    // Test 2: Actual GET request
    console.log('\n2️⃣ Testing GET request...');
    const getResponse = await axios({
      method: 'GET',
      url: `${baseURL}/api/members`,
      headers: {
        'Origin': testOrigin,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ GET request successful');
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Response: ${JSON.stringify(getResponse.data, null, 2)}`);
    
    // Test 3: Test with different origin
    console.log('\n3️⃣ Testing with different origin (should be blocked)...');
    try {
      await axios({
        method: 'GET',
        url: `${baseURL}/api/members`,
        headers: {
          'Origin': 'https://malicious-site.com',
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Request should have been blocked but succeeded');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ CORS blocking working correctly for unauthorized origin');
      } else {
        console.log('⚠️  Different error than expected:', error.message);
      }
    }
    
    console.log('\n🎉 Production CORS Fix Test Completed!');
    console.log('📝 If all tests passed, production CORS should be working correctly.');
    
  } catch (error) {
    console.error('\n❌ Production CORS Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if the server has been redeployed to Vercel');
    console.log('2. Verify the CORS configuration in index.js and vercel.json');
    console.log('3. Check Vercel function logs for any errors');
    console.log('4. Ensure the API endpoint is accessible');
  }
}

// Run the test
testProductionCORSFix();
