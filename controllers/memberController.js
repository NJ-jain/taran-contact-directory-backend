const Member = require('../models/memberModel');
const User = require('../models/userModel');
const { uploadToImageKit, deleteFromImageKit } = require('../utils/imageKit');
const multer = require('multer');
const mongoose = require('mongoose');

// Configure multer to store files in memory with size limit (5MB)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Helper to escape regex special characters to prevent ReDoS
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

const memberController = {
  // Create a new member
  createMember: [
    upload.single('dp'),
    async (req, res) => {
      let savedMember = null;
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

        if (!firstName || !lastName) {
          return res.status(400).json({ success: false, message: 'First name and last name are required' });
        }

        const isFamilyHead = familyHead === 'true' || familyHead === true;
        const normalizedEmail = email && email.trim() !== '' ? email.trim().toLowerCase() : undefined;

        // Check if member with this email already exists (only if an email was provided)
        if (normalizedEmail) {
          const emailExists = await Member.exists({ email: normalizedEmail });
          if (emailExists) {
            return res.status(400).json({ success: false, message: 'A member with this email already exists' });
          }
        }

        // Create and save new member
        const newMember = new Member({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: normalizedEmail,
          phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
          dob: dob || undefined,
          address: address ? address.trim() : undefined,
          userId: req.userId,
          familyHead: isFamilyHead,
          isApproved: false // Newly created members need admin approval
        });

        savedMember = await newMember.save();

        // Handle profile picture upload if file exists (checks both single and fields)
        const dpFile = req.file || (req.files && req.files.dp ? req.files.dp[0] : null);
        if (dpFile) {
          try {
            const dpUrl = await uploadToImageKit(dpFile, savedMember._id.toString(), "members");
            savedMember.dp = dpUrl;
            await savedMember.save();
          } catch (uploadError) {
            console.error('ImageKit upload warning during member creation:', uploadError.message);
            // Member is still created even if ImageKit image upload fails
          }
        }

        // Update user's membersArray and optionally familyHeadId
        const updateData = { $addToSet: { membersArray: savedMember._id } };
        if (isFamilyHead) {
          updateData.familyHeadId = savedMember._id;
        }
        await User.findByIdAndUpdate(req.userId, updateData);

        // Fetch the updated user data with populated members
        const updatedUser = await User.findById(req.userId)
          .select('-password')
          .populate({ path: 'membersArray', model: 'Member' });

        res.status(201).json(updatedUser);

      } catch (error) {
        console.error('Error creating member:', error);
        res.status(500).json({ success: false, message: 'Error creating member', error: error.message });
      }
    }
  ],

  // Get all approved members
  getAllMembers: async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
          success: false, 
          message: 'Database temporarily unavailable' 
        });
      }

      const members = await Member.find({ isApproved: true })
        .populate({
          path: 'userId',
          select: 'email category banner aboutUs'
        })
        .sort({ firstName: 1, lastName: 1 });

      res.status(200).json(members);
    } catch (error) {
      console.error('Error in getAllMembers:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching members', 
        error: error.message 
      });
    }
  },

  // Get single member by ID
  getMember: async (req, res) => {
    try {
      const { memberId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ success: false, message: 'Invalid member ID' });
      }

      const member = await Member.findById(memberId)
        .populate({
          path: 'userId',
          select: '-password',
          populate: {
            path: 'membersArray',
            match: { _id: { $ne: memberId } }
          }
        });

      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }

      res.status(200).json({ member });
    } catch (error) {
      console.error('Error fetching member:', error);
      res.status(500).json({ success: false, message: 'Error fetching member', error: error.message });
    }
  },

  // Update member
  updateMember: [
    upload.single('dp'),
    async (req, res) => {
      try {
        const { memberId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
          return res.status(400).json({ success: false, message: 'Invalid member ID' });
        }

        const updates = {};
        const { firstName, lastName, email, phoneNumber, address, familyHead, dob } = req.body;

        if (firstName) updates.firstName = firstName.trim();
        if (lastName) updates.lastName = lastName.trim();
        if (email !== undefined) {
          updates.email = email.trim() !== '' ? email.trim().toLowerCase() : undefined;
        }
        if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber.trim();
        if (address !== undefined) updates.address = address.trim();
        if (familyHead !== undefined) updates.familyHead = familyHead === 'true' || familyHead === true;
        if (dob) updates.dob = dob;

        // Verify member belongs to the authenticated user
        const existingMember = await Member.findOne({ _id: memberId, userId: req.userId });
        if (!existingMember) {
          return res.status(404).json({ success: false, message: 'Member not found or unauthorized' });
        }

        // Handle image upload
        if (req.file) {
          try {
            const dpUrl = await uploadToImageKit(req.file, memberId, "members");
            updates.dp = dpUrl;
          } catch (uploadError) {
            console.error('ImageKit upload error during member update:', uploadError.message);
          }
        }

        // Update familyHeadId in user document if needed
        if (updates.familyHead !== undefined) {
          const userUpdate = updates.familyHead ? { familyHeadId: existingMember._id } : { familyHeadId: null };
          await User.findByIdAndUpdate(req.userId, userUpdate);
        }

        // Apply updates to member
        await Member.findOneAndUpdate(
          { _id: memberId, userId: req.userId },
          updates,
          { new: true, runValidators: true }
        );

        // Fetch the updated user data
        const updatedUser = await User.findById(req.userId)
          .select('-password')
          .populate({ path: 'membersArray', model: 'Member' });

        res.status(200).json(updatedUser);

      } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ success: false, message: 'Error updating member', error: error.message });
      }
    }
  ],

  // Delete member
  deleteMember: async (req, res) => {
    try {
      const { memberId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ success: false, message: 'Invalid member ID' });
      }

      const member = await Member.findOneAndDelete({ _id: memberId, userId: req.userId });
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found or unauthorized' });
      }

      // Update user's membersArray and familyHeadId
      const updateData = { $pull: { membersArray: memberId } };
      if (member.familyHead) {
        updateData.familyHeadId = null;
      }
      await User.findByIdAndUpdate(req.userId, updateData);

      // Attempt to delete DP from ImageKit if exists
      try {
        await deleteFromImageKit(member._id.toString(), "members");
      } catch (imgError) {
        console.warn('Note: DP image deletion failed or file did not exist on ImageKit:', imgError.message);
      }

      // Fetch the updated user data
      const updatedUser = await User.findById(req.userId)
        .select('-password')
        .populate({ path: 'membersArray', model: 'Member' });

      res.status(200).json({ 
        success: true, 
        message: 'Member deleted successfully', 
        member, 
        user: updatedUser 
      });

    } catch (error) {
      console.error('Error deleting member:', error);
      res.status(500).json({ success: false, message: 'Error deleting member', error: error.message });
    }
  },

  // Search members safely against ReDoS
  searchMembers: async (req, res) => {
    try {
      const searchQuery = req.query.q;
      if (!searchQuery || searchQuery.trim() === '') {
        return res.status(200).json([]);
      }

      const safeQuery = escapeRegex(searchQuery.trim());
      const regex = new RegExp(safeQuery, 'i');

      const searchResults = await Member.find({
        isApproved: true,
        $or: [
          { phoneNumber: regex },
          { email: regex },
          { firstName: regex },
          { lastName: regex },
          { address: regex }
        ]
      })
      .populate({
        path: 'userId',
        select: 'email category banner aboutUs'
      })
      .limit(50);

      res.status(200).json(searchResults);
    } catch (error) {
      console.error('Error searching members:', error);
      res.status(500).json({ success: false, message: 'Error searching members', error: error.message });
    }
  }
};

module.exports = memberController;