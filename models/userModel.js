const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  banner: {
    type: String, // Store the image URL for the banner
  },
  membersArray: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member', // Reference to Member schema
  }],
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  category: {
    type: String, // Define as per your category requirements
  },
  aboutUs: {
    type: String,
  },
  familyHeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member', // Family head is a reference to Member
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

