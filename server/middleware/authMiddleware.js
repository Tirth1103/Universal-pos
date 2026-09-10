const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');
const { JWT_SECRET } = require('../config/jwt');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (getIsConnected()) {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.'
        });
      }

      if (user.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Your store account has been deactivated.'
        });
      }

      req.user = user.toSafeObject ? user.toSafeObject() : user;
      req.userId = user._id.toString();
      next();
    } else {
      // In-Memory Fallback
      const { memoryUsers } = require('../controllers/authController');
      const user = (memoryUsers || []).find(
        u => (u._id && u._id.toString() === decoded.id) || 
             (u.id && u.id.toString() === decoded.id) ||
             (u.email && u.email.toLowerCase() === (decoded.email || '').toLowerCase())
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists in session.'
        });
      }

      const safeUser = { ...user };
      delete safeUser.password;
      req.user = safeUser;
      req.userId = (user._id || user.id || decoded.id).toString();
      next();
    }
  } catch (error) {
    console.error('[Auth Middleware Error]:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Token is invalid or expired.'
    });
  }
};

module.exports = {
  protect
};
