const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCORS() {
    console.log('🧪 Testing CORS Configuration...\n');

    try {
        // Test 1: Health check endpoint
        console.log('1️⃣ Testing health check endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}`);
        console.log('✅ Health Check Response:', healthResponse.data);
        console.log('');

        // Test 2: Test with localhost origin
        console.log('2️⃣ Testing with localhost origin...');
        const localhostResponse = await axios.get(`${BASE_URL}`, {
            headers: {
                'Origin': 'http://localhost:3000'
            }
        });
        console.log('✅ Localhost Origin Response:', localhostResponse.data);
        console.log('');

        // Test 3: Test OPTIONS preflight request
        console.log('3️⃣ Testing OPTIONS preflight request...');
        try {
            const optionsResponse = await axios.options(`${BASE_URL}/auth/login`, {
                headers: {
                    'Origin': 'http://localhost:3000',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type'
                }
            });
            console.log('✅ OPTIONS Response Status:', optionsResponse.status);
            console.log('✅ OPTIONS Response Headers:', optionsResponse.headers);
        } catch (error) {
            console.log('❌ OPTIONS Error:', error.response?.status, error.response?.statusText);
        }
        console.log('');

        console.log('🎉 CORS Test Completed!');
        console.log('📝 If all tests passed, CORS is working correctly.');

    } catch (error) {
        console.error('❌ CORS Test failed:', error.response?.data || error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure the backend server is running on port 5000');
        console.log('2. Check if the server restarted after CORS changes');
        console.log('3. Verify the CORS configuration in index.js');
    }
}

// Run the test
testCORS();
