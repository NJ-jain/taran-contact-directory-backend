const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testEmail = 'test@example.com';

async function testForgotPasswordAPI() {
    console.log('🧪 Testing Forgot Password API Endpoints...\n');

    try {
        // Test 1: Forgot Password (Send OTP)
        console.log('1️⃣ Testing forgot-password endpoint...');
        const forgotPasswordResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
            email: testEmail
        });
        console.log('✅ Forgot Password Response:', forgotPasswordResponse.data);
        console.log('');

        // Test 2: Send OTP (alternative endpoint)
        console.log('2️⃣ Testing send-otp endpoint...');
        const sendOTPResponse = await axios.post(`${BASE_URL}/auth/send-otp`, {
            email: testEmail
        });
        console.log('✅ Send OTP Response:', sendOTPResponse.data);
        console.log('');

        // Test 3: Verify OTP (this will fail without a valid OTP, but we can test the endpoint)
        console.log('3️⃣ Testing verify-otp endpoint (will fail without valid OTP)...');
        try {
            const verifyOTPResponse = await axios.post(`${BASE_URL}/auth/verify-otp`, {
                email: testEmail,
                otp: '123456',
                newPassword: 'newpassword123'
            });
            console.log('✅ Verify OTP Response:', verifyOTPResponse.data);
        } catch (error) {
            console.log('❌ Verify OTP Error (Expected):', error.response?.data?.message || error.message);
        }
        console.log('');

        console.log('🎉 API Endpoint Tests Completed!');
        console.log('📧 Check your email for OTP codes if the endpoints are working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure the backend server is running on port 5000');
        console.log('2. Check if email configuration is set up correctly');
        console.log('3. Verify environment variables are configured');
    }
}

// Run the test
testForgotPasswordAPI();
