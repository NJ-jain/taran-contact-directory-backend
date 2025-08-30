const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoute.js');

dotenv.config();

const app = express();

// CORS configuration with environment-based origins
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://www.taran.co.in', 'https://taran.co.in']
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'https://www.taran.co.in', 'https://taran.co.in'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Adminauthorization'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Enable CORS
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Taran Contact Directory Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API health check endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'success',
    message: 'Taran Contact Directory API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      members: '/api/members',
      admin: '/api/admin'
    }
  });
});

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database unavailable'
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/`);
    console.log(`API health check available at: http://localhost:${PORT}/api`);
    console.log(`Network access available at: http://192.168.1.14:${PORT}/`);
    console.log(`Network API available at: http://192.168.1.14:${PORT}/api`);
  });
}

module.exports = app;
