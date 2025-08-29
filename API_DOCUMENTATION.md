# Email API Documentation

## Overview
This API provides email functionality for password reset, OTP verification, and welcome emails using Gmail OAuth2.

## Base URL
```
http://localhost:5000/api/auth
```

## Authentication
Most endpoints require no authentication except for protected routes.

## Email Endpoints

### 1. Send Password Reset OTP
**POST** `/forgot-password`

Sends a 6-digit OTP to the user's email for password reset verification.

**Request Body:**
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

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "nn.jain5272@gmail.com"}'
```

### 2. Verify OTP and Reset Password
**POST** `/verify-otp`

Verifies the OTP and optionally resets the password.

**Request Body (Verify Only):**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Request Body (Verify and Reset Password):**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "new_secure_password"
}
```

**Response (Verify Only):**
```json
{
  "message": "OTP verified successfully. You can now reset your password."
}
```

**Response (Verify and Reset):**
```json
{
  "message": "OTP verified and password reset successfully"
}
```

**Example (Verify and Reset):**
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nn.jain5272@gmail.com",
    "otp": "123456",
    "newPassword": "newPassword123"
  }'
```

### 3. Send OTP
**POST** `/send-otp`

Sends a 6-digit OTP to the user's email for verification.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully. Please check your email."
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "nn.jain5272@gmail.com"}'
```

### 4. Verify OTP
**POST** `/verify-otp`

Verifies the OTP sent to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "OTP verified successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nn.jain5272@gmail.com",
    "otp": "123456"
  }'
```

### 5. User Registration (with Welcome Email)
**POST** `/register`

Registers a new user and sends a welcome email with credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "category": "family",
  "aboutUs": "About our family"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "category": "family"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securePassword123",
    "category": "family",
    "aboutUs": "We are a happy family"
  }'
```

## Email Templates

### Password Reset OTP Email
- **Subject:** "Password Reset Verification Code"
- **Content:** Professional HTML template with 6-digit OTP display
- **Expiration:** 10 minutes
- **Purpose:** Password reset verification

### General OTP Email
- **Subject:** "Your Verification Code"
- **Content:** Large, styled 6-digit OTP display
- **Expiration:** 10 minutes
- **Purpose:** General verification

### Welcome Email
- **Subject:** "Welcome to Contact Directory!"
- **Content:** Login credentials and welcome message
- **Security:** Includes password in plain text (for initial setup)

## Error Responses

### Common Error Codes

**400 Bad Request**
```json
{
  "message": "Invalid email or password"
}
```

**404 Not Found**
```json
{
  "message": "User not found with this email address"
}
```

**500 Internal Server Error**
```json
{
  "message": "Error sending password reset email",
  "error": "Detailed error message"
}
```

## Testing

### Test Email Functionality
```bash
npm run test-email
```

This will send test emails to verify:
1. Password reset email
2. OTP email
3. Welcome email

### Environment Variables Required
```env
EMAIL_USER=nn.jain5272@gmail.com
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_ACCESS_TOKEN=your_access_token
FRONTEND_URL=http://localhost:3000
TEST_EMAIL=nn.jain5272@gmail.com
```

## Security Features

1. **Secure Token Generation:** Uses crypto.randomBytes for reset tokens
2. **Token Hashing:** Reset tokens are hashed before storage
3. **Expiration:** All tokens have configurable expiration times
4. **OTP Cleanup:** OTP is cleared after successful verification
5. **Rate Limiting:** Consider implementing rate limiting for production

## Production Considerations

1. **Email Service:** Consider using dedicated email services (SendGrid, Postmark, etc.)
2. **Rate Limiting:** Implement rate limiting to prevent abuse
3. **Logging:** Add comprehensive logging for email operations
4. **Monitoring:** Set up monitoring for email delivery rates
5. **Backup:** Implement backup email sending mechanisms

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error:**
   - Check OAuth2 credentials in environment variables
   - Verify access token hasn't expired

2. **"User not found" error:**
   - Ensure the email exists in the database
   - Check email format

3. **"Token expired" error:**
   - Tokens expire after 1 hour (reset) or 10 minutes (OTP)
   - Request a new token

4. **Email not received:**
   - Check spam folder
   - Verify email address is correct
   - Check Gmail sending limits
