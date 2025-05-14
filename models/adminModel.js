const mongoose = require('mongoose');

// Define a new schema for the global user array
const globalUserArraySchema = new mongoose.Schema({
  userArray: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to User schema
  }],
});

// Create a model for the global user array
const GlobalUserArray = mongoose.model('GlobalUserArray', globalUserArraySchema);

const adminSchema = new mongoose.Schema({
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // userArray: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User', // Reference to User schema
  // }],
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = {
  Admin,
  GlobalUserArray, // Export the new GlobalUserArray model
};
