const User = require('../models/userModel');
const Member = require('../models/memberModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPEmail, sendWelcomeEmail } = require('../config/emailConfig');

const JWT_EXPIRATION = '24h';

const authController = {
  // Register a new user  
  register: async (req, res) => {
    try {
      const { email, password, category, aboutUs } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      }

      // Check if user already exists
      const normalizedEmail = email.toLowerCase().trim();
      if (await User.exists({ email: normalizedEmail })) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      // Hash the password with 12 rounds and create new user
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = new User({
        email: normalizedEmail,
        password: hashedPassword,
        category: category || '',
        aboutUs: aboutUs || '',
        membersArray: [],
      });

      const savedUser = await newUser.save();

      if (!process.env.JWT_SECRET) {
        console.error('CRITICAL: JWT_SECRET environment variable is missing!');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
      }

      const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION });

      // Send welcome email (safe, no cleartext password)
      try {
        await sendWelcomeEmail(normalizedEmail);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError.message);
        // Do not fail registration if email provider has an issue
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: savedUser._id,
          email: savedUser.email,
          category: savedUser.category
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Error registering user', error: error.message });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (!process.env.JWT_SECRET) {
        console.error('CRITICAL: JWT_SECRET environment variable is missing!');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          category: user.category
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
    }
  },

  // Forgot password - Send cryptographically secure OTP
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        // Return a generic success to prevent email enumeration
        return res.status(200).json({ 
          success: true, 
          message: 'If an account exists with this email, an OTP has been sent.' 
        });
      }

      // Generate cryptographically secure 6-digit OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Send real OTP email via Nodemailer
      await sendOTPEmail(normalizedEmail, otp, true);

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully. Please check your email inbox to verify and reset your password.'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      const isAuthError = error.code === 'EAUTH' || (error.message && error.message.includes('invalid_grant'));
      return res.status(500).json({ 
        success: false, 
        message: isAuthError 
          ? 'Gmail authentication failed (invalid_grant). Please set a valid GOOGLE_APP_PASSWORD in backend/.env' 
          : (error.message || 'Error sending OTP')
      });
    }
  },

  // Send OTP (general purpose)
  sendOTP: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found with this email address' });
      }

      // Generate cryptographically secure 6-digit OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n======================================================`);
        console.log(`[OTP GENERATED - DEV MODE]`);
        console.log(`Email: ${normalizedEmail}`);
        console.log(`OTP:   ${otp}`);
        console.log(`======================================================\n`);
      }

      let emailSent = false;
      try {
        await sendOTPEmail(normalizedEmail, otp, false);
        emailSent = true;
      } catch (err) {
        console.error('OTP email dispatch failed:', err.message);
      }

      if (!emailSent && process.env.NODE_ENV !== 'production') {
        return res.status(200).json({
          success: true,
          message: 'OTP generated. Check terminal logs for dev OTP.',
          devOtp: otp
        });
      }

      if (!emailSent) {
        return res.status(500).json({ 
          success: false, 
          message: 'Unable to deliver OTP email.' 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully. Please check your email.'
      });

    } catch (error) {
      console.error('Send OTP error:', error);
      return res.status(500).json({ success: false, message: 'Error sending OTP', error: error.message });
    }
  },

  // Verify OTP and reset password
  verifyOTP: async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({
        email: normalizedEmail,
        otp: otp.trim(),
        otpExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      // If newPassword is provided, reset the password
      if (newPassword) {
        if (newPassword.length < 8) {
          return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        return res.status(200).json({
          success: true,
          message: 'OTP verified and password reset successfully'
        });
      } else {
        // Just verify OTP without password reset
        return res.status(200).json({
          success: true,
          message: 'OTP verified successfully. You can now reset your password.'
        });
      }

    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ success: false, message: 'Error verifying OTP', error: error.message });
    }
  },

  // Direct Phone Login for verified directory members (No OTP required)
  phoneLogin: async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ 
          success: false, 
          message: 'Phone number is required' 
        });
      }

      // Extract last 10 digits
      const digitsOnly = phoneNumber.toString().replace(/\D/g, '');
      const last10 = digitsOnly.slice(-10);

      if (last10.length !== 10) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide a valid 10-digit phone number' 
        });
      }

      // Check if phone number exists for an approved member in the directory
      const member = await Member.findOne({
        isApproved: true,
        phoneNumber: { $regex: last10 + '$' }
      }).populate({
        path: 'userId',
        select: '-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires',
        populate: { path: 'membersArray', model: 'Member' }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Phone number not registered in the directory. Only verified community members can access the contact directory.'
        });
      }

      if (!process.env.JWT_SECRET) {
        console.error('CRITICAL: JWT_SECRET environment variable is missing!');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
      }

      // Effective userId for compatibility with all existing user endpoints
      const effectiveUserId = member.userId ? (member.userId._id || member.userId).toString() : member._id.toString();

      const tokenPayload = {
        userId: effectiveUserId,
        memberId: member._id.toString(),
        phoneNumber: last10,
        role: 'member',
        name: `${member.firstName} ${member.lastName}`.trim()
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

      // Return session data compatible with frontend Redux store
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        member: {
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phoneNumber: member.phoneNumber,
          address: member.address,
          dp: member.dp,
          familyHead: member.familyHead,
          isApproved: member.isApproved,
          dob: member.dob,
          userId: member.userId?._id || member.userId
        },
        user: member.userId || {
          _id: effectiveUserId,
          email: member.email || `${last10}@taran.community`,
          membersArray: [member]
        }
      });

    } catch (error) {
      console.error('Phone login error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error logging in with phone number', 
        error: error.message 
      });
    }
  },

  // Backwards compatibility aliases
  sendPhoneOTP: async (req, res) => {
    return authController.phoneLogin(req, res);
  },

  verifyPhoneOTP: async (req, res) => {
    return authController.phoneLogin(req, res);
  }
};

module.exports = authController;