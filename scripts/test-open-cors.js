const axios = require('axios');

async function testOpenCORS() {
  console.log('🧪 Testing Open CORS Configuration...\n');
  
  const baseURL = 'https://taran-contact-directory-backend.onrender.com';
  
  try {
    // Test 1: Test with your domain
    console.log('1️⃣ Testing with taran.co.in...');
    const response1 = await axios({
      method: 'GET',
      url: `${baseURL}/api/members`,
      headers: {
        'Origin': 'https://www.taran.co.in',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Request successful');
    console.log(`   Status: ${response1.status}`);
    console.log(`   CORS Headers:`);
    console.log(`     Access-Control-Allow-Origin: ${response1.headers['access-control-allow-origin']}`);
    
    // Test 2: Test with any other domain
    console.log('\n2️⃣ Testing with any other domain...');
    const response2 = await axios({
      method: 'GET',
      url: `${baseURL}/api/members`,
      headers: {
        'Origin': 'https://any-other-site.com',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Request successful');
    console.log(`   Status: ${response2.status}`);
    console.log(`   CORS Headers:`);
    console.log(`     Access-Control-Allow-Origin: ${response2.headers['access-control-allow-origin']}`);
    
    // Test 3: Test with localhost
    console.log('\n3️⃣ Testing with localhost...');
    const response3 = await axios({
      method: 'GET',
      url: `${baseURL}/api/members`,
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Request successful');
    console.log(`   Status: ${response3.status}`);
    console.log(`   CORS Headers:`);
    console.log(`     Access-Control-Allow-Origin: ${response3.headers['access-control-allow-origin']}`);
    
    console.log('\n🎉 Open CORS Test Completed!');
    console.log('📝 All requests should now work from any origin.');
    console.log('⚠️  WARNING: Your API is now completely open to any website!');
    
  } catch (error) {
    console.error('\n❌ Open CORS Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if the server has been redeployed');
    console.log('2. Verify the CORS configuration in index.js');
    console.log('3. Check service logs for any errors');
  }
}

// Run the test
testOpenCORS();
