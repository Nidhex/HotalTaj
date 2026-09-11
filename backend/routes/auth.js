const express = require('express');
const router = express.Router();

// Import controllers
const {
  registerUser,
  verifyEmail,
  loginUser,
  getUserProfile,
} = require('../controllers/authController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);

// Protected endpoint (requires Bearer JWT token in headers)
router.get('/profile', protect, getUserProfile);

module.exports = router;
