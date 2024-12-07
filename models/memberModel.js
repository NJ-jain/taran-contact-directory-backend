const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  dp: {
    type: String, // URL for profile picture
  },
  address: {
    type: String,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User who owns this member
    required: true,
  },
  dob: {
    type: Date, // Add the dob field as a Date type
  },
  familyHead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema); 