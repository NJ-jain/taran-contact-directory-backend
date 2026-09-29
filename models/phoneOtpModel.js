const mongoose = require('mongoose');

const phoneOtpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  attempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // MongoDB TTL index: automatically deletes document after 10 minutes (600 seconds)
  },
});

module.exports = mongoose.model('PhoneOtp', phoneOtpSchema);
