const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Middleware to protect routes.
 * Expects a valid JWT in the Authorization header (Bearer token).
 * Attaches the user object to the request.
 */
const requireAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authorized to access this route' },
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to req, excluding password
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User belonging to this token no longer exists' },
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authorized, token failed' },
    });
  }
};

module.exports = requireAuth;
