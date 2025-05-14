const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  try {
    const token = req.header('AdminAuthorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.adminId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

module.exports = adminAuth;