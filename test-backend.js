const axios = require('axios');

const BACKEND_URL = 'https://taran-contact-directory-backend.vercel.app';

async function testBackend() {
  console.log('Testing backend endpoints...\n');
  
  try {
    // Test root endpoint
    console.log('1. Testing root endpoint (/)...');
    const rootResponse = await axios.get(`${BACKEND_URL}/`);
    console.log('✅ Root endpoint working:', rootResponse.data);
    
    // Test API endpoint
    console.log('\n2. Testing API endpoint (/api)...');
    const apiResponse = await axios.get(`${BACKEND_URL}/api`);
    console.log('✅ API endpoint working:', apiResponse.data);
    
    // Test auth endpoint
    console.log('\n3. Testing auth endpoint (/api/auth)...');
    const authResponse = await axios.get(`${BACKEND_URL}/api/auth`);
    console.log('✅ Auth endpoint accessible (may return 404 for GET, which is expected)');
    
    // Test CORS preflight
    console.log('\n4. Testing CORS preflight...');
    const corsResponse = await axios.options(`${BACKEND_URL}/api/auth/register`, {
      headers: {
        'Origin': 'http://192.168.1.14:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    console.log('✅ CORS preflight working');
    
    console.log('\n🎉 All tests passed! Backend is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testBackend(); 