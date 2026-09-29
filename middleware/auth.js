const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization') || req.header('authorization');
  
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Authorization header missing, access denied' });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7).trim() 
    : authHeader.trim();
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No authentication token, access denied' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET environment variable is missing!');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.userId;
    req.memberId = verified.memberId;
    req.userRole = verified.role;
    req.phoneNumber = verified.phoneNumber;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token verification failed or expired, authorization denied' });
  }
};

module.exports = auth;