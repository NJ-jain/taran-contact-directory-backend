const Member = require('../models/memberModel');
const User = require('../models/userModel');
const { uploadToImageKit, deleteFromImageKit } = require('../utils/imageKit');
const multer = require('multer');
const mongoose = require('mongoose'); // Added for mongoose connection check

// Configure multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

const memberController = {
  // Create a new member
// ... existing code ...
createMember: [
  upload.fields([
    { name: 'dp', maxCount: 1 }, // File field
    { name: 'firstName' }, // Text fields
    { name: 'lastName' },
    { name: 'email' },
    { name: 'phoneNumber' },
    { name: 'address' },
    { name: 'familyHead' },
    {name : 'dob'}
  ]),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        familyHead,
        dob
      } = req.body;

      // Check if member with this email already exists
      if (await Member.exists({ email })) {
        return res.status(400).json({ message: 'Member with this email already exists' });
      }

      // Create and save new member
      const newMember = new Member({
        firstName,
        lastName,
        email,
        phoneNumber,
        dob,
        address,
        userId: req.userId, // From auth middleware
        familyHead: familyHead === 'true' // Convert string to boolean
      });
      const savedMember = await newMember.save();

      // Upload dp to ImageKit if provided
      if (req.files.dp) {
        try {
          const dpUrl = await uploadToImageKit(req.files.dp[0], savedMember.id.toString(), "members");
          savedMember.dp = dpUrl;
          await savedMember.save();
        } catch (error) {
          return res.status(500).json({ message: 'Error uploading image', error: error.message });
        }
      }

      // Update user's membersArray and familyHeadId in a single operation
      const updateData = { $push: { membersArray: savedMember._id } };
      if (familyHead === 'true') {
        updateData.familyHeadId = savedMember._id;
      }
      await User.findByIdAndUpdate(req.userId, updateData);

      // Fetch the updated user data
      const user = await User.findById(req.userId)
        .select('-password') // Exclude password from the result
        .populate({ path: 'membersArray', model: 'Member', strictPopulate: false });

      res.status(201).json(user);

    } catch (error) {
      res.status(500).json({ message: 'Error creating member', error: error.message });
    }
  }
],
// ... existing code ...

  // Get all members for a user
  getAllMembers: async (req, res) => {
    try {
      console.log('getAllMembers called - checking database connection...');
      
      // Check if we can connect to the database
      if (mongoose.connection.readyState !== 1) {
        console.error('Database not connected. Ready state:', mongoose.connection.readyState);
        return res.status(500).json({ 
          message: 'Database connection error', 
          error: 'Database not connected',
          readyState: mongoose.connection.readyState
        });
      }
      
      console.log('Database connected, querying members...');
      
      // Only fetch members that have been approved
      const members = await Member.find({ isApproved: true });
      
      console.log(`Found ${members.length} approved members`);
      
      res.status(200).json(members);
    } catch (error) {
      console.error('Error in getAllMembers:', error);
      res.status(500).json({ 
        message: 'Error fetching members', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Get single member
  getMember: async (req, res) => {
    try {
      const member = await Member.findOne({ _id: req.params.memberId })
        .populate({
          path: 'userId',
          select: '-password', // Exclude the password field
          populate: {
            path: 'membersArray',
            match: { _id: { $ne: req.params.memberId } } // Exclude the current member
          }
        });

      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      res.status(200).json({ member });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching member', error: error.message });
    }
  },

  // Update member
  updateMember: [
    upload.single('dp'),
    async (req, res) => {
      try {
        const updates = {};
        const { firstName, lastName, email, phoneNumber, address, familyHead , dob} = req.body;

        // Collect updates
        if (firstName) updates.firstName = firstName;
        if (lastName) updates.lastName = lastName;
        if (email) updates.email = email;
        if (phoneNumber) updates.phoneNumber = phoneNumber;
        if (address) updates.address = address;
        if (familyHead !== undefined) updates.familyHead = familyHead === 'true';
        if (dob) updates.dob = dob;

        // Check if member exists
        const existingMember = await Member.findOne({ _id: req.params.memberId, userId: req.userId });
        if (!existingMember) {
          return res.status(404).json({ message: 'Member not found' });
        }

        // Handle image upload
        if (req.file) {
          try {
            const dpUrl = await uploadToImageKit(req.file, req.params.memberId, "members");
            updates.dp = dpUrl;
          } catch (error) {
            return res.status(500).json({ message: 'Error uploading image', error: error.message });
          }
        }

        // Update familyHeadId if necessary
        if (updates.familyHead !== undefined) {
          const userUpdate = updates.familyHead ? { familyHeadId: existingMember._id } : { familyHeadId: null };
          await User.findByIdAndUpdate(req.userId, userUpdate);
        }

        // Apply updates
        await Member.findOneAndUpdate(
          { _id: req.params.memberId, userId: req.userId },
          updates,
          { new: true }
        );

        // Fetch the updated user data
        const user = await User.findById(req.userId)
          .select('-password') // Exclude password from the result
          .populate({ path: 'membersArray', model: 'Member', strictPopulate: false });

        res.status(200).json(user);

      } catch (error) {
        res.status(500).json({ message: 'Error updating member', error: error.message });
      }
    }
  ],

  // Delete member
  deleteMember: async (req, res) => {
    try {
      const member = await Member.findOneAndDelete({ _id: req.params.memberId, userId: req.userId });
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Update user's membersArray and familyHeadId
      const updateData = { $pull: { membersArray: req.params.memberId } };
      if (member.familyHead) {
        updateData.familyHeadId = null;
      }
      await User.findByIdAndUpdate(req.userId, updateData);

      // Delete dp from ImageKit
      try {
        await deleteFromImageKit(member._id.toString(), "members");
      } catch (error) {
        console.error('Error deleting image from ImageKit:', error);
      }

      // Fetch the updated user data
      const user = await User.findById(req.userId);

      res.status(200).json({ message: 'Member deleted successfully', member, user });

    } catch (error) {
      res.status(500).json({ message: 'Error deleting member', error: error.message });
    }
  },

  // Search members
searchMembers: async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const searchResults = await Member.find({
      isApproved: true,
      $or: [
        { phoneNumber: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { address: { $regex: searchQuery, $options: 'i' } }
      ]
    });
    res.status(200).json(searchResults);
  } catch (error) {
    res.status(500).json({ message: 'Error searching members', error: error.message });
  }
}

};

module.exports = memberController;