require('dotenv').config(); // Load environment variables from .env file at the root of the project

const mongoose = require('mongoose');
const Member = require('../models/memberModel'); // Adjust the path as necessary

// MongoDB connection string from environment variable
const mongoURI = 'mongodb+srv://nnjain5272:t%40r%40nt%40r%40n@cluster0.ky1zz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected for migration');
    addDobField(); // Call the migration function after a successful connection
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Function to add dob field to all members
async function addDobField() {
  try {
    // Define a default DOB value or logic to determine it
    const defaultDob = new Date('1990-01-01'); // Example default DOB

    // Update all members to have the default DOB if they don't have one
    const result = await Member.updateMany(
      { dob: { $exists: false } }, // Filter for documents without a dob field
      { $set: { dob: defaultDob } } // Set the default dob value
    );

    console.log('Migration completed:', result);
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    // Close the Mongoose connection
    mongoose.connection.close();
  }
}