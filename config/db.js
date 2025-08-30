const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // If already connected, return existing connection
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    // Check if MONGO_URI exists
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI environment variable is not set');
      throw new Error('MONGO_URI environment variable is not set');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    
    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });
    
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    // Don't exit process in Vercel environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;