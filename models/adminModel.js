const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  // Define the Admin schema fields here
  // For example:
  username: { type: String, required: true },
  password: { type: String, required: true },
  userArray: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to User schema
  }],
  // ... any other fields ...
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;