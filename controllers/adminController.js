const Member = require('../models/memberModel');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminController = {
  // Method to approve or revoke a member
  approveMember: async (req, res) => {
    try {
      const memberId = req.params.memberId;
      const member = await Member.findById(memberId);
      
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }

      // Toggle the isApproved value
      const updatedMember = await Member.findByIdAndUpdate(
        memberId, 
        { isApproved: !member.isApproved }, 
        { new: true }
      );

      res.status(200).json({ 
        success: true, 
        message: 'Member approval status updated successfully', 
        member: updatedMember 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error updating member approval status', error: error.message });
    }
  },

  // Create a new admin with required secret key
  createAdmin: async (req, res) => {
    try {
      const { username, email, password, adminSecretKey } = req.body;
      const keyProvided = adminSecretKey || req.headers['x-admin-secret-key'];

      // Protect admin creation with secret key
      const expectedSecret = process.env.ADMIN_REGISTRATION_SECRET;
      if (expectedSecret && keyProvided !== expectedSecret) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized: Valid administrative registration secret is required' 
        });
      }

      if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      }

      const existingAdmin = await Admin.Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ success: false, message: 'Admin with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newAdmin = new Admin.Admin({ username, email, password: hashedPassword });
      await newAdmin.save();

      res.status(201).json({ 
        success: true, 
        message: 'Admin created successfully', 
        admin: {
          id: newAdmin._id,
          username: newAdmin.username,
          email: newAdmin.email
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error creating admin', error: error.message });
    }
  },

  // Authenticate an admin and issue secure token
  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const admin = await Admin.Admin.findOne({ email });
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
      if (!secret) {
        console.error('CRITICAL: Neither ADMIN_JWT_SECRET nor JWT_SECRET is configured!');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
      }

      const token = jwt.sign(
        { id: admin._id, email: admin.email, role: 'admin' }, 
        secret, 
        { expiresIn: '8h' }
      );

      res.status(200).json({ 
        success: true, 
        message: 'Admin logged in successfully', 
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          username: admin.username
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error logging in admin', error: error.message });
    }
  },

  // Method to get all users for an admin with robust fallback
  getAllUsersFromAdmin: async (req, res) => {
    try {
      let users = [];
      const globalUserArray = await Admin.GlobalUserArray.findOne()
        .populate({
          path: 'userArray',
          model: 'User',
          select: '-password',
        });

      if (globalUserArray && globalUserArray.userArray && globalUserArray.userArray.length > 0) {
        users = globalUserArray.userArray;
      } else {
        // Fallback directly to the User collection so data is never lost
        users = await User.find().select('-password').sort({ createdAt: -1 });
      }

      res.status(200).json({ 
        success: true, 
        message: 'Users fetched successfully', 
        totalUsers: users.length, 
        userArray: users.map(user => ({
          _id: user._id,
          email: user.email,
          category: user.category,
          aboutUs: user.aboutUs,
          banner: user.banner,
          membersArray: user.membersArray,
          familyHeadId: user.familyHeadId,
          createdAt: user.createdAt
        }))
      });

    } catch (error) {
      console.error('Error in getAllUsersFromAdmin:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching user array', 
        error: error.message 
      });
    }
  },

  // Method to get all members for a specific user
  getUserMembers: async (req, res) => {
    try {
      const userId = req.params.userId;
      
      const user = await User.findById(userId)
        .populate({
          path: 'membersArray',
          model: 'Member',
          select: '-__v'
        });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.status(200).json({ 
        success: true, 
        message: 'User members fetched successfully', 
        totalMembers: user.membersArray.length, 
        members: user.membersArray 
      });

    } catch (error) {
      console.error('Error in getUserMembers:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching user members', 
        error: error.message 
      });
    }
  }
};

module.exports = adminController;