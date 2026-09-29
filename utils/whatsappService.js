const axios = require('axios');

/**
 * Format a phone number for Meta WhatsApp Cloud API destination.
 * The database uses 10-digit Indian numbers (e.g. "8720056067").
 * WhatsApp requires the full international country-coded number without '+' or leading zeros (e.g. "918720056067").
 *
 * @param {string|number} phoneNumber 
 * @returns {string} Formatted phone number with country code (e.g. "918720056067")
 */
function formatWhatsAppDestination(phoneNumber) {
  if (!phoneNumber) return '';
  const digits = phoneNumber.toString().replace(/\D/g, '');
  
  // If 10 digits (standard Indian mobile number), prepend India country code 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  
  // If 11 digits starting with 0 (e.g., 08720056067), replace leading 0 with 91
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  
  // If already 12 digits starting with 91 (e.g., 918720056067), return as-is
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  
  return digits;
}

/**
 * Send an OTP via official Meta WhatsApp Cloud API using an approved AUTHENTICATION template.
 *
 * @param {string} phoneNumber - 10-digit phone number (or international format)
 * @param {string} otp - 6-digit numeric OTP string
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string, reason?: string, status?: number }>}
 */
async function sendWhatsAppOTP(phoneNumber, otp) {
  const recipientNumber = formatWhatsAppDestination(phoneNumber);

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';
  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || 'v21.0';

  // Validate presence of required Meta credentials
  if (!accessToken || !phoneNumberId || !templateName) {
    console.warn('[WHATSAPP SERVICE] Missing Meta credentials in environment variables (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, or WHATSAPP_TEMPLATE_NAME).');
    return {
      success: false,
      reason: 'MISSING_CREDENTIALS',
      error: 'WhatsApp Cloud API credentials are not configured in environment variables.'
    };
  }

  const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  // Build the official Meta WhatsApp Authentication template payload
  // Meta Authentication templates strictly require:
  // 1. Body component with the OTP code parameter
  // 2. Button component (sub_type: "url", index: "0") passing the OTP code for the Copy Code button
  const components = [
    {
      type: 'body',
      parameters: [
        {
          type: 'text',
          text: String(otp)
        }
      ]
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [
        {
          type: 'text',
          text: String(otp)
        }
      ]
    }
  ];

  // If WHATSAPP_TEMPLATE_HAS_BUTTON is explicitly set to 'false' (for custom body-only templates)
  if (process.env.WHATSAPP_TEMPLATE_HAS_BUTTON === 'false') {
    components.splice(1, 1);
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientNumber,
    type: 'template',
    template: {
      name: templateName.trim(),
      language: {
        code: templateLang.trim()
      },
      components
    }
  };

  try {
    const maskedPhone = recipientNumber.slice(0, 4) + '******' + recipientNumber.slice(-2);
    console.log(`[WHATSAPP SERVICE] Dispatching OTP via Meta Cloud API (${apiVersion}) to +${maskedPhone} using template '${templateName}'...`);

    const response = await axios.post(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    const messageId = response.data?.messages?.[0]?.id;
    console.log(`[WHATSAPP SERVICE] Message accepted by Meta. WhatsApp Message ID: ${messageId}`);

    return {
      success: true,
      provider: 'meta_whatsapp',
      messageId,
      recipient: recipientNumber
    };
  } catch (error) {
    // SECURITY: Strictly log sanitized error details. Never log the access token or full auth header!
    const metaError = error.response?.data?.error;
    console.error('[WHATSAPP SERVICE] Meta Cloud API dispatch failed:', {
      status: error.response?.status,
      message: metaError?.message || error.message,
      type: metaError?.type,
      code: metaError?.code,
      error_subcode: metaError?.error_subcode,
      fbtrace_id: metaError?.fbtrace_id
    });

    return {
      success: false,
      provider: 'meta_whatsapp',
      error: metaError?.message || error.message,
      code: metaError?.code,
      status: error.response?.status
    };
  }
}

module.exports = {
  sendWhatsAppOTP,
  formatWhatsAppDestination
};
