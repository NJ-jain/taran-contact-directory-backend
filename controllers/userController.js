const User = require('../models/userModel.js');
const multer = require('multer');
const { uploadToImageKit } = require('../utils/imageKit');
const Admin = require('../models/adminModel.js');

// Configure multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to handle image upload and update user
async function handleImageUpload(req, user) {
  if (req.file) {
    const filePath = await uploadToImageKit(req.file, user._id, `user`);
    user.banner = filePath;
    await user.save();
  }
}


// Create a new user
exports.createUser = [
  upload.single('bannerImage'),
  async (req, res) => {
    try {
      const user = new User(req.body);
      await user.save();
      await handleImageUpload(req, user);

      // Exclude password from the response
      const userWithoutPassword = await User.findById(user._id).select('-password');
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
];

// Get a user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password') // Exclude password from the result
      .populate({ path: 'membersArray', model: 'Member', strictPopulate: false });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a user
exports.updateUser = [
  upload.single('bannerImage'),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.userId, req.body, { new: true })
        .select('-password') // Exclude password from the result
        .populate({ path: 'membersArray', model: 'Member', strictPopulate: false });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await handleImageUpload(req, user);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
];


exports.adminApproval = async (req, res) => {
  try {
    const userId = req.userId;

    // Use findOneAndUpdate with $addToSet to ensure no duplicates
    const globalUserArray = await Admin.GlobalUserArray.findOneAndUpdate(
      {}, // An empty filter selects the first document found
      { $addToSet: { userArray: userId } }, // Adds userId to the array only if it doesn't already exist
      { upsert: true, new: true, useFindAndModify: false } // Options to create if not exists, return new doc, and use native findOneAndUpdate
    );

    res.status(200).json(globalUserArray);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



