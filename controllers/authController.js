const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail, sendOTPEmail, sendWelcomeEmail } = require('../config/emailConfig');
require('dotenv');

const JWT_EXPIRATION = '24h';


const authController = {
  // Register a new user  
  register: async (req, res) => {
    try {
      const { email, password, category, aboutUs } = req.body;

      // Check if user already exists
      if (await User.exists({ email })) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash the password and create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        email,
        password: hashedPassword,
        category,
        aboutUs,
        membersArray: [],
      });
      const jwt = require('jsonwebtoken');
      // Save user to database and create JWT token
      const savedUser = await newUser.save();
      // const token = jwt.sign({ userId: savedUser.id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
      const token = jwt.sign({ userId: savedUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Send welcome email with password
      try {
        await sendWelcomeEmail(email, password);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail registration if email fails
      }

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: savedUser._id,
          email: savedUser.email,
          category: savedUser.category
        }
      });

    } catch (error) {
      res.status(500).json({ message: 'Error registering user', error: error.message });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Create JWT token
      const token = jwt.sign({ userId: user._id },process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION });

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          category: user.category
        }
      });

    } catch (error) {
      res.status(500).json({ message: 'Error logging in', error: error.message });
    }
  },

  // Forgot password - Send OTP
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found with this email address' });
      }

      // Generate OTP (6 digits)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Save OTP to user
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Send OTP email for password reset
      await sendOTPEmail(email, otp, true);

      res.status(200).json({
        message: 'OTP sent successfully. Please check your email to verify and reset your password.'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
  },

  // Reset password (legacy - kept for backward compatibility)
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // Hash the reset token to compare with stored token
      const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        resetPasswordToken: resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and clear reset token
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({
        message: 'Password reset successfully'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
  },

  // Send OTP
  sendOTP: async (req, res) => {
    try {
      const { email } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found with this email address' });
      }

      // Generate OTP (6 digits)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Save OTP to user
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Send OTP email (general purpose)
      await sendOTPEmail(email, otp, false);

      res.status(200).json({
        message: 'OTP sent successfully. Please check your email.'
      });

    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
  },

  // Verify OTP and allow password reset
  verifyOTP: async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      // Find user with valid OTP
      const user = await User.findOne({
        email: email,
        otp: otp,
        otpExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      // If newPassword is provided, reset the password
      if (newPassword) {
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update user password and clear OTP
        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({
          message: 'OTP verified and password reset successfully'
        });
      } else {
        // Just verify OTP without password reset
        // Clear OTP after successful verification
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({
          message: 'OTP verified successfully. You can now reset your password.'
        });
      }

    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ message: 'Error verifying OTP', error: error.message });
    }
  }
};

module.exports = authController;