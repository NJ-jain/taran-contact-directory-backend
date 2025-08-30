console.log('🧪 Testing module resolution...');

try {
  // Test loading the main dependencies
  const express = require('express');
  console.log('✅ Express loaded successfully');
  
  const cors = require('cors');
  console.log('✅ CORS loaded successfully');
  
  const mongoose = require('mongoose');
  console.log('✅ Mongoose loaded successfully');
  
  const bcryptjs = require('bcryptjs');
  console.log('✅ bcryptjs loaded successfully');
  
  const jsonwebtoken = require('jsonwebtoken');
  console.log('✅ JWT loaded successfully');
  
  const nodemailer = require('nodemailer');
  console.log('✅ Nodemailer loaded successfully');
  
  const multer = require('multer');
  console.log('✅ Multer loaded successfully');
  
  const imagekit = require('imagekit');
  console.log('✅ ImageKit loaded successfully');
  
  const axios = require('axios');
  console.log('✅ Axios loaded successfully');
  
  const dotenv = require('dotenv');
  console.log('✅ dotenv loaded successfully');
  
  // Test loading route files
  const authRoutes = require('./routes/authRoutes');
  console.log('✅ Auth routes loaded successfully');
  
  const memberRoutes = require('./routes/memberRoutes');
  console.log('✅ Member routes loaded successfully');
  
  const userRoutes = require('./routes/userRoutes');
  console.log('✅ User routes loaded successfully');
  
  const adminRoutes = require('./routes/adminRoute');
  console.log('✅ Admin routes loaded successfully');
  
  console.log('\n🎉 All modules loaded successfully! No gopd errors.');
  console.log('✅ Your application is ready for deployment.');
  
} catch (error) {
  console.error('❌ Error loading modules:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
