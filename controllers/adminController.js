const Member = require('../models/memberModel');
const User = require('../models/userModel');
const Admin = require('../models/adminModel'); // Assuming you have an Admin model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminController = {
  // ... existing code ...

  // Method to approve a member
  approveMember: async (req, res) => {
    try {
      const memberId = req.params.memberId;
      const member = await Member.findById(memberId);
      
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Toggle the isApproved value
      const updatedMember = await Member.findByIdAndUpdate(
        memberId, 
        { isApproved: !member.isApproved }, 
        { new: true }
      );

      // Update the User model to reflect the toggle
      await User.updateOne(
        { _id: member.userId, 'members._id': memberId },
        { '$set': { 'members.$.isApproved': !member.isApproved } }
      );

      res.status(200).json({ message: 'Member approval status updated successfully', member: updatedMember });
    } catch (error) {
      res.status(500).json({ message: 'Error updating member approval status', error: error.message });
    }
  },

  createAdmin: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new Admin.Admin({ username, email, password: hashedPassword });
      await newAdmin.save();
      res.status(201).json({ message: 'Admin created successfully', newAdmin });
    } catch (error) {
      res.status(500).json({ message: 'Error creating admin', error: error.message });
    }
  },

  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;
      const admin = await Admin.Admin.findOne({ email });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: admin._id }, 'your_jwt_secret', { expiresIn: '1h' });
      res.status(200).json({ message: 'Admin logged in successfully', token });
    } catch (error) {
      res.status(500).json({ message: 'Error logging in admin', error: error.message });
    }
  },

  // ... existing code ...

  // Method to get all userArray from an Admin with populated user data
  getAllUsersFromAdmin: async (req, res) => {
    try {
      // Find the global user array and populate user data
      const globalUserArray = await Admin.GlobalUserArray.findOne()
        .populate({
          path: 'userArray',
          model: 'User',
          select: '-password', // Exclude password but include all other fields
        });

      if (!globalUserArray) {
        return res.status(404).json({ 
          success: false,
          message: 'No global user array found' 
        });
      }

      if (!globalUserArray.userArray || globalUserArray.userArray.length === 0) {
        return res.status(200).json({ 
          success: true,
          message: 'No users found',
          userArray: [] 
        });
      }

      res.status(200).json({ 
        success: true,
        message: 'Users fetched successfully',
        totalUsers: globalUserArray.userArray.length,
        userArray: globalUserArray.userArray.map(user => ({
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
      
      // Find the user and populate their members
      const user = await User.findById(userId)
        .populate({
          path: 'membersArray',
          model: 'Member',
          select: '-__v' // Exclude version field
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
  },

  // ... You can add more admin methods as needed ...
};

module.exports = adminController;