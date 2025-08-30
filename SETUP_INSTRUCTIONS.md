# 🔧 Environment Setup Instructions

## Prerequisites
- Node.js installed
- MongoDB database
- Gmail account with OAuth2 setup

## Setup Steps

### 1. Run the setup script
```bash
node setup-env.js
```

This will create a `.env` file with placeholder values.

### 2. Configure your environment variables
Edit the `.env` file and replace the placeholder values with your actual credentials:

#### Database Configuration
- `MONGODB_URI`: Your MongoDB connection string

#### JWT Configuration  
- `JWT_SECRET`: A secure random string for JWT token signing

#### Email Configuration (Gmail OAuth2)
- `EMAIL_USER`: Your Gmail address
- `GMAIL_CLIENT_ID`: Your Gmail OAuth2 client ID
- `GMAIL_CLIENT_SECRET`: Your Gmail OAuth2 client secret
- `GMAIL_REFRESH_TOKEN`: Your Gmail OAuth2 refresh token
- `GMAIL_ACCESS_TOKEN`: Your Gmail OAuth2 access token

#### Frontend Configuration
- `FRONTEND_URL`: Your frontend application URL
- `TEST_EMAIL`: Email address for testing email functionality

### 3. Gmail OAuth2 Setup
To get Gmail OAuth2 credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API
4. Create OAuth2 credentials
5. Download the credentials JSON file
6. Use the OAuth2 playground to get refresh and access tokens

### 4. Test the setup
```bash
npm run test-email
```

## Security Notes
- Never commit `.env` files or files containing real credentials
- The `setup-env.js` file is now a template and safe to commit
- Keep your actual credentials secure and private
