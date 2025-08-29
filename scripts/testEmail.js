const { sendPasswordResetEmail, sendOTPEmail, sendWelcomeEmail } = require('../config/emailConfig');
require('dotenv').config();

const testEmail = async () => {
  try {
    console.log('Testing email functionality...');
    
    // Test email configuration
    const testEmail = process.env.TEST_EMAIL || 'nn.jain5272@gmail.com';
    const testToken = 'test-reset-token-123456';
    const testOTP = '123456';
    const testPassword = 'testPassword123';
    
    console.log(`Sending test emails to: ${testEmail}`);
    
    // Test password reset OTP email
    console.log('\n1. Testing password reset OTP email...');
    const resetResult = await sendOTPEmail(testEmail, testOTP, true);
    console.log('Password reset OTP email sent successfully!');
    
    // Test OTP email
    console.log('\n2. Testing OTP email...');
    const otpResult = await sendOTPEmail(testEmail, testOTP);
    console.log('OTP email sent successfully!');
    
    // Test welcome email
    console.log('\n3. Testing welcome email...');
    const welcomeResult = await sendWelcomeEmail(testEmail, testPassword);
    console.log('Welcome email sent successfully!');
    
    console.log('\n✅ All email tests completed successfully!');
    
  } catch (error) {
    console.error('Error testing email:', error);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your environment variables');
    console.log('2. Ensure Gmail credentials are correct');
    console.log('3. Check if 2-Step Verification is enabled (for App Password)');
    console.log('4. Verify OAuth 2.0 setup (for OAuth method)');
  }
};

// Run the test
testEmail();
