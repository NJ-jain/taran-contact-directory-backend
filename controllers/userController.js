const User = require('../models/userModel.js');
const multer = require('multer');
const { uploadToImageKit } = require('../utils/imageKit');
const Admin = require('../models/adminModel.js');

// Configure multer to store files in memory (max 5MB)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Helper function to handle banner upload
async function handleBannerUpload(file, userId) {
  if (!file) return null;
  return await uploadToImageKit(file, userId.toString(), 'user');
}

// Get authenticated user details
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires')
      .populate({ path: 'membersArray', model: 'Member' });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user profile with strict field whitelisting (prevent mass assignment)
exports.updateUser = [
  upload.single('bannerImage'),
  async (req, res) => {
    try {
      const allowedFields = ['aboutUs', 'category'];
      const updates = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      // Handle banner upload if present
      if (req.file) {
        try {
          const bannerUrl = await handleBannerUpload(req.file, req.userId);
          if (bannerUrl) {
            updates.banner = bannerUrl;
          }
        } catch (uploadError) {
          console.error('Error uploading banner to ImageKit:', uploadError.message);
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.userId, 
        updates, 
        { new: true, runValidators: true }
      )
      .select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires')
      .populate({ path: 'membersArray', model: 'Member' });

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error in updateUser:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
];

// Request admin approval for directory inclusion
exports.adminApproval = async (req, res) => {
  try {
    const userId = req.userId;

    const globalUserArray = await Admin.GlobalUserArray.findOneAndUpdate(
      {},
      { $addToSet: { userArray: userId } },
      { upsert: true, new: true }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Approval request submitted successfully', 
      data: globalUserArray 
    });
  } catch (error) {
    console.error('Error in adminApproval:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
