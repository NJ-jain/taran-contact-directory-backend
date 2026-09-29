const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  dp: {
    type: String, // URL for profile picture
  },
  address: {
    type: String,
    trim: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Allows multiple documents without email without triggering unique index collision
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User who owns this member
    required: true,
    index: true,
  },
  dob: {
    type: Date,
  },
  familyHead: {
    type: Boolean,
    default: false,
  },
  isApproved: { 
    type: Boolean, 
    default: false,
    index: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema);