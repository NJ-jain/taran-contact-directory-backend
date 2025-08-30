const axios = require('axios');

const PRODUCTION_BACKEND = 'https://taran-contact-directory-backend.vercel.app/api';
const PRODUCTION_FRONTEND = 'https://www.taran.co.in';

async function testProductionCORS() {
    console.log('🧪 Testing Production CORS Configuration...\n');

    try {
        // Test 1: Basic health check
        console.log('1️⃣ Testing production health check...');
        const healthResponse = await axios.get(PRODUCTION_BACKEND);
        console.log('✅ Health Check Response:', healthResponse.data);
        console.log('');

        // Test 2: Test members endpoint with production origin
        console.log('2️⃣ Testing members endpoint with production origin...');
        const membersResponse = await axios.get(`${PRODUCTION_BACKEND}/members`, {
            headers: {
                'Origin': PRODUCTION_FRONTEND
            }
        });
        console.log('✅ Members Response Status:', membersResponse.status);
        console.log('✅ Members Response Headers:', membersResponse.headers);
        console.log('');

        // Test 3: Test OPTIONS preflight for members
        console.log('3️⃣ Testing OPTIONS preflight for members...');
        try {
            const optionsResponse = await axios.options(`${PRODUCTION_BACKEND}/members`, {
                headers: {
                    'Origin': PRODUCTION_FRONTEND,
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type, Authorization'
                }
            });
            console.log('✅ OPTIONS Response Status:', optionsResponse.status);
            console.log('✅ OPTIONS Response Headers:', optionsResponse.headers);
            
            // Check specific CORS headers
            const corsHeaders = optionsResponse.headers;
            console.log('✅ CORS Headers Check:');
            console.log(`   Access-Control-Allow-Origin: ${corsHeaders['access-control-allow-origin']}`);
            console.log(`   Access-Control-Allow-Methods: ${corsHeaders['access-control-allow-methods']}`);
            console.log(`   Access-Control-Allow-Headers: ${corsHeaders['access-control-allow-headers']}`);
            console.log(`   Access-Control-Allow-Credentials: ${corsHeaders['access-control-allow-credentials']}`);
        } catch (error) {
            console.log('❌ OPTIONS Error:', error.response?.status, error.response?.statusText);
            if (error.response?.headers) {
                console.log('Response Headers:', error.response.headers);
            }
        }
        console.log('');

        // Test 4: Test auth endpoint
        console.log('4️⃣ Testing auth endpoint...');
        try {
            const authResponse = await axios.post(`${PRODUCTION_BACKEND}/auth/login`, {
                email: 'test@example.com',
                password: 'testpassword'
            }, {
                headers: {
                    'Origin': PRODUCTION_FRONTEND,
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

        console.log('🎉 Production CORS Test Completed!');
        console.log('📝 If all tests passed, production CORS should be working correctly.');

    } catch (error) {
        console.error('❌ Production CORS Test failed:', error.response?.data || error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure the backend is deployed to Vercel with latest changes');
        console.log('2. Check if CORS configuration is properly updated');
        console.log('3. Verify the production backend URL is correct');
        console.log('4. Check Vercel deployment logs for any errors');
    }
}

// Run the test
testProductionCORS();
