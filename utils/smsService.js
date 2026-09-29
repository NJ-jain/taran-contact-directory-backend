const axios = require('axios');

/**
 * Universal SMS Service for delivering OTPs to Indian and international numbers.
 * Supports:
 * 1. Fast2SMS (Recommended for India - https://www.fast2sms.com)
 * 2. 2Factor (India OTP gateway - https://2factor.in)
 * 3. Twilio (Global SMS)
 */
async function sendSmsOtp(phoneNumber, otp, memberName = 'Member') {
  const digitsOnly = phoneNumber.toString().replace(/\D/g, '');
  const last10 = digitsOnly.slice(-10);

  // 1. FAST2SMS (Primary Indian SMS Gateway)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      console.log(`[SMS SERVICE] Dispatching SMS via Fast2SMS to +91 ${last10}...`);
      
      // Fast2SMS OTP route (Quick delivery without DLT registration requirement for testing)
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          variables_values: otp,
          route: 'otp',
          numbers: last10,
        },
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY.trim(),
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.return) {
        console.log(`[SMS SERVICE] Fast2SMS sent successfully to +91 ${last10}:`, response.data.message);
        return { success: true, provider: 'fast2sms', response: response.data };
      } else {
        console.warn(`[SMS SERVICE] Fast2SMS returned error:`, response.data);
      }
    } catch (err) {
      console.error(`[SMS SERVICE] Fast2SMS API error:`, err.response?.data || err.message);
    }
  }

  // 2. 2FACTOR.IN (Popular Indian OTP Gateway)
  if (process.env.TWO_FACTOR_API_KEY) {
    try {
      console.log(`[SMS SERVICE] Dispatching SMS via 2Factor to +91 ${last10}...`);
      const apiKey = process.env.TWO_FACTOR_API_KEY.trim();
      const url = `https://2factor.in/API/V1/${apiKey}/SMS/${last10}/${otp}/AUTOGEN`;
      const response = await axios.get(url, { timeout: 10000 });
      if (response.data && response.data.Status === 'Success') {
        console.log(`[SMS SERVICE] 2Factor OTP sent successfully to +91 ${last10}`);
        return { success: true, provider: '2factor', response: response.data };
      }
    } catch (err) {
      console.error(`[SMS SERVICE] 2Factor API error:`, err.response?.data || err.message);
    }
  }

  // 3. TWILIO (Global Gateway)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      console.log(`[SMS SERVICE] Dispatching SMS via Twilio to +91 ${last10}...`);
      const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const message = await client.messages.create({
        body: `Your Taran Community Directory verification code is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${last10}`,
      });
      console.log(`[SMS SERVICE] Twilio message queued successfully, SID:`, message.sid);
      return { success: true, provider: 'twilio', sid: message.sid };
    } catch (err) {
      console.error(`[SMS SERVICE] Twilio API error:`, err.message);
    }
  }

  // No active SMS provider configured
  console.warn(`\n[SMS SERVICE NOTICE]`);
  console.warn(`No SMS Gateway API Key found in .env!`);
  console.warn(`To send actual SMS messages to user phones, please add one of the following to your .env:`);
  console.warn(`  - FAST2SMS_API_KEY=your_key_here (Get free testing credits at https://www.fast2sms.com)`);
  console.warn(`  - TWO_FACTOR_API_KEY=your_key_here`);
  console.warn(`  - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER`);
  console.warn(`For now, OTP is logged to server console: OTP = ${otp}\n`);

  return { success: false, provider: 'none', reason: 'No SMS gateway key configured in .env' };
}

module.exports = { sendSmsOtp };
