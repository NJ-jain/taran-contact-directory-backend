const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCORSFix() {
    console.log('🧪 Testing CORS Fix...\n');

    try {
        // Test 1: Basic health check
        console.log('1️⃣ Testing basic health check...');
        const healthResponse = await axios.get(`${BASE_URL}`);
        console.log('✅ Health Check Response:', healthResponse.data);
        console.log('');

        // Test 2: Test members endpoint with localhost origin
        console.log('2️⃣ Testing members endpoint with localhost origin...');
        const membersResponse = await axios.get(`${BASE_URL}/members`, {
            headers: {
                'Origin': 'http://localhost:3000'
            }
        });
        console.log('✅ Members Response Status:', membersResponse.status);
        console.log('✅ Members Response Headers:', membersResponse.headers);
        console.log('');

        // Test 3: Test OPTIONS preflight for members
        console.log('3️⃣ Testing OPTIONS preflight for members...');
        try {
            const optionsResponse = await axios.options(`${BASE_URL}/members`, {
                headers: {
                    'Origin': 'http://localhost:3000',
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type, Authorization'
                }
            });
            console.log('✅ OPTIONS Response Status:', optionsResponse.status);
            console.log('✅ OPTIONS Response Headers:', optionsResponse.headers);
        } catch (error) {
            console.log('❌ OPTIONS Error:', error.response?.status, error.response?.statusText);
        }
        console.log('');

        // Test 4: Test auth endpoint
        console.log('4️⃣ Testing auth endpoint...');
        try {
            const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
                email: 'test@example.com',
                password: 'testpassword'
            }, {
                headers: {
                    'Origin': 'http://localhost:3000',
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Auth Response Status:', authResponse.status);
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Auth Endpoint Accessible (Expected 400 for invalid credentials)');
            } else {
                console.log('❌ Auth Error:', error.response?.status, error.response?.statusText);
            }
        }
        console.log('');

        console.log('🎉 CORS Fix Test Completed!');
        console.log('📝 If all tests passed, CORS should be working correctly.');

    } catch (error) {
        console.error('❌ CORS Test failed:', error.response?.data || error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure the backend server is running on port 5000');
        console.log('2. Check if the server restarted after CORS changes');
        console.log('3. Verify the CORS configuration in index.js');
        console.log('4. Check if axiosInstance.js was updated to remove client-side CORS headers');
    }
}

// Run the test
testCORSFix();
