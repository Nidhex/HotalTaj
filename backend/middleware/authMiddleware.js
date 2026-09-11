const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes by validating incoming JWT in Authorization header.
 * Attaches validated user object to request (req.user) minus password field.
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header as "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header string
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature against environment secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DB based on decoded ID, excluding the select:false password field
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(`[Auth Error] Token verification failed: ${error.message}`);
      res.status(401);
      return next(new Error('Not authorized, token verification failed'));
    }
  }

  // If no token is provided
  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no security token provided'));
  }
};

/**
 * Role authorization checks helper middleware
 * @param {...String} roles Allowed list of roles (admin, concierge, etc.)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource`));
    }
    next();
  };
};

module.exports = { protect, authorize };
