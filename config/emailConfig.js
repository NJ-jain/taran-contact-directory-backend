const nodemailer = require('nodemailer');

// Create transporter with Gmail configuration
const createTransporter = () => {
  // Option 1: App Password configuration (Recommended & most reliable for Gmail)
  if (process.env.EMAIL_USER && process.env.GOOGLE_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.GOOGLE_APP_PASSWORD.replace(/\s+/g, ''),
      },
    });
  }

  // Option 2: OAuth 2.0 configuration
  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: process.env.GMAIL_ACCESS_TOKEN,
      },
    });
  }

  throw new Error('Email configuration not found. Please set GOOGLE_APP_PASSWORD in .env.');
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>You have requested to reset your password for your account.</p>
      <p>Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <p>Best regards,<br>Your Contact Directory Team</p>
    </div>
  `;

  return await sendEmail(email, 'Password Reset Request', html);
};

// Send OTP email
const sendOTPEmail = async (email, otp, isPasswordReset = false) => {
  const title = isPasswordReset ? 'Password Reset Verification Code' : 'Your Verification Code';
  const subject = isPasswordReset ? 'Password Reset Verification Code' : 'Your Verification Code';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${title}</h2>
      <p>Hello,</p>
      ${isPasswordReset ? '<p>You have requested to reset your password. Please use the verification code below:</p>' : '<p>Your verification code is:</p>'}
      <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 10px; padding: 20px; display: inline-block;">
          <h1 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        </div>
      </div>
      <p>This code will expire in 10 minutes for security reasons.</p>
      ${isPasswordReset ? '<p>Use this code to verify your identity and reset your password.</p>' : ''}
      <p>If you didn't request this code, please ignore this email.</p>
      <p>Best regards,<br>Your Contact Directory Team</p>
    </div>
  `;

  return await sendEmail(email, subject, html);
};

// Send welcome email (without plain-text password for security)
const sendWelcomeEmail = async (email) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb;">Welcome to Contact Directory!</h2>
      <p>Hello,</p>
      <p>Your account has been created successfully with <strong>${email}</strong>.</p>
      <p>You can now log in to manage your profile and view directory members:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Log In to Your Account
        </a>
      </div>
      <p>If you did not create this account, please contact our support team immediately.</p>
      <p>Best regards,<br>The Contact Directory Team</p>
    </div>
  `;

  return await sendEmail(email, 'Welcome to Contact Directory', html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  createTransporter
};
