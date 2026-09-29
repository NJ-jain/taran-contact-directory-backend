const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  try {
    // Check multiple header variations safely
    const authHeader = req.header('AdminAuthorization') || 
                       req.header('adminauthorization') || 
                       req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin authorization header missing, access denied' 
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7).trim() 
      : authHeader.trim();

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No admin authentication token, access denied' 
      });
    }

    const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      console.error('CRITICAL: Neither ADMIN_JWT_SECRET nor JWT_SECRET is configured!');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error' 
      });
    }

    const decoded = jwt.verify(token, secret);
    req.adminId = decoded.id || decoded.adminId;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Admin authentication failed or token expired' 
    });
  }
};

module.exports = adminAuth;