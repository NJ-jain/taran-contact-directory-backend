# Password Reset Flow with OTP Verification

## Overview
This system implements a secure password reset flow using OTP (One-Time Password) verification through email.

## Flow Diagram
```
User Requests Password Reset
           ↓
    Send OTP via Email
           ↓
    User Enters OTP
           ↓
    Verify OTP + Reset Password
           ↓
    Password Successfully Reset
```

## Step-by-Step Process

### Step 1: Request Password Reset
**Endpoint:** `POST /api/auth/forgot-password`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully. Please check your email to verify and reset your password."
}
```

**What happens:**
1. System checks if user exists
2. Generates 6-digit OTP
3. Saves OTP to user record with 10-minute expiration
4. Sends OTP email with password reset context

### Step 2: Verify OTP and Reset Password
**Endpoint:** `POST /api/auth/verify-otp`

**Request (with password reset):**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "message": "OTP verified and password reset successfully"
}
```

**What happens:**
1. System validates OTP and expiration
2. Hashes the new password
3. Updates user password
4. Clears OTP from user record
5. Returns success message

## API Endpoints

### 1. Forgot Password (Send OTP)
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 2. Verify OTP and Reset Password
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

### 3. Verify OTP Only (Optional)
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

## Email Templates

### Password Reset OTP Email
- **Subject:** "Password Reset Verification Code"
- **Content:** Professional HTML template with 6-digit OTP
- **Expiration:** 10 minutes
- **Security:** Clear indication it's for password reset

## Security Features

1. **OTP Generation:** 6-digit random number
2. **Expiration:** 10-minute timeout
3. **One-time Use:** OTP is cleared after verification
4. **Email Verification:** OTP sent to registered email
5. **Password Hashing:** New password is securely hashed
6. **User Validation:** Checks if user exists before sending OTP

## Testing

### Test Email Templates
```bash
npm run test-email
```

### Test Complete Flow
```bash
npm run test-password-reset
```

## Error Handling

### Common Error Responses

**404 - User Not Found**
```json
{
  "message": "User not found with this email address"
}
```

**400 - Invalid/Expired OTP**
```json
{
  "message": "Invalid or expired OTP"
}
```

**500 - Server Error**
```json
{
  "message": "Error sending OTP",
  "error": "Detailed error message"
}
```

## Frontend Integration

### Example React Component Flow

```javascript
// Step 1: Request OTP
const requestOTP = async (email) => {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json();
};

// Step 2: Verify OTP and Reset Password
const resetPassword = async (email, otp, newPassword) => {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword })
  });
  return response.json();
};
```

## User Experience Flow

1. **User clicks "Forgot Password"**
2. **User enters email address**
3. **System sends OTP email**
4. **User receives email with 6-digit code**
5. **User enters OTP and new password**
6. **System verifies OTP and updates password**
7. **User can now login with new password**

## Benefits of This Approach

1. **Enhanced Security:** OTP verification adds extra layer
2. **User-Friendly:** Simple 6-digit code instead of complex tokens
3. **Time-Limited:** 10-minute expiration prevents abuse
4. **Email-Based:** Uses existing email for verification
5. **One-Step Process:** Verify and reset in single request
6. **Clear Communication:** Email clearly indicates purpose

## Production Considerations

1. **Rate Limiting:** Implement rate limiting for OTP requests
2. **Email Delivery:** Monitor email delivery rates
3. **OTP Storage:** Consider using Redis for OTP storage
4. **Logging:** Log all password reset attempts
5. **Monitoring:** Set up alerts for failed attempts
6. **Backup:** Implement backup email service

## Troubleshooting

### OTP Not Received
- Check spam folder
- Verify email address is correct
- Check Gmail sending limits
- Ensure user exists in database

### OTP Expired
- Request new OTP
- OTP expires after 10 minutes
- Each new OTP invalidates previous ones

### Invalid OTP
- Double-check the 6-digit code
- Ensure no extra spaces
- Check if OTP was already used
