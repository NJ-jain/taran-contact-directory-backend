const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoute.js');

dotenv.config();
connectDB();

const app = express();

// Dynamically compile allowed origins
const defaultOrigins = [
  'https://www.taran.co.in',
  'https://taran.co.in',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080'
];

if (process.env.FRONTEND_URL) {
  defaultOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}

if (process.env.ALLOWED_ORIGINS) {
  const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, ''));
  defaultOrigins.push(...customOrigins);
}

const uniqueAllowedOrigins = [...new Set(defaultOrigins)];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    if (uniqueAllowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked request from origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'authorization',
    'x-auth-token', 
    'adminauthorization', 
    'AdminAuthorization',
    'x-admin-secret-key'
  ]
};

// CORS configuration
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// General API Rate Limiting (300 requests per 15 mins)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

// Stricter Rate Limiting for Authentication & Admin Endpoints (20 requests per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes'
  }
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/admin/admin-login', authLimiter);
app.use('/api/admin/create-admin', authLimiter);

// Request logging middleware for debugging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'No origin'}`);
    next();
  });
}

// Parse JSON bodies with reasonable limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Application Routes
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
  console.error('Global error handler caught:', err.message);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`API check: http://localhost:${PORT}/api`);
});
