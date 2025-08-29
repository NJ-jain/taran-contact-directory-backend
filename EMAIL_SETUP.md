# Email Setup Guide for Forgot Password Functionality

This guide will help you set up Gmail authentication for the forgot password functionality using nodemailer.

## Prerequisites

1. A Gmail account
2. Google Cloud Console access (for OAuth 2.0)
3. 2-Step Verification enabled (for App Password)

## Setup Options

### Option 1: OAuth 2.0 (Recommended)

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Gmail API

2. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs (you can use `http://localhost:3000` for testing)
   - Note down the Client ID and Client Secret

3. **Generate Refresh Token:**
   - Use the Google OAuth 2.0 playground or a script to get the refresh token
   - You'll need to authorize your application and exchange the authorization code for a refresh token

4. **Environment Variables:**
   ```env
   GMAIL_USER=your_email@gmail.com
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REFRESH_TOKEN=your_refresh_token
   FRONTEND_URL=http://localhost:3000
   ```

### Option 2: App Password (Simpler)

1. **Enable 2-Step Verification:**
   - Go to your Google Account settings
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password:**
   - Go to "Security" > "2-Step Verification" > "App passwords"
   - Generate a new app password for "Mail"
   - Note down the 16-character password

3. **Environment Variables:**
   ```env
   GMAIL_USER=your_email@gmail.com
   GOOGLE_APP_PASSWORD=your_16_character_app_password
   FRONTEND_URL=http://localhost:3000
   ```

## API Endpoints

### Forgot Password
- **POST** `/api/auth/forgot-password`
- **Body:** `{ "email": "user@example.com" }`
- **Response:** `{ "message": "Password reset email sent successfully. Please check your email." }`

### Reset Password
- **POST** `/api/auth/reset-password`
- **Body:** `{ "token": "reset_token_from_email", "newPassword": "new_password" }`
- **Response:** `{ "message": "Password reset successfully" }`

## Testing

1. Start your server
2. Send a POST request to `/api/auth/forgot-password` with a valid email
3. Check the email for the reset link
4. Use the token from the email to reset the password via `/api/auth/reset-password`

## Troubleshooting

### Common Issues:

1. **"Less secure app access" error:**
   - This method is deprecated. Use OAuth 2.0 or App Password instead.

2. **"Invalid credentials" error:**
   - Check your environment variables
   - Ensure the Gmail account has the correct permissions

3. **"Too many recipients" error:**
   - Gmail has daily sending limits (500 for personal, 2000 for Workspace)
   - Consider using a dedicated email service for production

4. **OAuth token expired:**
   - Refresh tokens can expire. Generate a new one if needed.

## Production Considerations

For production applications, consider using dedicated email services like:
- SendGrid
- Postmark
- Amazon SES
- Mailgun

These services offer better deliverability, higher limits, and more reliable infrastructure than Gmail.
