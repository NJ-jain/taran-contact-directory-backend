const User = require('../models/userModel');
const Member = require('../models/memberModel');
const PhoneOtp = require('../models/phoneOtpModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPEmail, sendWelcomeEmail } = require('../config/emailConfig');
const { sendSmsOtp } = require('../utils/smsService');

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

      // Send OTP email
      await sendOTPEmail(normalizedEmail, otp, true);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully. Please check your email to verify and reset your password.'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ success: false, message: 'Error sending OTP', error: error.message });
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

      await sendOTPEmail(normalizedEmail, otp, false);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully. Please check your email.'
      });

    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ success: false, message: 'Error sending OTP', error: error.message });
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

  // Send OTP to phone number (Verified directory members only)
  sendPhoneOTP: async (req, res) => {
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
      }).populate('userId', 'email category banner aboutUs');

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Phone number not registered in the directory. Only verified community members can access the contact directory.'
        });
      }

      // Rate limiting: 60-second cooldown per phone number
      const existingOtp = await PhoneOtp.findOne({
        phoneNumber: last10,
        createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
      });

      if (existingOtp) {
        return res.status(429).json({
          success: false,
          message: 'Please wait 60 seconds before requesting another OTP.'
        });
      }

      // Generate secure 6-digit OTP
      const otp = crypto.randomInt(100000, 1000000).toString();

      // Clear any prior OTPs for this number and save fresh OTP
      await PhoneOtp.deleteMany({ phoneNumber: last10 });
      const phoneOtpRecord = new PhoneOtp({
        phoneNumber: last10,
        otp,
        memberId: member._id,
        userId: member.userId ? (member.userId._id || member.userId) : undefined,
        attempts: 0
      });
      await phoneOtpRecord.save();

      // Log OTP to server console for testing/development
      console.log(`\n======================================================`);
      console.log(`[COMMUNITY PHONE OTP GENERATED]`);
      console.log(`Member: ${member.firstName} ${member.lastName}`);
      console.log(`Phone:  ${last10}`);
      console.log(`OTP:    ${otp}`);
      // Send real SMS to mobile phone (Fast2SMS, 2Factor, Twilio)
      let smsResult = { success: false, provider: 'none' };
      try {
        smsResult = await sendSmsOtp(last10, otp, member.firstName);
      } catch (smsError) {
        console.error('[PHONE OTP] SMS dispatch error:', smsError.message);
      }

      // If email exists, send backup email with OTP
      const targetEmail = member.email || member.userId?.email;
      if (targetEmail) {
        try {
          await sendOTPEmail(targetEmail, otp, false);
        } catch (emailErr) {
          console.warn('[PHONE OTP] Backup email notification failed:', emailErr.message);
        }
      }

      const responsePayload = {
        success: true,
        message: `OTP sent successfully to registered number ending in ...${last10.slice(-4)}`,
        phoneNumber: last10,
        memberName: `${member.firstName} ${member.lastName}`.trim(),
        smsDelivered: smsResult.success
      };

      // Return devOtp in development or if explicitly allowed for testing in production
      if (process.env.NODE_ENV !== 'production' || process.env.SHOW_DEV_OTP_IN_PROD === 'true') {
        responsePayload.devOtp = otp;
      }

      return res.status(200).json(responsePayload);

    } catch (error) {
      console.error('Send Phone OTP error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error sending OTP to phone number', 
        error: error.message 
      });
    }
  },

  // Verify Phone OTP and log in community member
  verifyPhoneOTP: async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      if (!phoneNumber || !otp) {
        return res.status(400).json({ 
          success: false, 
          message: 'Phone number and OTP code are required' 
        });
      }

      const digitsOnly = phoneNumber.toString().replace(/\D/g, '');
      const last10 = digitsOnly.slice(-10);

      const otpRecord = await PhoneOtp.findOne({ phoneNumber: last10 });
      if (!otpRecord) {
        return res.status(400).json({ 
          success: false, 
          message: 'OTP has expired or was not requested. Please request a new OTP.' 
        });
      }

      // Check brute-force attempts
      if (otpRecord.attempts >= 5) {
        await PhoneOtp.deleteOne({ _id: otpRecord._id });
        return res.status(429).json({ 
          success: false, 
          message: 'Too many incorrect attempts. Please request a new OTP.' 
        });
      }

      // Verify OTP code
      if (otpRecord.otp !== otp.toString().trim()) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const attemptsLeft = 5 - otpRecord.attempts;
        return res.status(400).json({ 
          success: false, 
          message: `Invalid OTP code. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.` 
        });
      }

      // OTP is valid - consume it
      await PhoneOtp.deleteOne({ _id: otpRecord._id });

      // Fetch the full member and associated user
      const member = await Member.findById(otpRecord.memberId).populate({
        path: 'userId',
        select: '-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires',
        populate: { path: 'membersArray', model: 'Member' }
      });

      if (!member || !member.isApproved) {
        return res.status(403).json({ 
          success: false, 
          message: 'Member account is inactive or not approved.' 
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
        message: 'Phone number verified successfully',
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
      console.error('Verify Phone OTP error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error verifying OTP', 
        error: error.message 
      });
    }
  }
};

module.exports = authController;