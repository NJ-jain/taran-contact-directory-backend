const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoute.js');

dotenv.config();
connectDB();

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: "https://www.taran.co.in",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Adminauthorization"],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/`);
  console.log(`API health check available at: http://localhost:${PORT}/api`);
  console.log(`Network access available at: http://192.168.1.14:${PORT}/`);
  console.log(`Network API available at: http://192.168.1.14:${PORT}/api`);
});
