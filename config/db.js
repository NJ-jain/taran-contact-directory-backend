const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.name}`);
    
    // Test the connection
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Full error:', error);
    
    // Don't exit immediately on Vercel, let the app continue
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;