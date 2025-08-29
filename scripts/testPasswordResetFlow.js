const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/auth';

const testPasswordResetFlow = async () => {
  try {
    console.log('🧪 Testing Complete Password Reset Flow with OTP\n');

    // Step 1: Send OTP for password reset
    console.log('1️⃣ Sending OTP for password reset...');
    const forgotPasswordResponse = await axios.post(`${BASE_URL}/forgot-password`, {
      email: 'nn.jain5272@gmail.com'
    });
    console.log('✅ OTP sent successfully!');
    console.log('📧 Check your email for the OTP\n');

    // Note: In a real scenario, you would get the OTP from the email
    // For testing purposes, we'll simulate getting the OTP
    const testOTP = '123456'; // This would come from the email
    console.log(`🔢 Using test OTP: ${testOTP}\n`);

    // Step 2: Verify OTP and reset password
    console.log('2️⃣ Verifying OTP and resetting password...');
    const verifyResponse = await axios.post(`${BASE_URL}/verify-otp`, {
      email: 'nn.jain5272@gmail.com',
      otp: testOTP,
      newPassword: 'newSecurePassword123'
    });
    console.log('✅ Password reset successfully!');
    console.log('📝 Response:', verifyResponse.data.message);

    console.log('\n🎉 Password reset flow completed successfully!');

  } catch (error) {
    console.error('❌ Error in password reset flow:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Tip: Make sure the user exists in the database');
    } else if (error.response?.status === 400) {
      console.log('\n💡 Tip: Check if the OTP is correct and not expired');
    }
  }
};

// Run the test
testPasswordResetFlow();
